import { buildCustomerBookingTimeline } from "./CustomerBookingTimeline";

test("customer timeline maps paid pending booking to a friendly state without internals", () => {
  const steps = buildCustomerBookingTimeline({
    bookingStatus: "pending",
    paymentStatus: "paid",
    latestPaymentStatus: "paid_pending_booking",
    isArabic: true,
  });
  expect(steps[2].label).toBe("تم استلام الدفع وجارٍ استكمال تأكيد الحجز");
  expect(steps[2].status).toBe("current");
  expect(JSON.stringify(steps)).not.toMatch(/audit|ip|metadata/i);
});

test("customer timeline explains bank review and confirmed bookings reach confirmation", () => {
  const review = buildCustomerBookingTimeline({ latestPaymentStatus: "pending_verification", isArabic: false });
  expect(review[2].label).toBe("Bank transfer received and under review");
  expect(review[2].status).toBe("current");

  const confirmed = buildCustomerBookingTimeline({ bookingStatus: "confirmed", paymentStatus: "paid", isArabic: false });
  expect(confirmed[3].status).toBe("complete");
  expect(confirmed[4].status).toBe("current");
});

test("customer timeline provides Arabic and English labels", () => {
  expect(buildCustomerBookingTimeline({ isArabic: true })[0].label).toBe("تم إنشاء الحجز");
  expect(buildCustomerBookingTimeline({ isArabic: false })[0].label).toBe("Booking created");
});
