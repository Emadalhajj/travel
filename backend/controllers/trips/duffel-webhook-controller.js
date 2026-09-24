import { handleDuffelWebhookEvent, parseVerifiedDuffelWebhook } from
  "../../services/trips/duffel-webhook-service.js";
import { recoverPaidPendingBookingsService } from
  "../../services/payment/payment-recovery-service.js";
import { operationalLogger, safeErrorContext } from "../../utils/operational-logger.js";

export const handleDuffelWebhook = async (req, res, next) => {
  try {
    const event = parseVerifiedDuffelWebhook({
      rawBody: req.body,
      signature: req.get("X-Duffel-Signature"),
    });
    const result = await handleDuffelWebhookEvent({ event });
    res.status(200).json({ success: true, received: true });
    if (result.confirmed) {
      setImmediate(() => {
        recoverPaidPendingBookingsService({ limit: 10 }).catch((error) => {
          operationalLogger.error(
            "external_flight_recovery_trigger_failed",
            safeErrorContext(error, { requestId: req.requestId, provider: "DUFFEL" }),
          );
        });
      });
    }
  } catch (error) {
    next(error);
  }
};
