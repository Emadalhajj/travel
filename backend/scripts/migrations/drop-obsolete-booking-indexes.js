import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../../DB/mongoose.js";
import { assertExecuteApproved, getDatabaseConfig } from "../operations/database-safety.js";

dotenv.config();

const run = async () => {
  const execute = process.argv.includes("--execute");
  getDatabaseConfig();
  assertExecuteApproved({ execute, operation: "obsolete booking index migration" });
  await connectDB();

  const bookings = mongoose.connection.collection("bookings");
  const indexes = await bookings.indexes();
  const hasObsoleteIndex = indexes.some(({ name }) => name === "bookingId_1");

  if (hasObsoleteIndex && execute) {
    await bookings.dropIndex("bookingId_1");
  }
  console.log(JSON.stringify({
    mode: execute ? "execute" : "dry-run",
    scanned: indexes.length,
    changed: hasObsoleteIndex && execute ? 1 : 0,
    pending: hasObsoleteIndex && !execute ? 1 : 0,
    skipped: hasObsoleteIndex ? 0 : 1,
    failed: 0,
  }));
};

try {
  await run();
} finally {
  await mongoose.disconnect();
}
