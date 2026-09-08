import mongoose from "mongoose";

import {
  INVENTORY_HOLD_STATUSES,
  INVENTORY_HOLD_STATUS_VALUES,
} from "../constants/inventory/inventory-hold-statuses.js";
import { INVENTORY_TYPE_VALUES } from "../constants/inventory/inventory-types.js";
import {
  INVENTORY_RESERVATION_MODES,
  INVENTORY_RESERVATION_MODE_VALUES,
} from "../constants/inventory/inventory-reservation-modes.js";

const inventoryReservationSchema = new mongoose.Schema(
  {
    inventoryType: {
      type: String,
      enum: INVENTORY_TYPE_VALUES,
      required: true,
    },
    reservationMode: {
      type: String,
      enum: INVENTORY_RESERVATION_MODE_VALUES,
      default: INVENTORY_RESERVATION_MODES.PERIOD,
      required: true,
    },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    date: { type: Date, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    quantity: { type: Number, required: true, min: 1 },
    defaultTotal: { type: Number, default: 0, min: 0 },
    releasedAt: { type: Date, default: null },
  },
  { _id: true },
);

inventoryReservationSchema.pre("validate", function (next) {
  if (
    this.reservationMode === INVENTORY_RESERVATION_MODES.SINGLE &&
    !this.date
  ) {
    return next(
      new Error("date is required for SINGLE inventory reservation"),
    );
  }

  if (
    this.reservationMode === INVENTORY_RESERVATION_MODES.PERIOD &&
    (!this.startDate || !this.endDate)
  ) {
    return next(
      new Error(
        "startDate and endDate are required for PERIOD inventory reservation",
      ),
    );
  }

  return next();
});

const programReservationSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UmrahProgram",
      required: true,
    },
    seats: { type: Number, required: true, min: 1 },
    releasedAt: { type: Date, default: null },
  },
  { _id: false },
);

const inventoryHoldSchema = new mongoose.Schema(
  {
    idempotencyKey: { type: String, required: true, trim: true, index: true },
    isActive: { type: Boolean, default: true, required: true, index: true },
    draftBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DraftBooking",
      default: null,
      index: true,
    },
    paymentTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentTransaction",
      default: null,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: INVENTORY_HOLD_STATUS_VALUES,
      default: INVENTORY_HOLD_STATUSES.CREATING,
      required: true,
      index: true,
    },
    programReservation: { type: programReservationSchema, default: null },
    inventoryReservations: { type: [inventoryReservationSchema], default: [] },
    expiresAt: { type: Date, required: true, index: true },
    heldAt: { type: Date, default: null },
    committedAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
    releaseReason: { type: String, default: "", trim: true },
    failureReason: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

inventoryHoldSchema.index({ status: 1, expiresAt: 1 });
inventoryHoldSchema.index({
  isActive: 1,
  status: 1,
  expiresAt: 1,
  _id: 1,
});
inventoryHoldSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: "unique_active_inventory_hold_key",
  },
);

export default mongoose.model("InventoryHold", inventoryHoldSchema);
