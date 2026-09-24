import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { buildVoucherViewModel, generateVoucherPdf } from
  "../../services/voucher-pdf-service.js";

const bookingSnapshot = {
  _id: "507f1f77bcf86cd799439011",
  bookingNumber: "BK-ACCOMMODATION",
  serviceType: "ACCOMMODATION",
  customer: {
    name: "Test Customer",
    email: "customer@example.test",
    phone: "+966500000000",
  },
  bookingItems: {
    room: {
      hotelNameAr: "فندق الشهادة",
      hotelNameEn: "Certification Hotel",
      roomNameAr: "غرفة مزدوجة",
      roomNameEn: "Double Room",
      checkIn: "2031-10-01T00:00:00.000Z",
      checkOut: "2031-10-06T00:00:00.000Z",
      nights: 5,
      quantity: 2,
      adults: 2,
      children: 1,
      mealPlan: "breakfast",
    },
  },
  paymentStatus: "paid",
  pricing: { version: 2, total: 3454, currency: "SAR" },
};

test("accommodation voucher view uses only the historical Booking snapshot", () => {
  const view = buildVoucherViewModel({
    voucherNumber: "VCH-TEST",
    booking: bookingSnapshot,
    locale: "en",
  });
  assert.deepEqual({
    hotel: view.hotelName,
    room: view.roomTypeName,
    nights: view.nights,
    rooms: view.roomsCount,
    adults: view.adults,
    children: view.children,
    mealPlan: view.mealPlan,
    total: view.total,
    currency: view.currency,
  }, {
    hotel: "Certification Hotel",
    room: "Double Room",
    nights: 5,
    rooms: 2,
    adults: 2,
    children: 1,
    mealPlan: "breakfast",
    total: 3454,
    currency: "SAR",
  });
});

test("the same renderer selects Arabic snapshot labels and RTL", () => {
  const view = buildVoucherViewModel({
    voucherNumber: "VCH-TEST",
    booking: bookingSnapshot,
    locale: "ar-SA",
  });
  assert.equal(view.direction, "rtl");
  assert.equal(view.hotelName, "فندق الشهادة");
  assert.equal(view.roomTypeName, "غرفة مزدوجة");
});

test("the shared PDF renderer produces private Arabic and English vouchers", async () => {
  const generated = [];
  try {
    for (const locale of ["ar", "en"]) {
      const voucherNumber = `VCH-TEST-${locale.toUpperCase()}-${Date.now()}`;
      const result = await generateVoucherPdf({
        voucherNumber,
        booking: bookingSnapshot,
        locale,
        privateDocument: true,
      });
      generated.push(path.resolve("private-uploads", "service-documents", result.storageName));
      assert.equal(result.mimeType, "application/pdf");
      assert.ok(result.size > 0);
      assert.match(result.storageName, /\.pdf$/);
    }
  } finally {
    await Promise.all(generated.map((file) => unlink(file).catch(() => {})));
  }
});

test("accommodation voucher is generated at VOUCHER_READY and not during conversion", async () => {
  const fulfillment = await readFile(new URL(
    "../../services/operations/booking-fulfillment-service.js",
    import.meta.url,
  ), "utf8");
  const conversion = await readFile(new URL(
    "../../services/draft-bookings/draft-booking-service.js",
    import.meta.url,
  ), "utf8");
  assert.match(fulfillment, /currentStep !== "VOUCHER_READY"/);
  assert.match(fulfillment, /privateDocument: true/);
  assert.match(fulfillment, /operationalBoundary: true/);
  assert.match(conversion, /usesOperationalVoucher/);
  assert.match(conversion, /\["ACCOMMODATION", "HOTEL"\]/);
});

test("modern vouchers use private service documents and atomic registration", async () => {
  const pdf = await readFile(new URL(
    "../../services/voucher-pdf-service.js",
    import.meta.url,
  ), "utf8");
  const documents = await readFile(new URL(
    "../../services/operations/booking-service-document-service.js",
    import.meta.url,
  ), "utf8");
  assert.match(pdf, /path\.resolve\("private-uploads", folderName\)/);
  assert.match(documents, /documentType === documentType/);
  assert.match(documents, /Booking\.findOneAndUpdate/);
  assert.match(documents, /private-files\/service-documents/);
  const model = await readFile(new URL(
    "../../models/voucher-model.js",
    import.meta.url,
  ), "utf8");
  const service = await readFile(new URL(
    "../../services/voucher-service.js",
    import.meta.url,
  ), "utf8");
  assert.match(model, /unique_active_voucher_per_booking/);
  assert.match(service, /error\?\.code !== 11000/);
});

test("legacy voucher lookup is ownership scoped while admins remain authorized", async () => {
  const service = await readFile(new URL(
    "../../services/voucher-service.js",
    import.meta.url,
  ), "utf8");
  const controller = await readFile(new URL(
    "../../controllers/voucher-controller.js",
    import.meta.url,
  ), "utf8");
  assert.match(service, /ADMIN_ROLES\.has\(role\) \? \{\} : \{ user: userId \}/);
  assert.match(service, /DOCUMENT_NOT_FOUND/);
  assert.match(service, /INVALID_FULFILLMENT_TRANSITION/);
  assert.match(controller, /userId: req\.user\?\._id/);
  assert.match(controller, /role: req\.user\?\.role/);
});

test("legacy voucher downloads are owner scoped and public voucher files are blocked", async () => {
  const controller = await readFile(new URL(
    "../../controllers/private-file-controller.js",
    import.meta.url,
  ), "utf8");
  const routes = await readFile(new URL(
    "../../routes/private-file-routes.js",
    import.meta.url,
  ), "utf8");
  const server = await readFile(new URL("../../server.js", import.meta.url), "utf8");
  assert.match(controller, /export const downloadLegacyVoucher/);
  assert.match(controller, /ADMIN_ROLES\.has\(req\.user\.role\) \? \{\} : \{ user: req\.user\._id \}/);
  assert.match(routes, /private-files\/vouchers\/:voucherId/);
  assert.match(server, /app\.use\("\/uploads\/vouchers"/);
});

test("legacy voucher generation remains available for non-accommodation bookings", async () => {
  const conversion = await readFile(new URL(
    "../../services/draft-bookings/draft-booking-service.js",
    import.meta.url,
  ), "utf8");
  assert.match(conversion, /voucher = usesOperationalVoucher\s*\? null\s*:\s*await createVoucherForBooking/);
});
