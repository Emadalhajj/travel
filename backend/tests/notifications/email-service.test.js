import assert from "node:assert/strict";
import test from "node:test";

import { buildEmailHtml, createEmailService } from "../../services/notifications/email-service.js";

const configuredEnvironment = {
  EMAIL_HOST: "smtp.example.com",
  EMAIL_PORT: "587",
  EMAIL_SECURE: "false",
  EMAIL_USER: "smtp-user",
  EMAIL_PASS: "smtp-password",
  EMAIL_FROM: "no-reply@example.com",
  EMAIL_FROM_NAME: "Travel App",
};

test("SMTP adapter sends through a cached transporter", async () => {
  let transporterCreations = 0;
  const messages = [];
  const sendEmail = createEmailService({
    environment: configuredEnvironment,
    nodemailerClient: {
      createTransport: (configuration) => {
        transporterCreations += 1;
        assert.equal(configuration.host, "smtp.example.com");
        return { sendMail: async (message) => messages.push(message) };
      },
    },
  });

  await sendEmail({ to: "one@example.com", subject: "First", text: "Message" });
  await sendEmail({ to: "two@example.com", subject: "Second", text: "Message" });

  assert.equal(transporterCreations, 1);
  assert.equal(messages.length, 2);
});

test("email HTML wrapper escapes dynamic values", () => {
  const html = buildEmailHtml({
    title: "<script>alert(1)</script>",
    message: "Customer & booking <b>text</b>",
  });

  assert.equal(html.includes("<script>"), false);
  assert.equal(html.includes("<b>text</b>"), false);
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("Customer &amp; booking"));
});

test("email adapter rejects missing recipient before SMTP configuration", async () => {
  const sendEmail = createEmailService({ environment: {} });
  await assert.rejects(
    () => sendEmail({ to: "", subject: "Subject", text: "Message" }),
    /Email recipient is missing/,
  );
});

test("email adapter reports missing SMTP configuration", async () => {
  const sendEmail = createEmailService({ environment: {} });
  await assert.rejects(
    () => sendEmail({ to: "recipient@example.com", subject: "Subject", text: "Message" }),
    /Email service is not configured/,
  );
});
