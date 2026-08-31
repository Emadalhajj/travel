import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMyDraftListPipeline,
  serializeDraftListItem,
} from "../../services/draft-bookings/draft-booking-service.js";

const heavyFields = [
  "travelers",
  "hosts",
  "hotel",
  "transport",
  "data",
  "selectedProducts",
  "customPackageSnapshot",
  "payment",
  "user",
];

test("My Drafts resolves payment review and filters before pagination", () => {
  const pipeline = buildMyDraftListPipeline({
    filter: { user: "user-1", isDeleted: false },
    status: "draft",
    skip: 10,
    limit: 5,
  });
  const lookup = pipeline[1].$lookup;
  const effectiveStatusMatch = pipeline[3].$match;
  const itemStages = pipeline[4].$facet.items;
  const project = itemStages.at(-1).$project;

  assert.equal(lookup.pipeline.some((stage) => stage.$limit === 1), true);
  assert.deepEqual(effectiveStatusMatch, {
    status: "draft",
    reviewTransaction: null,
  });
  assert.deepEqual(project.travelersCount, {
    $size: { $ifNull: ["$travelers", []] },
  });
  assert.equal(Object.hasOwn(project, "travelers"), false);
  assert.deepEqual(itemStages.slice(0, 3), [
    { $sort: { createdAt: -1, _id: -1 } },
    { $skip: 10 },
    { $limit: 5 },
  ]);
});

test("pending review pagination includes legacy draft status or a linked review payment", () => {
  const pipeline = buildMyDraftListPipeline({
    filter: { user: "user-1", isDeleted: false },
    status: "pending_review",
    skip: 0,
    limit: 10,
  });

  assert.deepEqual(pipeline[3].$match, {
    $or: [
      { status: "pending_review" },
      { reviewTransaction: { $ne: null } },
    ],
  });
  assert.equal(pipeline[4].$facet.total[0].$count, "count");
});

test("My Drafts DTO contains card fields and excludes heavy draft state", () => {
  const item = serializeDraftListItem({
    _id: "draft-1",
    status: "draft",
    currentStep: "payment",
    customer: { name: "Customer", email: "hidden@example.com" },
    program: { nameAr: "برنامج", nameEn: "Program", services: [{ secret: true }] },
    pricing: { total: 500, currency: "SAR", subtotal: 400 },
    travelersCount: 3,
    finalBooking: "booking-1",
    expiresAt: new Date("2026-08-27T00:00:00.000Z"),
    createdAt: new Date("2026-08-26T00:00:00.000Z"),
    updatedAt: new Date("2026-08-26T01:00:00.000Z"),
    travelers: [{ passportImage: "secret.jpg" }],
    hosts: [{ idImage: "secret.jpg" }],
    data: { selectedProducts: [{ secret: true }] },
  });

  assert.equal(item.customer.name, "Customer");
  assert.equal(item.program.nameEn, "Program");
  assert.equal(item.pricing.total, 500);
  assert.equal(item.travelersCount, 3);
  assert.equal(item.finalBooking, "booking-1");
  assert.equal("email" in item.customer, false);
  for (const field of heavyFields) assert.equal(field in item, false);
});

test("pending review fields remain available without exposing payment internals", () => {
  const item = serializeDraftListItem(
    { _id: "draft-1", status: "draft" },
    {
      _id: "payment-1",
      status: "pending_verification",
      methodCode: "BANK_TRANSFER",
      paymentReference: "PAY-1",
      metadata: { apiKey: "secret" },
    },
  );

  assert.equal(item.status, "pending_review");
  assert.equal(item.paymentTransactionId, "payment-1");
  assert.equal(item.paymentStatus, "PENDING_VERIFICATION");
  assert.equal(item.paymentMethodCode, "BANK_TRANSFER");
  assert.equal("metadata" in item, false);
});
