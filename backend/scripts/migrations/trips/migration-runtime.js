import mongoose from "mongoose";
import "dotenv/config";

export const withMigrationDatabase = async (work) => {
  const uri = process.env.DB_URL || process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MongoDB connection URI is missing");

  await mongoose.connect(uri, { dbName: process.env.DB_NAME || "umrahDB" });
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
