const apiUrl = String(process.env.SMOKE_API_URL || "").trim().replace(/\/$/, "");
const frontendOrigin = String(process.env.SMOKE_FRONTEND_ORIGIN || "").trim();
const allowHttp = process.env.SMOKE_ALLOW_HTTP === "true";

if (!apiUrl) throw new Error("SMOKE_API_URL is required");
if (!frontendOrigin) throw new Error("SMOKE_FRONTEND_ORIGIN is required");
if (!allowHttp && !apiUrl.startsWith("https://")) {
  throw new Error("SMOKE_API_URL must use HTTPS (set SMOKE_ALLOW_HTTP=true only for local staging)");
}

const request = async (path, options = {}) => {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    signal: AbortSignal.timeout(10000),
  });
  return response;
};

const expectJson = async (path, expectedStatus, expectedBody) => {
  const response = await request(path);
  const body = await response.json();
  if (response.status !== expectedStatus || body.status !== expectedBody.status) {
    throw new Error(`${path} failed: HTTP ${response.status}, body=${JSON.stringify(body)}`);
  }
  if (!response.headers.get("x-request-id")) {
    throw new Error(`${path} failed: X-Request-Id response header is missing`);
  }
};

await expectJson("/health", 200, { status: "ok" });
await expectJson("/ready", 200, { status: "ready" });

const privateStatic = await request("/uploads/draft-bookings/phase3-smoke.txt");
if (privateStatic.status !== 404) {
  throw new Error(`private static-file guard failed: HTTP ${privateStatic.status}`);
}

const corsPreflight = await request("/api/visa", {
  method: "OPTIONS",
  headers: {
    Origin: frontendOrigin,
    "Access-Control-Request-Method": "GET",
  },
});
if (
  corsPreflight.status !== 204
  || corsPreflight.headers.get("access-control-allow-origin") !== frontendOrigin
) {
  throw new Error(`CORS preflight failed: HTTP ${corsPreflight.status}`);
}

console.log("Runtime smoke checks passed");
