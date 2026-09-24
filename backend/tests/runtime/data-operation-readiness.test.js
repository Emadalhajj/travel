import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { assertExecuteApproved, getDatabaseConfig } from "../../scripts/operations/database-safety.js";
import { seedPaymentMethods } from "../../seeders/payment-method-seeder.js";

test("database operations require an explicit database name and matching write confirmation", () => {
  assert.throws(() => getDatabaseConfig({ DB_URL: "mongodb://127.0.0.1:27017" }), /DB_NAME is required/);
  assert.doesNotThrow(() => assertExecuteApproved({ execute: false, operation: "test", env: { DB_URL: "mongodb://127.0.0.1:27017", DB_NAME: "staging" } }));
  assert.throws(() => assertExecuteApproved({ execute: true, operation: "test", env: { DB_URL: "mongodb://127.0.0.1:27017", DB_NAME: "staging" } }), /DATA_OPERATION_CONFIRM=staging/);
  assert.doesNotThrow(() => assertExecuteApproved({ execute: true, operation: "test", env: { DB_URL: "mongodb://127.0.0.1:27017", DB_NAME: "staging", DATA_OPERATION_CONFIRM: "staging" } }));
});

test("payment method seed compares existing data and never overwrites it", async () => {
  const existing = { code: "BANK_TRANSFER", nameEn: "Custom production label" };
  const created = [];
  const PaymentMethodModel = {
    findOne: ({ code }) => ({ lean: async () => code === "BANK_TRANSFER" ? existing : null }),
    create: async (value) => created.push(value),
  };

  const dryRun = await seedPaymentMethods({ execute: false, PaymentMethodModel });
  assert.equal(dryRun.drifted, 1);
  assert.equal(created.length, 0);

  const execute = await seedPaymentMethods({ execute: true, PaymentMethodModel });
  assert.equal(execute.drifted, 1);
  assert.equal(execute.created, 9);
  assert.equal(existing.nameEn, "Custom production label");
});

test("fresh database initialization uses timestamps and exposes the 132-index preflight", () => {
  const transport = fs.readFileSync(new URL("../../models/transportition/transport-model.js", import.meta.url), "utf8");
  const preflight = fs.readFileSync(new URL("../../scripts/operations/index-preflight.js", import.meta.url), "utf8");
  assert.match(transport, /\{ timestamps: true \}/);
  assert.doesNotMatch(transport, /timeseries:\s*true/);
  assert.match(preflight, /expectedCount !== 132/);
});
