import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  evaluateRoomSellablePeriod,
  isRoomSellableInPeriod,
} from "../../services/availability/room-sellability-policy.js";

const stay = {
  startDate: "2026-10-01",
  endDate: "2026-10-06",
};

test("missing or empty sellable periods add no sales-window restriction", () => {
  assert.equal(isRoomSellableInPeriod({ roomType: {}, ...stay }), true);
  assert.equal(isRoomSellableInPeriod({
    roomType: { availability: { availablePeriods: [] } },
    ...stay,
  }), true);
});

test("browse without dates does not apply the optional sales-window restriction", () => {
  assert.equal(isRoomSellableInPeriod({
    roomType: {
      availability: {
        availablePeriods: [{
          startDate: "2026-10-01",
          endDate: "2026-10-31",
          isActive: true,
        }],
      },
    },
  }), true);
});

test("configured periods must actively cover the complete stay", () => {
  const matching = {
    availability: {
      availablePeriods: [{
        startDate: "2026-09-01",
        endDate: "2026-11-01",
        isActive: true,
      }],
    },
  };
  const outside = {
    availability: {
      availablePeriods: [{
        startDate: "2026-10-03",
        endDate: "2026-11-01",
        isActive: true,
      }],
    },
  };
  const inactive = {
    availability: {
      availablePeriods: [{
        startDate: "2026-09-01",
        endDate: "2026-11-01",
        isActive: false,
      }],
    },
  };

  assert.equal(evaluateRoomSellablePeriod({ roomType: matching, ...stay }).isSellable, true);
  assert.equal(evaluateRoomSellablePeriod({ roomType: outside, ...stay }).isSellable, false);
  assert.equal(evaluateRoomSellablePeriod({ roomType: inactive, ...stay }).isSellable, false);
});

test("public and package availability consume the same sellable-period policy", async () => {
  const publicSource = await readFile(new URL(
    "../../services/availability/accommodation-availability-service.js",
    import.meta.url,
  ), "utf8");
  const packageSource = await readFile(new URL(
    "../../services/availability/package-availability-service.js",
    import.meta.url,
  ), "utf8");

  assert.match(publicSource, /from "\.\/room-sellability-policy\.js"/);
  assert.match(packageSource, /from "\.\/room-sellability-policy\.js"/);
  assert.doesNotMatch(publicSource, /const isSellableInPeriod/);
  assert.doesNotMatch(packageSource, /const isRoomSellableInPeriod/);
});
