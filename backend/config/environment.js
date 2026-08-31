const splitOrigins = (value = "") =>
  String(value).split(",").map((item) => item.trim()).filter(Boolean);

export const getAllowedOrigins = () => {
  const origins = splitOrigins(process.env.FRONTEND_URL);
  if (origins.length) return origins;
  if (process.env.NODE_ENV === "production") {
    throw new Error("FRONTEND_URL is required in production");
  }
  return ["http://localhost:3000"];
};

export const getTrustProxy = () => {
  const value = String(process.env.TRUST_PROXY || "").trim();
  if (!value) return false;
  if (value === "true") return 1;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
};

export const validateStartupEnvironment = () => {
  const required = ["DB_URL", "DB_NAME", "JWT_SECRET"];
  if (process.env.NODE_ENV === "production") {
    required.push("FRONTEND_URL", "JWT_EXPIRES_IN");
  }
  const missing = required.filter((key) => !String(process.env[key] || "").trim());
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);

  const googleValues = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_CALLBACK_URL"];
  const configuredGoogleValues = googleValues.filter((key) => process.env[key]);
  if (configuredGoogleValues.length > 0 && configuredGoogleValues.length < googleValues.length) {
    throw new Error("Google OAuth configuration is incomplete");
  }

  getAllowedOrigins();
};
