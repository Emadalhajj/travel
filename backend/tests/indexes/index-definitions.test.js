import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import test from "node:test";

import AuditLog from "../../models/audit/audit-log-model.js";
import Booking from "../../models/booking/booking-model.js";
import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";
import InventoryHold from "../../models/inventory-hold-model.js";
import Inventory from "../../models/inventory-model.js";
import Notification from "../../models/notification-model.js";
import PaymentTransaction from "../../models/payments/paymentTransaction-model.js";

const hasExpectedOptions = (options, expectedOptions) =>
  Object.entries(expectedOptions).every(([key, value]) =>
    isDeepStrictEqual(options[key], value),
  );

const assertIndex = (model, expectedFields, expectedOptions = {}) => {
  const index = model.schema.indexes().find(([fields, options]) =>
    isDeepStrictEqual(fields, expectedFields) &&
    hasExpectedOptions(options, expectedOptions),
  );
  assert.ok(
    index,
    `${model.modelName} is missing index ${JSON.stringify(expectedFields)}`,
  );
};

test("defines the hardened booking, draft, payment, hold, notification, and audit indexes", () => {
  assertIndex(Booking, { user: 1, isDeleted: 1, createdAt: -1 });
  assertIndex(DraftBooking, {
    user: 1,
    isDeleted: 1,
    status: 1,
    createdAt: -1,
  });
  assertIndex(DraftBooking, { status: 1, isDeleted: 1, expiresAt: 1 });
  assertIndex(PaymentTransaction, {
    status: 1,
    isDeleted: 1,
    booking: 1,
    updatedAt: 1,
    _id: 1,
  });
  assertIndex(PaymentTransaction, {
    draftBooking: 1,
    status: 1,
    isDeleted: 1,
    updatedAt: -1,
  });
  assertIndex(InventoryHold, {
    isActive: 1,
    status: 1,
    expiresAt: 1,
    _id: 1,
  });
  assertIndex(Notification, {
    user: 1,
    channel: 1,
    isRead: 1,
    isDeleted: 1,
    createdAt: -1,
  });
  assertIndex(AuditLog, { entity: 1, entityId: 1, createdAt: -1 });
});

test("preserves inventory and idempotency concurrency guarantees", () => {
  assertIndex(
    Inventory,
    { inventoryType: 1, itemId: 1, date: 1 },
    { unique: true },
  );
  assertIndex(
    InventoryHold,
    { idempotencyKey: 1 },
    {
      unique: true,
      partialFilterExpression: { isActive: true },
      name: "unique_active_inventory_hold_key",
    },
  );
  assertIndex(
    Notification,
    { deduplicationKey: 1 },
    {
      unique: true,
      partialFilterExpression: {
        deduplicationKey: { $type: "string" },
      },
      name: "unique_notification_deduplication_key",
    },
  );
});
