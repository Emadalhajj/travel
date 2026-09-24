import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../../../DB/mongoose.js";
import TripDeparture from "../../../models/transportition/trip-departure-model.js";
import { assertExecuteApproved, getDatabaseConfig } from "../../operations/database-safety.js";

dotenv.config();

const INDEX_NAME = "unique_external_trip_departure_identity";
const keysMatch = (key = {}) =>
  key.providerId === 1 && key.externalId === 1 && Object.keys(key).length === 2;
const restorableOptions = (index) => Object.fromEntries(
  ["name", "unique", "sparse", "expireAfterSeconds", "partialFilterExpression", "collation"]
    .filter((key) => index?.[key] !== undefined)
    .map((key) => [key, index[key]]),
);

const run = async () => {
  const execute = process.argv.includes("--execute");
  getDatabaseConfig();
  assertExecuteApproved({ execute, operation: "external trip departure index migration" });
  await connectDB();
  const collection = TripDeparture.collection;
  const indexes = await collection.indexes();
  const current = indexes.find(({ key }) => keysMatch(key));

  if (current?.unique && current.name === INDEX_NAME) {
    console.log(JSON.stringify({ mode: execute ? "execute" : "dry-run", scanned: indexes.length, changed: 0, skipped: 1, failed: 0 }));
    return;
  }

  const duplicates = await collection.aggregate([
    {
      $match: {
        source: "API",
        isDeleted: false,
        providerId: { $type: "string", $gt: "" },
        externalId: { $type: "string", $gt: "" },
      },
    },
    {
      $group: {
        _id: { providerId: "$providerId", externalId: "$externalId" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]).toArray();

  if (duplicates.length) {
    throw new Error("Duplicate external TripDeparture identities must be resolved before creating the unique index");
  }

  if (!execute) {
    console.log(JSON.stringify({ mode: "dry-run", scanned: indexes.length, changed: 0, pending: 1, skipped: 0, failed: 0 }));
    return;
  }

  if (current) await collection.dropIndex(current.name);
  try {
    await collection.createIndex(
      { providerId: 1, externalId: 1 },
      {
        unique: true,
        name: INDEX_NAME,
        partialFilterExpression: {
          source: "API",
          isDeleted: false,
          providerId: { $type: "string", $gt: "" },
          externalId: { $type: "string", $gt: "" },
        },
      },
    );
  } catch (error) {
    if (current) {
      await collection.createIndex(
        current.key,
        restorableOptions(current),
      );
    }
    throw error;
  }
  console.log(JSON.stringify({ mode: "execute", scanned: indexes.length, changed: 1, skipped: 0, failed: 0 }));
};

try {
  await run();
} finally {
  await mongoose.disconnect();
}
