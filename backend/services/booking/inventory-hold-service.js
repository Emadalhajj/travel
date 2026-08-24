import AppError from "../../utils/AppError.js";
import Inventory from "../../models/inventory-model.js";
import InventoryHold from "../../models/inventory-hold-model.js";
import {
  INVENTORY_HOLD_STATUSES,
  TERMINAL_INVENTORY_HOLD_STATUSES,
} from "../../constants/inventory/inventory-hold-statuses.js";
import {
  releaseInventory,
  reserveInventory,
} from "./inventory-service.js";
import {
  releaseProgramSeats,
  reserveProgramSeats,
} from "../umrah-programs/umrah-program-service.js";

const DEFAULT_HOLD_DURATION_MS = 15 * 60 * 1000;
const terminalStatuses = new Set(TERMINAL_INVENTORY_HOLD_STATUSES);

const positiveInteger = (value, field) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new AppError(`${field} must be a positive integer`, 400, field);
  }
  return number;
};

const normalizeResources = ({ programReservation, inventoryReservations = [] }) => ({
  programReservation: programReservation
    ? {
        program: programReservation.program || programReservation.programId,
        seats: positiveInteger(programReservation.seats, "seats"),
      }
    : null,
  inventoryReservations: inventoryReservations.map((resource) => ({
    inventoryType: resource.inventoryType,
    itemId: resource.itemId,
    startDate: resource.startDate,
    endDate: resource.endDate,
    quantity: positiveInteger(
      resource.quantity ?? resource.requested,
      "quantity",
    ),
    defaultTotal: Math.max(Number(resource.defaultTotal) || 0, 0),
  })),
});

const asPlain = (document) =>
  typeof document?.toObject === "function" ? document.toObject() : document;

