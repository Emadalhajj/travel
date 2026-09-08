import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import tripDepartureRoutes from "../../routes/trips/trip-departure-routes.js";

const routeKey = (layer) => {
  const method = Object.keys(layer.route?.methods || {})[0];
  return method && layer.route ? `${method.toUpperCase()} ${layer.route.path}` : null;
};

const routesByKey = new Map(
  tripDepartureRoutes.stack
    .filter((layer) => layer.route)
    .map((layer) => [routeKey(layer), layer.route.stack]),
);

test("TripDeparture router exposes the expected resource contract", () => {
  assert.deepEqual([...routesByKey.keys()], [
    "GET /",
    "GET /:id",
    "POST /",
    "PATCH /:id",
    "POST /:id/schedule",
    "POST /:id/cancel",
    "POST /:id/complete",
    "PATCH /:id/toggle-active",
    "PATCH /:id/restore",
    "DELETE /:id",
  ]);
});

test("TripDeparture writes are protected and admin-authorized", () => {
  for (const key of [
    "POST /",
    "PATCH /:id",
    "POST /:id/schedule",
    "POST /:id/cancel",
    "POST /:id/complete",
    "PATCH /:id/toggle-active",
    "PATCH /:id/restore",
    "DELETE /:id",
  ]) {
    const middleware = routesByKey.get(key);
    assert.equal(middleware[0].name, "protect", `${key} must authenticate first`);
    assert.ok(middleware.length >= 3, `${key} must authorize before its controller`);
  }
});

test("TripDeparture create and update validate before their controllers", () => {
  assert.equal(routesByKey.get("POST /").length, 4);
  assert.equal(routesByKey.get("PATCH /:id").length, 4);
});

test("server mounts TripDeparture once under the API prefix", () => {
  const serverPath = path.resolve(import.meta.dirname, "../../server.js");
  const source = fs.readFileSync(serverPath, "utf8");
  const mounts = source.match(
    /app\.use\("\/api\/trip-departures",\s*tripDepartureRoutes\)/g,
  );

  assert.equal(mounts?.length, 1);
});
