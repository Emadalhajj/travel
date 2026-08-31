import assert from "node:assert/strict";
import test from "node:test";

import { startServer } from "../../server.js";

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
