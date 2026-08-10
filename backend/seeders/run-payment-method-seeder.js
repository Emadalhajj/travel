import mongoose from "mongoose";
import dotenv from "dotenv";

import {
  seedPaymentMethods,
} from "./payment-method-seeder.js";

dotenv.config();

const run = async () => {
  try {
    const databaseUrl =
      process.env.DB_URL ||
      process.env.MONGO_URI ||
      process.env.MONGODB_URI;

    if (!databaseUrl) {
      throw new Error(
        "MongoDB connection URI is missing",
      );
    }

    await mongoose.connect(databaseUrl, {
      dbName:
        process.env.DB_NAME ||
        "umrahDB",
    });

    console.log("MongoDB connected");

    await seedPaymentMethods();

    console.log(
      "Payment method seeding completed",
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error(
      "Payment method seeding failed:",
      error,
    );

    await mongoose.disconnect();

    process.exit(1);
  }
};

run();
