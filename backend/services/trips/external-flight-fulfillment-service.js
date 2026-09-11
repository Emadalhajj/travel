import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";
import { EXTERNAL_FULFILLMENT_STATUSES } from
  "../../constants/payments/external-fulfillment-statuses.js";
import {
  acquireExternalFulfillmentLockService,
  findPaymentTransactionService,
  initializeExternalFulfillmentService,
  updateExternalFulfillmentService,
} from "../payment/paymentTransaction-service.js";
import {
  createExternalFlightOrderFromDraft,
} from "./external-flight-order-service.js";
import {
  findExternalFlightOrdersByOffer,
  getExternalFlightOrder,
} from "./providers/flight-provider-factory.js";

const safeOrderSnapshot = (order) => order ? ({
  provider: order.provider,
  orderId: order.orderId,
  offerId: order.offerId,
  bookingReference: order.bookingReference,
  status: order.status,
  total: order.total,
  slices: order.slices || [],
  passengers: order.passengers || [],
  availableActions: order.availableActions || [],
  createdAt: order.createdAt || null,
}) : null;

const markFromOrder = async ({ transactionId, order, update }) => {
  if (order?.status === "CONFIRMED") {
    return update({
      transactionId,
      status: EXTERNAL_FULFILLMENT_STATUSES.CONFIRMED,
      updates: {
        providerOrderId: order.orderId,
        providerStatus: order.status,
        confirmedAt: new Date(),
        retryable: false,
        orderSnapshot: safeOrderSnapshot(order),
      },
    });
  }
  return update({
    transactionId,
    status: EXTERNAL_FULFILLMENT_STATUSES.AWAITING_PROVIDER,
    updates: {
      providerOrderId: order?.orderId || "",
      providerStatus: order?.status || "PENDING",
      retryable: true,
      orderSnapshot: safeOrderSnapshot(order),
    },
  });
};

export const createExternalFlightFulfillmentLayer = (dependencies = {}) => {
  const findTransaction = dependencies.findTransaction || findPaymentTransactionService;
  const initialize = dependencies.initialize || initializeExternalFulfillmentService;
  const acquire = dependencies.acquire || acquireExternalFulfillmentLockService;
  const update = dependencies.update || updateExternalFulfillmentService;
  const loadDraft = dependencies.loadDraft || ((draftId) => DraftBooking.findOne({
    _id: draftId,
    isDeleted: false,
  }));
  const createOrder = dependencies.createOrder || createExternalFlightOrderFromDraft;
  const getOrder = dependencies.getOrder || getExternalFlightOrder;
  const findOrders = dependencies.findOrders || findExternalFlightOrdersByOffer;

  const reconcile = async ({ transaction }) => {
    const fulfillment = transaction.externalFulfillment || {};
    let order = null;
    if (fulfillment.providerOrderId) {
      order = await getOrder({
        provider: fulfillment.provider,
        orderId: fulfillment.providerOrderId,
      });
    } else {
      const orders = await findOrders({
        provider: fulfillment.provider,
        offerId: fulfillment.offerId,
      });
      order = orders?.find(({ status }) => status === "CONFIRMED") || orders?.[0] || null;
    }
    if (!order) return update({
      transactionId: transaction._id,
      status: EXTERNAL_FULFILLMENT_STATUSES.AWAITING_PROVIDER,
      updates: { retryable: true, providerStatus: "UNKNOWN" },
    });
    return markFromOrder({ transactionId: transaction._id, order, update });
  };

  const fulfill = async ({ transaction, draft: suppliedDraft = null }) => {
    const draft = suppliedDraft || await loadDraft(transaction.draftBooking);
    const external = draft?.trip?.external;
    if (!external?.provider || !external?.offerId) {
      return { required: false, confirmed: true, transaction };
    }

    let current = transaction.externalFulfillment?.required
      ? transaction
      : await initialize({
          transactionId: transaction._id,
          provider: external.provider,
          offerId: external.offerId,
        });
    if (!current) current = await findTransaction({ transactionId: transaction._id });
    const status = current.externalFulfillment?.status;
    if (status === EXTERNAL_FULFILLMENT_STATUSES.CONFIRMED) {
      return { required: true, confirmed: true, transaction: current };
    }
    if ([
      EXTERNAL_FULFILLMENT_STATUSES.PROCESSING,
      EXTERNAL_FULFILLMENT_STATUSES.AWAITING_PROVIDER,
    ].includes(status)) {
      current = await reconcile({ transaction: current });
      return {
        required: true,
        confirmed: current.externalFulfillment?.status ===
          EXTERNAL_FULFILLMENT_STATUSES.CONFIRMED,
        transaction: current,
      };
    }

    const claimed = await acquire({ transactionId: transaction._id });
    if (!claimed) {
      current = await findTransaction({ transactionId: transaction._id });
      return { required: true, confirmed: false, transaction: current, locked: true };
    }

    try {
      const order = await createOrder({
        draft,
        payment: {
          orderType: external.paymentRequirements?.requiresInstantPayment
            ? "instant"
            : "hold",
          type: "balance",
        },
        metadata: { paymentTransactionId: String(transaction._id) },
      });
      current = await markFromOrder({ transactionId: transaction._id, order, update });
    } catch (error) {
      const ambiguous = ["FLIGHT_PROVIDER_TIMEOUT", "FLIGHT_PROVIDER_UNAVAILABLE"]
        .includes(error?.code);
      current = await update({
        transactionId: transaction._id,
        status: ambiguous
          ? EXTERNAL_FULFILLMENT_STATUSES.AWAITING_PROVIDER
          : EXTERNAL_FULFILLMENT_STATUSES.FAILED_FINAL,
        updates: {
          retryable: ambiguous,
          lastErrorCode: error?.code || "EXTERNAL_FLIGHT_ORDER_FAILED",
          failedAt: ambiguous ? null : new Date(),
          providerStatus: ambiguous ? "UNKNOWN" : "FAILED",
        },
      });
      if (!ambiguous) throw error;
    }
    return {
      required: true,
      confirmed: current.externalFulfillment?.status ===
        EXTERNAL_FULFILLMENT_STATUSES.CONFIRMED,
      transaction: current,
    };
  };

  return { fulfillExternalFlight: fulfill, reconcileExternalFulfillment: reconcile };
};

const fulfillment = createExternalFlightFulfillmentLayer();
export const fulfillExternalFlight = fulfillment.fulfillExternalFlight;
export const reconcileExternalFulfillment = fulfillment.reconcileExternalFulfillment;
