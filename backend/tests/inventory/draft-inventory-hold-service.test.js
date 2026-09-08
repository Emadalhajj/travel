import assert from "node:assert/strict";
import test from "node:test";

import { createDraftInventoryHoldEnsurer } from "../../services/draft-bookings/draft-inventory-hold-service.js";

test("shared Draft hold orchestration forwards one normalized requirement set", async () => {
  const calls = [];
  const requirements = {
    programReservation: { programId: "program-1", seats: 2 },
    inventoryReservations: [
      { inventoryType: "roomType", reservationMode: "PERIOD", quantity: 1 },
      { inventoryType: "tripDeparture", reservationMode: "SINGLE", quantity: 2 },
    ],
  };
  const ensureHold = createDraftInventoryHoldEnsurer({
    buildRequirements: ({ draft }) => {
      assert.equal(draft._id, "draft-1");
      return requirements;
    },
    createHold: async (input) => {
      calls.push(input);
      return { _id: "hold-1", ...input };
    },
  });

  const hold = await ensureHold({
    draft: { _id: "draft-1", user: "user-1" },
    idempotencyKey: "booking-conversion:draft-1",
    paymentTransaction: "payment-1",
    expiresAt: "2026-09-10T00:00:00.000Z",
  });

  assert.equal(calls.length, 1);
  assert.equal(hold.idempotencyKey, "booking-conversion:draft-1");
  assert.equal(hold.draftBooking, "draft-1");
  assert.equal(hold.paymentTransaction, "payment-1");
  assert.deepEqual(hold.inventoryReservations, requirements.inventoryReservations);
});

test("shared Draft hold orchestration skips empty requirements", async () => {
  let createCalls = 0;
  const ensureHold = createDraftInventoryHoldEnsurer({
    buildRequirements: () => ({
      programReservation: null,
      inventoryReservations: [],
    }),
    createHold: async () => {
      createCalls += 1;
    },
  });

  const hold = await ensureHold({
    draft: { _id: "draft-empty" },
    idempotencyKey: "booking-conversion:draft-empty",
  });

  assert.equal(hold, null);
  assert.equal(createCalls, 0);
});
