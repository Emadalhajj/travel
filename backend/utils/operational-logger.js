const SENSITIVE_KEY = /(?:authorization|cookie|password|passwd|secret|token|jwt|signature|api[-_]?key|access[-_]?key|card|cvv|cvc|private[-_]?document|raw[-_]?body|db[-_]?url|mongo(?:db)?[-_]?uri)/i;
const SAFE_CONTEXT_KEYS = new Set([
  "requestId", "method", "path", "status", "statusCode", "durationMs",
  "operation", "errorCode", "bookingId", "draftId", "paymentTransactionId",
  "inventoryHoldId", "provider", "reason", "counts", "exitCode",
]);

const redactText = (value) => String(value || "")
  .replace(/Bearer\s+[^\s,;]+/gi, "Bearer [REDACTED]")
  .replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "[REDACTED_MONGODB_URI]")
  .replace(/([?&](?:token|secret|signature|key)=)[^&#\s]+/gi, "$1[REDACTED]")
  .slice(0, 1000);

export const sanitizeFailureReason = (value, fallback = "Operation failed") =>
  redactText(value || fallback);

const sanitizeCounts = (value = {}) => Object.fromEntries(
  Object.entries(value)
    .filter(([, count]) => Number.isFinite(Number(count)))
    .map(([key, count]) => [String(key).slice(0, 80), Number(count)]),
);

export const sanitizeLogContext = (context = {}) => Object.fromEntries(
  Object.entries(context)
    .filter(([key, value]) => value !== undefined && !SENSITIVE_KEY.test(key))
    .filter(([key]) => SAFE_CONTEXT_KEYS.has(key))
    .map(([key, value]) => {
      if (value === null || typeof value === "number" || typeof value === "boolean") {
        return [key, value];
      }
      if (key === "counts" && typeof value === "object") {
        return [key, sanitizeCounts(value)];
      }
      if (typeof value === "object") {
        return [key, sanitizeLogContext(value)];
      }
      return [key, redactText(value)];
    }),
);

export const safeErrorContext = (error, context = {}) => sanitizeLogContext({
  ...context,
  errorCode: error?.code || error?.name || "ERROR",
  statusCode: error?.statusCode || error?.status,
  reason: error?.message || "Operation failed",
});

const write = (level, event, context) => {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event: redactText(event),
    ...sanitizeLogContext(context),
  });
  const output = level === "ERROR" ? console.error : level === "WARN" ? console.warn : console.log;
  output(entry);
};

export const operationalLogger = Object.freeze({
  info: (event, context = {}) => write("INFO", event, context),
  warn: (event, context = {}) => write("WARN", event, context),
  error: (event, context = {}) => write("ERROR", event, context),
});
