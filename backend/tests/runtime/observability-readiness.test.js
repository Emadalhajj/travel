import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

import { errorHandler } from "../../middleware/errorHandler.js";
import { requestContext } from "../../middleware/request-context.js";
import { getReadinessState } from "../../server.js";
import { sanitizeLogContext } from "../../utils/operational-logger.js";
import AppError from "../../utils/AppError.js";

test("operational log context keeps identifiers and redacts secret-bearing fields and text", () => {
  const sanitized = sanitizeLogContext({
    requestId: "req-1",
    paymentTransactionId: "payment-1",
    authorization: "Bearer top-secret",
    token: "top-secret",
    reason: "provider failed at mongodb://user:pass@db/private?token=abc",
  });

  assert.equal(sanitized.requestId, "req-1");
  assert.equal(sanitized.paymentTransactionId, "payment-1");
  assert.equal("authorization" in sanitized, false);
  assert.equal("token" in sanitized, false);
  assert.doesNotMatch(sanitized.reason, /user:pass|token=abc/);
});

test("production error responses and logs do not expose unexpected error secrets", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousConsoleError = console.error;
  const output = [];
  process.env.NODE_ENV = "production";
  console.error = (value) => output.push(String(value));
  let response;

  try {
    errorHandler(
      new Error("Bearer sensitive-token failed mongodb://user:pass@db/private"),
      { requestId: "req-safe", method: "GET", path: "/api/test", headers: { "accept-language": "en" } },
      { status: (statusCode) => ({ json: (payload) => { response = { statusCode, payload }; } }) },
      () => {},
    );
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
    console.error = previousConsoleError;
  }

  assert.equal(response.statusCode, 500);
  assert.equal(response.payload.message, "An unexpected error occurred");
  assert.equal("stack" in response.payload, false);
  assert.doesNotMatch(output.join("\n"), /sensitive-token|user:pass/);
  assert.match(output.join("\n"), /req-safe/);
});

test("request context preserves a valid correlation id and returns it to the caller", () => {
  const response = new EventEmitter();
  response.statusCode = 200;
  response.setHeader = (name, value) => { response[name] = value; };
  const request = {
    method: "GET",
    path: "/health",
    get: (name) => name === "x-request-id" ? "release-check-1" : "",
  };
  let continued = false;

  requestContext(request, response, () => { continued = true; });

  assert.equal(continued, true);
  assert.equal(request.requestId, "release-check-1");
  assert.equal(response["x-request-id"], "release-check-1");
});

test("webhook authentication failures emit a sanitized warning for alerting", () => {
  const previousConsoleWarn = console.warn;
  const output = [];
  console.warn = (value) => output.push(String(value));
  try {
    errorHandler(
      new AppError("INVALID_WEBHOOK_SIGNATURE", 401, "signature"),
      { requestId: "webhook-req-1", method: "POST", path: "/api/webhooks/flight-providers/duffel", headers: {} },
      { status: () => ({ json: () => {} }) },
      () => {},
    );
  } finally {
    console.warn = previousConsoleWarn;
  }

  assert.match(output.join("\n"), /webhook_rejected/);
  assert.match(output.join("\n"), /INVALID_WEBHOOK_SIGNATURE/);
  assert.match(output.join("\n"), /webhook-req-1/);
  assert.doesNotMatch(output.join("\n"), /signature"\s*:/);
});

test("readiness is healthy only with a connected database and before shutdown", () => {
  assert.deepEqual(getReadinessState({ connectionState: 1, shuttingDown: false }), {
    statusCode: 200,
    body: { status: "ready", database: "connected" },
  });
  assert.equal(getReadinessState({ connectionState: 0, shuttingDown: false }).statusCode, 503);
  assert.equal(getReadinessState({ connectionState: 1, shuttingDown: true }).statusCode, 503);
});
