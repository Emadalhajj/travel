import { randomUUID } from "node:crypto";

import { operationalLogger } from "../utils/operational-logger.js";

const VALID_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export const requestContext = (req, res, next) => {
  const supplied = String(req.get("x-request-id") || "").trim();
  req.requestId = VALID_REQUEST_ID.test(supplied) ? supplied : randomUUID();
  res.setHeader("x-request-id", req.requestId);
  const startedAt = process.hrtime.bigint();

  res.once("finish", () => {
    operationalLogger.info("http_request", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Number(process.hrtime.bigint() - startedAt) / 1e6,
    });
  });
  next();
};
