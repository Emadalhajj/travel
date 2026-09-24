import mongoose from "mongoose";
import dotenv from "dotenv";

import {
  seedPaymentMethods,
} from "./payment-method-seeder.js";
import { assertExecuteApproved, getDatabaseConfig } from "../scripts/operations/database-safety.js";

dotenv.config();

const run = async () => {
  try {
    const execute = process.argv.includes("--execute");
    assertExecuteApproved({ execute, operation: "payment method seed" });
    const { uri: databaseUrl, dbName } = getDatabaseConfig();

    await mongoose.connect(databaseUrl, {
      dbName,
    });

    console.log("MongoDB connected");

    const summary = await seedPaymentMethods({ execute });
    console.log(JSON.stringify(summary, null, 2));

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