export const createInventoryHoldServiceLayer = ({
  HoldModel = InventoryHold,
  InventoryModel = Inventory,
  reserveDailyInventory = reserveInventory,
  releaseDailyInventory = releaseInventory,
  reserveSeats = reserveProgramSeats,
  releaseSeats = releaseProgramSeats,
  now = () => new Date(),
} = {}) => {
  const waitForConcurrentHold = async (key) => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const existing = await HoldModel.findOne({
        idempotencyKey: key,
        isActive: true,
      });
      if (!existing || existing.status !== INVENTORY_HOLD_STATUSES.CREATING) {
        return existing;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return HoldModel.findOne({ idempotencyKey: key, isActive: true });
  };

  const releaseResources = async ({ hold, req, expiration = false }) => {
    const resources = [...(hold.inventoryReservations || [])].reverse();

    for (const resource of resources) {
      if (resource.releasedAt) continue;
      await releaseDailyInventory({
        Inventory: InventoryModel,
        inventoryType: resource.inventoryType,
        itemId: resource.itemId,
        startDate: resource.startDate,
        endDate: resource.endDate,
        released: resource.quantity,
        req,
      });
      await HoldModel.updateOne(
        { _id: hold._id, "inventoryReservations._id": resource._id },
        { $set: { "inventoryReservations.$.releasedAt": now() } },
      );
    }

    if (hold.programReservation && !hold.programReservation.releasedAt) {
      await releaseSeats({
        programId: hold.programReservation.program,
        seats: hold.programReservation.seats,
        req,
      });
      await HoldModel.updateOne(
        { _id: hold._id },
        { $set: { "programReservation.releasedAt": now() } },
      );
    }

    const releasedAt = now();
    return HoldModel.findOneAndUpdate(
      { _id: hold._id, status: INVENTORY_HOLD_STATUSES.RELEASING },
      {
        $set: {
          status: expiration
            ? INVENTORY_HOLD_STATUSES.EXPIRED
            : INVENTORY_HOLD_STATUSES.RELEASED,
          isActive: false,
          releasedAt,
          failureReason: "",
        },
      },
      { new: true },
    );
  };

  const releaseHold = async ({ holdId, reason = "", req = null, expiration = false }) => {
    let hold = await HoldModel.findOneAndUpdate(
      {
        _id: holdId,
        status: {
          $in: [
            INVENTORY_HOLD_STATUSES.HELD,
            INVENTORY_HOLD_STATUSES.RELEASE_FAILED,
          ],
        },
        isActive: true,
      },
      {
        $set: {
          status: INVENTORY_HOLD_STATUSES.RELEASING,
          releaseReason: String(reason || "").trim(),
        },
      },
      { new: true },
    );

    if (!hold) {
      hold = await HoldModel.findById(holdId);
      if (!hold) throw new AppError("Inventory hold not found", 404, "holdId");
      if (terminalStatuses.has(hold.status)) return hold;
      throw new AppError("Inventory hold is being processed", 409, "status");
    }

    try {
      return await releaseResources({ hold: asPlain(hold), req, expiration });
    } catch (error) {
      await HoldModel.updateOne(
        { _id: hold._id, status: INVENTORY_HOLD_STATUSES.RELEASING },
        {
          $set: {
            status: INVENTORY_HOLD_STATUSES.RELEASE_FAILED,
            failureReason: error?.message || "Inventory hold release failed",
          },
        },
      );
      throw error;
    }
  };

  const createHold = async ({
    idempotencyKey,
    draftBooking = null,
    paymentTransaction = null,
    user = null,
    programReservation = null,
    inventoryReservations = [],
    expiresAt = null,
    req = null,
  }) => {
    const key = String(idempotencyKey || "").trim();
    if (!key) throw new AppError("idempotencyKey is required", 400, "idempotencyKey");

    const resources = normalizeResources({ programReservation, inventoryReservations });
    if (!resources.programReservation && resources.inventoryReservations.length === 0) {
      throw new AppError("Inventory hold requires at least one resource", 400, "resources");
    }

    const expiry = expiresAt ? new Date(expiresAt) : new Date(now().getTime() + DEFAULT_HOLD_DURATION_MS);
    if (Number.isNaN(expiry.getTime()) || expiry <= now()) {
      throw new AppError("Inventory hold expiry must be in the future", 400, "expiresAt");
    }

    let hold;
    try {
      [hold] = await HoldModel.create([{
        idempotencyKey: key,
        isActive: true,
        draftBooking,
        paymentTransaction,
        user,
        status: INVENTORY_HOLD_STATUSES.CREATING,
        ...resources,
        expiresAt: expiry,
      }]);
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const existing = await waitForConcurrentHold(key);
      if (
        existing?.status === INVENTORY_HOLD_STATUSES.HELD &&
        new Date(existing.expiresAt) <= now()
      ) {
        await releaseHold({
          holdId: existing._id,
          reason: "expired_before_checkout_reuse",
          req,
          expiration: true,
        });
        return createHold({
          idempotencyKey: key,
          draftBooking,
          paymentTransaction,
          user,
          programReservation,
          inventoryReservations,
          expiresAt,
          req,
        });
      }
      if (existing?.status === INVENTORY_HOLD_STATUSES.HELD) {
        return existing;
      }
      throw new AppError("Inventory hold creation is already in progress", 409, "idempotencyKey");
    }

    const reservedInventory = [];
    let programReserved = false;
    try {
      if (resources.programReservation) {
        await reserveSeats({
          programId: resources.programReservation.program,
          seats: resources.programReservation.seats,
          req,
        });
        programReserved = true;
      }

      for (const resource of resources.inventoryReservations) {
        await reserveDailyInventory({
          Inventory: InventoryModel,
          inventoryType: resource.inventoryType,
          itemId: resource.itemId,
          startDate: resource.startDate,
          endDate: resource.endDate,
          requested: resource.quantity,
          defaultTotal: resource.defaultTotal,
          req,
        });
        reservedInventory.push(resource);
      }

      return await HoldModel.findOneAndUpdate(
        { _id: hold._id, status: INVENTORY_HOLD_STATUSES.CREATING },
        { $set: { status: INVENTORY_HOLD_STATUSES.HELD, heldAt: now() } },
        { new: true },
      );
    } catch (error) {
      for (const resource of reservedInventory.reverse()) {
        await releaseDailyInventory({
          Inventory: InventoryModel,
          inventoryType: resource.inventoryType,
          itemId: resource.itemId,
          startDate: resource.startDate,
          endDate: resource.endDate,
          released: resource.quantity,
          req,
        });
      }
      if (programReserved) {
        await releaseSeats({
          programId: resources.programReservation.program,
          seats: resources.programReservation.seats,
          req,
        });
      }
      await HoldModel.findOneAndUpdate(
        { _id: hold._id },
        {
          $set: {
            status: INVENTORY_HOLD_STATUSES.RELEASED,
            isActive: false,
            releasedAt: now(),
            releaseReason: "creation_failed",
            failureReason: error?.message || "Inventory hold creation failed",
          },
        },
        { new: true },
      );
      throw error;
    }
  };

  const commitHold = async ({ holdId }) => {
    const committedAt = now();
    const committed = await HoldModel.findOneAndUpdate(
      {
        _id: holdId,
        status: INVENTORY_HOLD_STATUSES.HELD,
        expiresAt: { $gt: committedAt },
      },
      {
        $set: {
          status: INVENTORY_HOLD_STATUSES.COMMITTED,
          isActive: false,
          committedAt,
        },
      },
      { new: true },
    );
    if (committed) return committed;

    const hold = await HoldModel.findById(holdId);
    if (!hold) throw new AppError("Inventory hold not found", 404, "holdId");
    if (hold.status === INVENTORY_HOLD_STATUSES.COMMITTED) return hold;
    throw new AppError("Only an active hold can be committed", 409, "status");
  };

  const expireHolds = async ({ limit = 100, req = null } = {}) => {
    const expiredCandidates = await HoldModel.find({
      status: INVENTORY_HOLD_STATUSES.HELD,
      expiresAt: { $lte: now() },
    }).select("_id").limit(Math.max(1, Math.min(Number(limit) || 100, 500)));

    const results = await Promise.allSettled(
      expiredCandidates.map((hold) =>
        releaseHold({ holdId: hold._id, reason: "expired", req, expiration: true }),
      ),
    );
    const holds = results.map((result, index) => ({
      holdId: expiredCandidates[index]._id,
      status: result.status === "fulfilled" ? "expired" : "failed",
      hold: result.status === "fulfilled" ? result.value : null,
      error:
        result.status === "rejected"
          ? result.reason?.message || "Inventory hold expiration failed"
          : "",
    }));
    return {
      processed: results.length,
      expired: results.filter((result) => result.status === "fulfilled").length,
      failed: results.filter((result) => result.status === "rejected").length,
      holds,
    };
  };

  const getHoldForCommit = async ({
    holdId = null,
    draftBooking = null,
    paymentTransaction = null,
    allowExpired = false,
  }) => {
    const filter = {};
    if (holdId) filter._id = holdId;
    if (draftBooking) filter.draftBooking = draftBooking;
    if (paymentTransaction) filter.paymentTransaction = paymentTransaction;

    const hold = await HoldModel.findOne(filter);
    const isCommitted = hold?.status === INVENTORY_HOLD_STATUSES.COMMITTED;
    const isValidActiveHold =
      hold?.status === INVENTORY_HOLD_STATUSES.HELD &&
      hold?.isActive === true &&
      (allowExpired || new Date(hold.expiresAt) > now());

    if (!isCommitted && !isValidActiveHold) {
      throw new AppError(
        "No valid inventory hold matches this payment and draft",
        409,
        "inventoryHold",
      );
    }
    return hold;
  };

  const findActiveHold = async ({ paymentTransaction, draftBooking = null }) => {
    const filter = {
      paymentTransaction,
      status: INVENTORY_HOLD_STATUSES.HELD,
      isActive: true,
      expiresAt: { $gt: now() },
    };
    if (draftBooking) filter.draftBooking = draftBooking;
    return HoldModel.findOne(filter);
  };

  const findHoldByPaymentTransaction = async ({ paymentTransaction }) =>
    HoldModel.findOne({ paymentTransaction }).sort({ createdAt: -1 });

  const findHoldsForRecovery = async ({ recoveryNow = now(), limit = 100 } = {}) =>
    HoldModel.find({
      isActive: true,
      status: {
        $in: [
          INVENTORY_HOLD_STATUSES.HELD,
          INVENTORY_HOLD_STATUSES.RELEASE_FAILED,
        ],
      },
      $or: [
        { expiresAt: { $lte: recoveryNow } },
        { status: INVENTORY_HOLD_STATUSES.RELEASE_FAILED },
        { paymentTransaction: { $ne: null } },
      ],
    })
      .sort({ expiresAt: 1, _id: 1 })
      .limit(Math.max(1, Math.min(Number(limit) || 100, 500)));

  const updateHoldExpiry = async ({ holdId, expiresAt }) => {
    const requestedExpiry = new Date(expiresAt);
    if (Number.isNaN(requestedExpiry.getTime()) || requestedExpiry <= now()) {
      throw new AppError("Inventory hold expiry must be in the future", 400, "expiresAt");
    }

    const updated = await HoldModel.findOneAndUpdate(
      {
        _id: holdId,
        status: INVENTORY_HOLD_STATUSES.HELD,
        isActive: true,
        expiresAt: { $gt: requestedExpiry },
      },
      { $set: { expiresAt: requestedExpiry } },
      { new: true },
    );
    return updated || HoldModel.findById(holdId);
  };

  return {
    createInventoryHoldService: createHold,
    commitInventoryHoldService: commitHold,
    releaseInventoryHoldService: releaseHold,
    expireInventoryHoldsService: expireHolds,
    getInventoryHoldForCommitService: getHoldForCommit,
    findActiveInventoryHoldService: findActiveHold,
    findInventoryHoldByPaymentTransactionService: findHoldByPaymentTransaction,
    findInventoryHoldsForRecoveryService: findHoldsForRecovery,
    updateInventoryHoldExpiryService: updateHoldExpiry,
  };
};

const inventoryHoldServices = createInventoryHoldServiceLayer();

export const createInventoryHoldService = inventoryHoldServices.createInventoryHoldService;
export const commitInventoryHoldService = inventoryHoldServices.commitInventoryHoldService;
export const releaseInventoryHoldService = inventoryHoldServices.releaseInventoryHoldService;
export const expireInventoryHoldsService = inventoryHoldServices.expireInventoryHoldsService;
export const getInventoryHoldForCommitService = inventoryHoldServices.getInventoryHoldForCommitService;
export const findActiveInventoryHoldService = inventoryHoldServices.findActiveInventoryHoldService;
export const findInventoryHoldByPaymentTransactionService = inventoryHoldServices.findInventoryHoldByPaymentTransactionService;
export const findInventoryHoldsForRecoveryService = inventoryHoldServices.findInventoryHoldsForRecoveryService;
export const updateInventoryHoldExpiryService = inventoryHoldServices.updateInventoryHoldExpiryService;
