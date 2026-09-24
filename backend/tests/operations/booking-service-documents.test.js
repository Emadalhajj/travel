import test from "node:test";
import assert from "node:assert/strict";

import Booking from "../../models/booking/booking-model.js";
import { deliverServiceDocuments } from "../../services/operations/booking-service-document-service.js";
import { createWhatsAppService } from "../../services/notifications/whatsapp-service.js";

const booking = {
  _id: "507f1f77bcf86cd799439011",
  bookingNumber: "BK-DELIVERY",
  customer: { email: "customer@example.com", phone: "+966500000000" },
  pilgrims: [],
};
const documents = [{
  _id: "507f1f77bcf86cd799439012",
  originalName: "ticket.pdf",
  storageName: "stored-ticket.pdf",
  mimeType: "application/pdf",
}];

test("Booking keeps customer inputs separate from final service documents", () => {
  const instance = new Booking({
    bookingNumber: "BK-SCHEMA",
    user: "507f1f77bcf86cd799439013",
    pilgrims: [],
    attachments: [{ fileName: "customer-passport.jpg" }],
    serviceDocuments: [{
      documentType: "ticket",
      originalName: "ticket.pdf",
      storageName: "safe.pdf",
      url: "/api/private-files/service-documents/x/y",
    }],
  });
  assert.equal(instance.attachments[0].fileName, "customer-passport.jpg");
  assert.equal(instance.serviceDocuments[0].documentType, "ticket");
  assert.equal(instance.serviceDocuments[0].delivery.email.status, "not_requested");
});

test("delivery sends actual attachments to email and WhatsApp adapters", async () => {
  const calls = { email: null, whatsapp: null };
  const result = await deliverServiceDocuments({
    booking,
    documents,
    channels: ["email", "whatsapp"],
    emailAdapter: async (payload) => { calls.email = payload; },
    whatsappAdapter: async (payload) => { calls.whatsapp = payload; },
  });
  assert.equal(calls.email.to, "customer@example.com");
  assert.equal(calls.email.attachments[0].filename, "ticket.pdf");
  assert.equal(calls.whatsapp.to, "+966500000000");
  assert.equal(calls.whatsapp.documents[0].filename, "ticket.pdf");
  assert.equal(result.email.status, "sent");
  assert.equal(result.whatsapp.status, "sent");
});

test("a channel failure is explicit and does not hide successful delivery", async () => {
  const result = await deliverServiceDocuments({
    booking,
    documents,
    channels: ["email", "whatsapp"],
    emailAdapter: async () => {},
    whatsappAdapter: async () => { throw new Error("WhatsApp unavailable"); },
  });
  assert.equal(result.email.status, "sent");
  assert.equal(result.whatsapp.status, "failed");
  assert.match(result.whatsapp.error, /unavailable/);
});

test("WhatsApp adapter fails clearly when Cloud API is not configured", async () => {
  const send = createWhatsAppService({ environment: {} });
  await assert.rejects(
    () => send({ to: "+966500000000", message: "test", documents: [] }),
    /not configured/,
  );
});
