import mongoose from "mongoose";
import "dotenv/config";
import { getDatabaseConfig } from "../../operations/database-safety.js";

export const withMigrationDatabase = async (work) => {
  const { uri, dbName } = getDatabaseConfig();

  await mongoose.connect(uri, { dbName });
  try {
    return await work(mongoose.connection.db);
  } finally {
    await mongoose.disconnect();
  }
};

export const printReport = (title, report) => {
  console.log(title);
  console.log(JSON.stringify(report, null, 2));
};
