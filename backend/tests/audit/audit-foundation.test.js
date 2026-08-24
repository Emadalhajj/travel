import assert from "node:assert/strict";
import test from "node:test";

import { USER_ROLES } from "../../constants/auth/roles.js";
import { AUDIT_READ_ROLES } from "../../constants/audit/audit-access.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";
import { SECURITY_EVENT_TYPES } from "../../constants/audit/security-event-types.js";
import {
  buildAuditLogFilter,
  normalizeAuditPagination,
  sanitizeAuditValue,
  sanitizeSensitiveAuditData,
} from "../../services/audit/audit-log-service.js";
import {
  buildSecurityEventFilter,
  normalizeSecurityEventPagination,
} from "../../services/audit/security-event-service.js";

const objectId = "507f1f77bcf86cd799439011";

test("audit filters support action, entity, entityId, user and date range", () => {
  const filter = buildAuditLogFilter({
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.BOOKING,
    entityId: objectId,
    user: objectId,
    dateFrom: "2026-08-01",
    dateTo: "2026-08-20",
  });
  assert.equal(filter.action, AUDIT_ACTIONS.UPDATE);
  assert.equal(filter.entity, AUDIT_ENTITIES.BOOKING);
  assert.equal(filter.entityId, objectId);
  assert.equal(filter.user, objectId);
  assert.equal(filter.createdAt.$gte.toISOString(), "2026-08-01T00:00:00.000Z");
  assert.equal(filter.createdAt.$lte.toISOString(), "2026-08-20T23:59:59.999Z");
});

test("invalid audit action and entity are rejected", () => {
  assert.throws(() => buildAuditLogFilter({ action: "invalid" }), ({ field }) => field === "action");
  assert.throws(() => buildAuditLogFilter({ entity: "invalid" }), ({ field }) => field === "entity");
});

test("audit and security pagination are bounded to 100", () => {
  assert.deepEqual(normalizeAuditPagination({ page: -2, limit: 5000 }), { page: 1, limit: 100 });
  assert.deepEqual(normalizeSecurityEventPagination({ page: 2, limit: 1000 }), { page: 2, limit: 100 });
});

test("sensitive fields are recursively sanitized", () => {
  const sanitized = sanitizeSensitiveAuditData({
    password: "plain",
    credential: "raw-credential",
    nested: [{ accessToken: "token", safe: "visible" }],
    metadata: { webhookSecret: "secret" },
  });
  assert.equal(sanitized.password, "[REDACTED]");
  assert.equal(sanitized.credential, "[REDACTED]");
  assert.equal(sanitized.nested[0].accessToken, "[REDACTED]");
  assert.equal(sanitized.nested[0].safe, "visible");
  assert.equal(sanitized.metadata.webhookSecret, "[REDACTED]");
});

test("payment provider specialized sanitizer is preserved before general sanitization", () => {
  const sanitized = sanitizeAuditValue({
    entity: AUDIT_ENTITIES.PAYMENT_PROVIDER,
    value: { credentials: { apiKey: "secret", merchantId: "merchant", region: "sa" } },
  });
  assert.equal(sanitized.credentials.apiKey, "[REDACTED]");
  assert.equal(sanitized.credentials.merchantId, "[REDACTED]");
  assert.equal(sanitized.credentials.region, "sa");
});

test("security filters support type, user and date range and reject invalid type", () => {
  const filter = buildSecurityEventFilter({
    type: SECURITY_EVENT_TYPES.FORBIDDEN_ACCESS,
    user: objectId,
    dateFrom: "2026-08-10",
    dateTo: "2026-08-11",
  });
  assert.equal(filter.type, SECURITY_EVENT_TYPES.FORBIDDEN_ACCESS);
  assert.equal(filter.user, objectId);
  assert.equal(filter.createdAt.$lte.toISOString(), "2026-08-11T23:59:59.999Z");
  assert.throws(() => buildSecurityEventFilter({ type: "invalid" }), ({ field }) => field === "type");
});

test("audit access allows admin and super admin but forbids user", () => {
  assert.equal(AUDIT_READ_ROLES.includes(USER_ROLES.ADMIN), true);
  assert.equal(AUDIT_READ_ROLES.includes(USER_ROLES.SUPER_ADMIN), true);
  assert.equal(AUDIT_READ_ROLES.includes(USER_ROLES.USER), false);
});
