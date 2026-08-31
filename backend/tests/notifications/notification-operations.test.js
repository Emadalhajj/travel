import assert from "node:assert/strict";
import test from "node:test";

import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUS } from "../../constants/notifications/notification-constants.js";
import { createNotificationServiceLayer } from "../../services/notifications/notification-service.js";

const document = (overrides = {}) => ({
  _id: "notification-1",
  user: "user-1",
  booking: "booking-1",
  channel: NOTIFICATION_CHANNELS.EMAIL,
  status: NOTIFICATION_STATUS.FAILED,
  titleAr: "عنوان",
  titleEn: "Subject",
  messageAr: "رسالة",
  messageEn: "Message",
  isDeleted: false,
  failedReason: "old failure",
  async save() { return this; },
  ...overrides,
});

const createRetryStore = (row) => ({
  countDocuments: async (filter) => filter,
  updateMany: async (filter, update) => ({ modifiedCount: 2, filter, update }),
  findOneAndUpdate: async (filter) => {
    if (row.claimed || row.status !== filter.status || row.isDeleted) return null;
    if (row.channel === NOTIFICATION_CHANNELS.DATABASE) return null;
    row.claimed = true;
    row.status = NOTIFICATION_STATUS.PENDING;
    return row;
  },
});

const readQuery = (value, onSelect = () => {}) => ({
  select(fields) {
    onSelect(fields);
    return this;
  },
  lean: async () => value,
});

test("unread count and mark all read target active database notifications only", async () => {
  const row = document();
  const model = createRetryStore(row);
  let countFilter;
  let updateFilter;
  model.countDocuments = async (filter) => { countFilter = filter; return 3; };
  model.updateMany = async (filter) => { updateFilter = filter; return { modifiedCount: 2 }; };
  const service = createNotificationServiceLayer({ NotificationModel: model });

  assert.equal(await service.getUnreadCount({ userId: "user-1" }), 3);
  await service.markAllNotificationsAsRead({ userId: "user-1" });
  assert.deepEqual(countFilter, { user: "user-1", channel: "database", isRead: false, isDeleted: false });
  assert.deepEqual(updateFilter, countFilter);
});

test("retry resolves current user email and sends the existing record once", async () => {
  const row = document();
  const model = createRetryStore(row);
  const deliveries = [];
  const service = createNotificationServiceLayer({
    NotificationModel: model,
    UserModel: { findById: () => readQuery({ email: "current@example.com" }) },
    BookingModel: { findById: () => readQuery({ customer: { email: "guest@example.com" } }) },
    emailAdapter: async (payload) => deliveries.push(payload),
  });
  const result = await service.retryNotification({ notificationId: row._id });
  assert.equal(result.status, NOTIFICATION_STATUS.SENT);
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0].to, "current@example.com");
});

test("two concurrent retries claim once and send one email", async () => {
  const row = document();
  const model = createRetryStore(row);
  let deliveries = 0;
  const service = createNotificationServiceLayer({
    NotificationModel: model,
    UserModel: { findById: () => readQuery({ email: "user@example.com" }) },
    BookingModel: { findById: () => readQuery(null) },
    emailAdapter: async () => { deliveries += 1; },
  });
  const results = await Promise.allSettled([
    service.retryNotification({ notificationId: row._id }),
    service.retryNotification({ notificationId: row._id }),
  ]);
  assert.equal(deliveries, 1);
  assert.equal(results.filter(({ status }) => status === "fulfilled").length, 1);
});

test("retry falls back to booking customer email", async () => {
  const row = document();
  let recipient;
  let userSelect;
  let bookingSelect;
  const service = createNotificationServiceLayer({
    NotificationModel: createRetryStore(row),
    UserModel: { findById: () => readQuery({ email: "" }, (value) => { userSelect = value; }) },
    BookingModel: { findById: () => readQuery(
      { customer: { email: "guest@example.com" } },
      (value) => { bookingSelect = value; },
    ) },
    emailAdapter: async ({ to }) => { recipient = to; },
  });
  await service.retryNotification({ notificationId: row._id });
  assert.equal(recipient, "guest@example.com");
  assert.equal(userSelect, "email phone whatsapp");
  assert.equal(bookingSelect, "customer.email customer.phone customer.whatsapp");
});

test("retry does not read booking when the user has the required recipient", async () => {
  const row = document();
  let bookingReads = 0;
  const service = createNotificationServiceLayer({
    NotificationModel: createRetryStore(row),
    UserModel: { findById: () => readQuery({ email: "user@example.com" }) },
    BookingModel: { findById: () => { bookingReads += 1; return readQuery(null); } },
    emailAdapter: async () => {},
  });
  await service.retryNotification({ notificationId: row._id });
  assert.equal(bookingReads, 0);
});

test("retry delivery failure returns the same record to failed", async () => {
  const row = document();
  const service = createNotificationServiceLayer({
    NotificationModel: createRetryStore(row),
    UserModel: { findById: () => readQuery(null) },
    BookingModel: { findById: () => readQuery(null) },
    emailAdapter: async ({ to }) => {
      if (!to) throw new Error("Email recipient is missing");
    },
  });
  const result = await service.retryNotification({ notificationId: row._id });
  assert.equal(result.status, NOTIFICATION_STATUS.FAILED);
  assert.equal(result.failedReason, "Email recipient is missing");
});

test("sent and database notifications cannot be retried", async () => {
  for (const row of [
    document({ status: NOTIFICATION_STATUS.SENT }),
    document({ channel: NOTIFICATION_CHANNELS.DATABASE }),
  ]) {
    const service = createNotificationServiceLayer({ NotificationModel: createRetryStore(row) });
    await assert.rejects(
      () => service.retryNotification({ notificationId: row._id }),
      ({ code }) => code === "NOTIFICATION_NOT_RETRYABLE",
    );
  }
});
