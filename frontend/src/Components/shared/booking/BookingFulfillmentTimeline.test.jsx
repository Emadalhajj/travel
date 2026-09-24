import { buildFulfillmentTimeline } from "./BookingFulfillmentTimeline";

test("builds flight fulfillment independently from booking and payment statuses", () => {
  const steps = buildFulfillmentTimeline({
    serviceType: "FLIGHT",
    fulfillment: { status: "in_progress", currentStep: "TICKET_ISSUED" },
    isArabic: false,
  });
  expect(steps.find((step) => step.key === "PROVIDER_CONFIRMED").status).toBe("complete");
  expect(steps.find((step) => step.key === "TICKET_ISSUED").status).toBe("current");
  expect(steps.find((step) => step.key === "DOCUMENTS_READY").status).toBe("upcoming");
});

test("marks every step complete only when fulfillment is completed", () => {
  const steps = buildFulfillmentTimeline({
    serviceType: "VISA",
    fulfillment: { status: "completed", currentStep: "DELIVERED" },
    isArabic: true,
  });
  expect(steps.every((step) => step.status === "complete")).toBe(true);
});
