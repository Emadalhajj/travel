import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../../../DB/mongoose.js";
import TripDeparture from "../../../models/transportition/trip-departure-model.js";

dotenv.config();

const INDEX_NAME = "unique_external_trip_departure_identity";
const keysMatch = (key = {}) =>
  key.providerId === 1 && key.externalId === 1 && Object.keys(key).length === 2;

const run = async () => {
  await connectDB();
  const collection = TripDeparture.collection;
  const indexes = await collection.indexes();
  const current = indexes.find(({ key }) => keysMatch(key));

  if (current?.unique && current.name === INDEX_NAME) {
    console.log("External TripDeparture identity index is already hardened");
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
        { providerId: 1, externalId: 1 },
        { name: current.name },
      );
    }
    throw error;
  }
  console.log("External TripDeparture identity index hardened successfully");
};

try {
  await run();
} finally {
  await mongoose.disconnect();
}
