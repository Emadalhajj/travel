import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import AppError from "../../utils/AppError.js";
import { errorHandler } from "../../middleware/errorHandler.js";
import {
  ERROR_MESSAGES,
  translateError,
} from "../../constants/errors/error-messages.js";

const runErrorHandler = (error, language) => {
  let response;
  const res = {
    status(statusCode) {
      return {
        json(payload) {
          response = { statusCode, payload };
          return response;
        },
      };
    },
  };

  errorHandler(
    error,
    { headers: { "accept-language": language } },
    res,
    () => {},
  );

  return response;
};

test("returns an Arabic coded field error", () => {
  const response = runErrorHandler(
    new AppError("TRIP_NOT_FOUND", 404, "tripId"),
    "ar-SA",
  );

  assert.deepEqual(response, {
    statusCode: 404,
    payload: {
      success: false,
      code: "TRIP_NOT_FOUND",
      message: "الرحلة المرتبطة غير موجودة",
      field: "tripId",
    },
  });
});

test("returns the English translation from Accept-Language", () => {
  const response = runErrorHandler(
    new AppError("TRIP_NOT_FOUND", 404, "tripId"),
    "en-US,en;q=0.9",
  );

  assert.equal(response.payload.message, "The related trip was not found");
});

test("supports replacing every occurrence of a message placeholder", () => {
  const message = translateError("TRIP_DEPARTURE_NOT_FOUND", "en", {
    id: 15,
  });
  assert.equal(message, "Trip departure #15 was not found");
});

test("keeps legacy free-text errors backward compatible", () => {
  const response = runErrorHandler(
    new AppError("رسالة قديمة", 400, "nameAr"),
    "en",
  );

  assert.equal(response.payload.message, "رسالة قديمة");
  assert.equal("code" in response.payload, false);
});

const collectJavaScriptFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? collectJavaScriptFiles(entryPath)
      : entry.name.endsWith(".js")
        ? [entryPath]
        : [];
  });

test("all production AppError calls use registered localized codes", () => {
  const backendDirectory = path.resolve(import.meta.dirname, "../..");
  const productionFiles = collectJavaScriptFiles(backendDirectory).filter(
    (file) =>
      !file.includes(`${path.sep}tests${path.sep}`) &&
      !file.includes(`${path.sep}node_modules${path.sep}`),
  );
  const invalidCalls = [];
  const missingCodes = [];
  const appErrorPattern = /new\s+AppError\s*\(\s*([^,\n)]+)/g;

  productionFiles.forEach((file) => {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(appErrorPattern)) {
      const codeMatch = match[1].trim().match(/^"([A-Z][A-Z0-9_]+)"$/);
      if (!codeMatch) {
        invalidCalls.push(`${path.relative(backendDirectory, file)}: ${match[1].trim()}`);
      } else if (!ERROR_MESSAGES[codeMatch[1]]) {
        missingCodes.push(`${path.relative(backendDirectory, file)}: ${codeMatch[1]}`);
      }
    }
  });

  assert.deepEqual(invalidCalls, []);
  assert.deepEqual(missingCodes, []);
});
