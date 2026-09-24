import fs from "fs/promises";

const normalizeRecipient = (value) => String(value || "").replace(/\D/g, "");

const requestWithTimeout = async (url, options, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `WhatsApp request failed (${response.status})`);
    return data;
  } finally {
    clearTimeout(timer);
  }
};

export const createWhatsAppService = ({ environment = process.env } = {}) =>
  async ({ to, message, documents = [] }) => {
    const token = String(environment.WHATSAPP_ACCESS_TOKEN || "").trim();
    const phoneNumberId = String(environment.WHATSAPP_PHONE_NUMBER_ID || "").trim();
    const apiVersion = String(environment.WHATSAPP_API_VERSION || "v22.0").trim();
    const timeoutMs = Math.max(1000, Number(environment.WHATSAPP_TIMEOUT_MS) || 15000);
    const recipient = normalizeRecipient(to);
    if (!token || !phoneNumberId) throw new Error("WhatsApp service is not configured");
    if (!recipient) throw new Error("WhatsApp recipient is missing");
    const baseUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`;
    const headers = { Authorization: `Bearer ${token}` };

    if (!documents.length) {
      return requestWithTimeout(`${baseUrl}/messages`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient,
          type: "text",
          text: { body: String(message || "") },
        }),
      }, timeoutMs);
    }

    const results = [];
    for (const document of documents) {
      const buffer = await fs.readFile(document.path);
      const form = new FormData();
      form.append("messaging_product", "whatsapp");
      form.append("type", document.contentType || "application/octet-stream");
      form.append("file", new Blob([buffer], { type: document.contentType }), document.filename);
      const media = await requestWithTimeout(`${baseUrl}/media`, {
        method: "POST",
        headers,
        body: form,
      }, timeoutMs);
      results.push(await requestWithTimeout(`${baseUrl}/messages`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient,
          type: "document",
          document: {
            id: media.id,
            filename: document.filename,
            caption: String(message || "").slice(0, 1024),
          },
        }),
      }, timeoutMs));
    }
    return { success: true, results };
  };

export const sendWhatsApp = createWhatsAppService();
