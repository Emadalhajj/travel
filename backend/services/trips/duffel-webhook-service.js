import crypto from "crypto";
import AppError from "../../utils/AppError.js";
import { EXTERNAL_FULFILLMENT_STATUSES } from
  "../../constants/payments/external-fulfillment-statuses.js";
import {
  claimExternalFulfillmentEventService,
  findPaymentTransactionByExternalOrderService,
  updateExternalFulfillmentService,
} from "../payment/paymentTransaction-service.js";
import { getExternalFlightOrder } from "./providers/flight-provider-factory.js";

export const verifyDuffelWebhookSignature = ({
  rawBody,
  signature,
  secret = String(process.env.DUFFEL_WEBHOOK_SECRET || "").trim(),
  now = Date.now(),
  toleranceSeconds = 300,
}) => {
  if (!secret || !Buffer.isBuffer(rawBody) || !signature) return false;
  const pairs = Object.fromEntries(String(signature).split(",").map((part) => {
    const index = part.indexOf("=");
    return [part.slice(0, index), part.slice(index + 1)];
  }));
  const timestamp = Number(pairs.t);
  if (!Number.isFinite(timestamp) || Math.abs(now / 1000 - timestamp) > toleranceSeconds) {
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(Buffer.concat([Buffer.from(`${timestamp}.`), rawBody]))
    .digest("hex");
  const received = String(pairs.v1 || "");
  return received.length === expected.length && crypto.timingSafeEqual(
    Buffer.from(received),
    Buffer.from(expected),
  );
};

const normalizeOrderSnapshot = (order) => ({
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
});

export const createDuffelWebhookHandler = (dependencies = {}) => async ({ event }) => {
  const findTransaction = dependencies.findTransaction ||
    findPaymentTransactionByExternalOrderService;
  const claimEvent = dependencies.claimEvent || claimExternalFulfillmentEventService;
  const update = dependencies.update || updateExternalFulfillmentService;
  const getOrder = dependencies.getOrder || getExternalFlightOrder;
  const eventId = String(event?.id || "");
  const eventType = String(event?.type || "");
  if (!eventId || !["order.created", "order.creation_failed"].includes(eventType)) {
    return { handled: false };
  }
  const object = event?.data?.object || {};
  const orderId = object.id || event.idempotency_key || "";
  const offerId = object.offer_id || "";
  const transaction = await findTransaction({
    provider: "DUFFEL",
    providerOrderId: orderId,
    offerId,
  });
  if (!transaction) return { handled: false };
  if (transaction.externalFulfillment?.processedEventIds?.includes(eventId)) {
    return { handled: true, duplicate: true };
  }

  if (eventType === "order.created") {
    const order = await getOrder({ provider: "DUFFEL", orderId });
    await update({
      transactionId: transaction._id,
      status: EXTERNAL_FULFILLMENT_STATUSES.CONFIRMED,
      updates: {
        providerOrderId: order.orderId,
        providerStatus: order.status,
        confirmedAt: new Date(),
        retryable: false,
        orderSnapshot: normalizeOrderSnapshot(order),
      },
    });
    await claimEvent({ transactionId: transaction._id, eventId });
    return { handled: true, confirmed: true, transactionId: transaction._id };
  }

  if (transaction.externalFulfillment?.status !== EXTERNAL_FULFILLMENT_STATUSES.CONFIRMED) {
    await update({
      transactionId: transaction._id,
      status: EXTERNAL_FULFILLMENT_STATUSES.FAILED_FINAL,
      updates: {
        providerOrderId: orderId,
        providerStatus: "FAILED",
        failedAt: new Date(),
        retryable: false,
        lastErrorCode: "EXTERNAL_FLIGHT_ORDER_CREATION_FAILED",
      },
    });
  }
  await claimEvent({ transactionId: transaction._id, eventId });
  return { handled: true, failed: true, transactionId: transaction._id };
};

export const handleDuffelWebhookEvent = createDuffelWebhookHandler();

export const parseVerifiedDuffelWebhook = ({ rawBody, signature }) => {
  if (!verifyDuffelWebhookSignature({ rawBody, signature })) {
    throw new AppError("INVALID_WEBHOOK_SIGNATURE", 401, "signature");
  }
  try {
    return JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw new AppError("INVALID_WEBHOOK_PAYLOAD", 400, "payload");
  }
};
