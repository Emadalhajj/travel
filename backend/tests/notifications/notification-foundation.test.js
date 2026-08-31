import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPES,
} from "../../constants/notifications/notification-constants.js";
import { createNotificationServiceLayer } from "../../services/notifications/notification-service.js";

const createStore = () => {
  const rows = [];
  let sequence = 0;
  const asDocument = (payload) => ({
    _id: `notification-${++sequence}`,
    isDeleted: false,
    isRead: false,
    failedReason: "",
    ...payload,
    async save() {
      return this;
    },
  });
  const NotificationModel = {
    create: async (payload) => {
      if (
        payload.deduplicationKey &&
        rows.some((row) => row.deduplicationKey === payload.deduplicationKey)
      ) {
        const error = new Error("duplicate key");
        error.code = 11000;
        throw error;
      }
      const document = asDocument(payload);
      rows.push(document);
      return document;
    },
    findOne: async ({ deduplicationKey }) =>
      rows.find((row) => row.deduplicationKey === deduplicationKey) || null,
  };
  return { NotificationModel, rows };
};

const message = {
  user: "user-1",
  messageAr: "رسالة",
  messageEn: "Message",
  type: NOTIFICATION_TYPES.GENERAL,
};

test("creates a sent database notification", async () => {
  const store = createStore();
  const service = createNotificationServiceLayer({ NotificationModel: store.NotificationModel });
  const notification = await service.createNotification({
    ...message,
    channel: NOTIFICATION_CHANNELS.DATABASE,
  });

  assert.equal(notification.status, NOTIFICATION_STATUS.SENT);
  assert.ok(notification.sentAt instanceof Date);
  assert.equal(store.rows.length, 1);
});

test("duplicate deduplication key returns one notification and sends once", async () => {
  const store = createStore();
  let deliveries = 0;
  const service = createNotificationServiceLayer({
    NotificationModel: store.NotificationModel,
    emailAdapter: async () => {
      deliveries += 1;
    },
  });
  const input = {
    ...message,
    channel: NOTIFICATION_CHANNELS.EMAIL,
    recipient: { email: "recipient@example.com" },
    deduplicationKey: "event-1:email",
  };
  const first = await service.sendNotification(input);
  const second = await service.sendNotification(input);

  assert.equal(first._id, second._id);
  assert.equal(store.rows.length, 1);
  assert.equal(deliveries, 1);
});

test("failed external channel remains recorded without throwing", async () => {
  const store = createStore();
  const service = createNotificationServiceLayer({
    NotificationModel: store.NotificationModel,
    emailAdapter: async () => {
      throw new Error("provider unavailable");
    },
  });
  const notification = await service.sendNotification({
    ...message,
    channel: NOTIFICATION_CHANNELS.EMAIL,
    recipient: { email: "recipient@example.com" },
  });

  assert.equal(notification.status, NOTIFICATION_STATUS.FAILED);
  assert.equal(notification.failedReason, "provider unavailable");
  assert.equal(store.rows.length, 1);
});

test("marks a notification as read", async () => {
  const store = createStore();
  const now = new Date("2026-11-01T10:00:00.000Z");
  const service = createNotificationServiceLayer({
    NotificationModel: store.NotificationModel,
    now: () => now,
  });
  const notification = await service.createNotification(message);
  await service.markNotificationAsRead({ notification });

  assert.equal(notification.isRead, true);
  assert.equal(notification.readAt, now);
});

test("notification controller scopes user operations to database and active records", async () => {
  const source = await readFile(
    new URL("../../controllers/notifications/notification-controller.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /channel:\s*NOTIFICATION_CHANNELS\.DATABASE/);
  assert.match(source, /isDeleted:\s*false/);
  assert.match(source, /getMyUnreadCount/);
  assert.match(source, /markAllAsRead/);
  assert.match(source, /select\("titleAr titleEn messageAr messageEn type status isRead readAt booking createdAt"\)/);
  assert.match(source, /select\("status channel type failedReason booking user createdBy createdAt"\)/);
  assert.equal(source.includes(".select(\"metadata"), false);
});
