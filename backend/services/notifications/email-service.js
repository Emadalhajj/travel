import nodemailer from "nodemailer";

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const buildEmailHtml = ({ title, message }) => `
  <div dir="auto" style="font-family:Arial,sans-serif;line-height:1.7;color:#172033">
    <h2 style="margin:0 0 16px">${escapeHtml(title)}</h2>
    <p style="margin:0;white-space:pre-line">${escapeHtml(message)}</p>
  </div>
`;

export const createEmailService = ({
  nodemailerClient = nodemailer,
  environment = process.env,
} = {}) => {
  let cachedTransporter = null;
  let cachedConfigurationKey = "";

  const getConfiguration = () => {
    const host = String(environment.EMAIL_HOST || "").trim();
    const port = Number(environment.EMAIL_PORT || 587);
    const secure = String(environment.EMAIL_SECURE || "").toLowerCase() === "true";
    const user = String(environment.EMAIL_USER || "").trim();
    const rawPass = String(environment.EMAIL_PASS || "").trim();
    const pass = host.includes("gmail.com")
      ? rawPass.replace(/\s+/g, "")
      : rawPass;
    const from = String(environment.EMAIL_FROM || user).trim();
    const fromName = String(environment.EMAIL_FROM_NAME || "Travel App").trim();

    if (!host || !user || !pass || !from || !Number.isInteger(port) || port <= 0) {
      throw new Error("Email service is not configured");
    }

    return { host, port, secure, user, pass, from, fromName };
  };

  const getTransporter = (configuration) => {
    const key = JSON.stringify({
      host: configuration.host,
      port: configuration.port,
      secure: configuration.secure,
      user: configuration.user,
    });
    if (!cachedTransporter || cachedConfigurationKey !== key) {
      cachedTransporter = nodemailerClient.createTransport({
        host: configuration.host,
        port: configuration.port,
        secure: configuration.secure,
        auth: {
          user: configuration.user,
          pass: configuration.pass,
        },
      });
      cachedConfigurationKey = key;
    }
    return cachedTransporter;
  };

  return async ({ to, subject, text, html }) => {
    const recipient = String(to || "").trim();
    if (!recipient) throw new Error("Email recipient is missing");

    const configuration = getConfiguration();
    const safeSubject = String(subject || "Notification").replace(/[\r\n]+/g, " ").trim();
    const message = String(text || html || "").trim();
    const transporter = getTransporter(configuration);

    return transporter.sendMail({
      from: configuration.fromName
        ? `"${configuration.fromName.replaceAll('"', "")}" <${configuration.from}>`
        : configuration.from,
      to: recipient,
      subject: safeSubject,
      text: message,
      html: buildEmailHtml({ title: safeSubject, message }),
    });
  };
};

export const sendEmail = createEmailService();
