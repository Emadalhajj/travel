import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../../DB/mongoose.js";

dotenv.config();

const run = async () => {
  await connectDB();

  const bookings = mongoose.connection.collection("bookings");
  const indexes = await bookings.indexes();
  const hasObsoleteIndex = indexes.some(({ name }) => name === "bookingId_1");

  if (hasObsoleteIndex) {
    await bookings.dropIndex("bookingId_1");
    console.log("Dropped obsolete bookings.bookingId_1 index");
  } else {
    console.log("Obsolete bookings.bookingId_1 index is already absent");
  }
};

try {
  await run();
} finally {
  await mongoose.disconnect();
}
