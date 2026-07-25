import mongoose from "mongoose";
import dotenv from "dotenv";

import {
  seedPaymentMethods,
} from "./payment-method-seeder.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI,
    );

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