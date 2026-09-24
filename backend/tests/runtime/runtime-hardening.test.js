import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { startServer } from "../../server.js";

const read = (relativePath) => fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("release commands keep the default test gate complete and the worker independent", () => {
  const packageJson = JSON.parse(read("../../package.json"));

  assert.equal(packageJson.scripts.start, "node server.js");
  assert.equal(packageJson.scripts["start:recovery"], "node jobs/payment-recovery-worker.js");
  assert.equal(packageJson.scripts["smoke:runtime"], "node scripts/smoke/runtime-smoke.js");
  assert.equal(packageJson.scripts.test, "node --test --test-concurrency=1");
  assert.equal(packageJson.scripts["test:payment"], "node --test tests/payment/*.test.js");
});

test("runtime smoke contract is read-only and covers probes, CORS, and private static guards", () => {
  const smoke = read("../../scripts/smoke/runtime-smoke.js");

  assert.match(smoke, /SMOKE_API_URL/);
  assert.match(smoke, /SMOKE_FRONTEND_ORIGIN/);
  assert.match(smoke, /"\/health"/);
  assert.match(smoke, /"\/ready"/);
  assert.match(smoke, /x-request-id/i);
  assert.match(smoke, /"\/uploads\/draft-bookings\/phase3-smoke\.txt"/);
  assert.match(smoke, /method:\s*"OPTIONS"/);
  assert.doesNotMatch(smoke, /method:\s*"(?:POST|PUT|PATCH|DELETE)"/);
});

test("HTTP server starts only after Mongo startup completes", async () => {
  const events = [];
  let finishConnection;

  const startup = startServer({
    connect: async () => {
      events.push("connect-start");
      await new Promise((resolve) => {
        finishConnection = resolve;
      });
      events.push("connect-ready");
    },
    listen: () => {
      events.push("listen");
      return { listening: false };
    },
  });

  await Promise.resolve();
  assert.deepEqual(events, ["connect-start"]);

  finishConnection();
  await startup;
  assert.deepEqual(events, ["connect-start", "connect-ready", "listen"]);
});
