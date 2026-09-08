import AppError from "../../../utils/AppError.js";
import { getDuffelConfig } from "../../../config/duffel.js";

const getProviderDetails = (payload = {}) => {
  const error = Array.isArray(payload.errors) ? payload.errors[0] : null;
  return {
    provider: "DUFFEL",
    providerCode: error?.code || null,
    providerType: error?.type || null,
    requestId: payload?.meta?.request_id || null,
  };
};

const createProviderError = ({ status, payload, headers }) => {
  const params = {
    ...getProviderDetails(payload),
    retryAt: headers?.get?.("ratelimit-reset") || null,
  };

  if (status === 401 || status === 403) {
    return new AppError("FLIGHT_PROVIDER_AUTH_ERROR", 502, "provider", params);
  }
  if (status === 429) {
    return new AppError("FLIGHT_PROVIDER_RATE_LIMITED", 503, "provider", params);
  }
  if (status === 400 || status === 422) {
    return new AppError("FLIGHT_SEARCH_INVALID", 400, "search", params);
  }
  return new AppError("FLIGHT_PROVIDER_UNAVAILABLE", 503, "provider", params);
};

export const createDuffelClient = ({
  fetchImpl = globalThis.fetch,
  configFactory = getDuffelConfig,
} = {}) => ({
  async request(path, { method = "GET", body, params = {} } = {}) {
    const config = configFactory();
    const baseUrl = String(config.baseUrl).replace(/\/$/, "");
    const url = new URL(`${baseUrl}${path}`);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.httpTimeoutMs);

    try {
      const response = await fetchImpl(url, {
        method,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "Duffel-Version": config.apiVersion,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw createProviderError({
          status: response.status,
          payload,
          headers: response.headers,
        });
      }

      return payload;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error?.name === "AbortError") {
        throw new AppError("FLIGHT_PROVIDER_TIMEOUT", 504, "provider", {
          provider: "DUFFEL",
        });
      }
      throw new AppError("FLIGHT_PROVIDER_UNAVAILABLE", 503, "provider", {
        provider: "DUFFEL",
      });
    } finally {
      clearTimeout(timeout);
    }
  },
});

export const duffelClient = createDuffelClient();
