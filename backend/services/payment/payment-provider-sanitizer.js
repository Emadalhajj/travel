
export  const sanitizePaymentProviderForAudit = (
  provider,
) => {
  const source =
    typeof provider?.toObject === "function"
      ? provider.toObject()
      : { ...provider };

  if (source.credentials) {
    source.credentials = {
      ...source.credentials,

      entityId: source.credentials.entityId || "",

      accessToken: source.credentials.accessToken
        ? "***configured***"
        : "",

      webhookSecret:
        source.credentials.webhookSecret
          ? "***configured***"
          : "",

      apiKey: source.credentials.apiKey
        ? "***configured***"
        : "",

      apiSecret: source.credentials.apiSecret
        ? "***configured***"
        : "",
    };
  }

  return source;
};
