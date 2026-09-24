import mongoose from "mongoose";
import "dotenv/config";
import { getDatabaseConfig } from "./database-safety.js";

const { uri, dbName } = getDatabaseConfig();
await mongoose.connect(uri, { dbName, autoIndex: false });
const db = mongoose.connection.db;

const count = (collection, filter) => db.collection(collection).countDocuments(filter);
const duplicateCount = async (collection, field, match = {}) => (await db.collection(collection).aggregate([
  { $match: { ...match, [field]: { $exists: true, $nin: [null, ""] } } },
  { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } },
  { $count: "groups" },
]).toArray())[0]?.groups || 0;
const orphanCount = async (from, localField, to, foreignField = "_id", match = {}) => (await db.collection(from).aggregate([
  { $match: { ...match, [localField]: { $exists: true, $ne: null } } },
  { $lookup: { from: to, localField, foreignField, as: "target" } },
  { $match: { target: { $size: 0 } } },
  { $count: "count" },
]).toArray())[0]?.count || 0;

const checks = {
  inventoryCounterMismatch: await count("inventories", { $expr: { $ne: ["$available", { $subtract: [{ $subtract: ["$total", "$reserved"] }, "$blocked"] }] } }),
  inventoryNegativeCounters: await count("inventories", { $or: [{ total: { $lt: 0 } }, { reserved: { $lt: 0 } }, { blocked: { $lt: 0 } }, { available: { $lt: 0 } }] }),
  activeExpiredHolds: await count("inventoryholds", { isActive: true, expiresAt: { $lte: new Date() } }),
  bookingPricingMismatch: await count("bookings", { "pricing.total": { $gt: 0 }, $expr: { $ne: ["$pricing.total", "$pricing.totalPrice"] } }),
  paymentNegativeAmounts: await count("paymenttransactions", { amount: { $lt: 0 } }),
  orphanBookingUsers: await orphanCount("bookings", "user", "users", "_id", { isDeleted: { $ne: true } }),
  orphanDraftUsers: await orphanCount("draftbookings", "user", "users", "_id", { isDeleted: { $ne: true } }),
  orphanPaymentBookings: await orphanCount("paymenttransactions", "booking", "bookings"),
  orphanPaymentDrafts: await orphanCount("paymenttransactions", "draftBooking", "draftbookings"),
  orphanRoomHotels: await orphanCount("roomtypes", "hotel", "hotels", "_id", { isDeleted: { $ne: true } }),
  duplicateBookingNumbers: await duplicateCount("bookings", "bookingNumber", { isDeleted: { $ne: true } }),
  duplicatePaymentReferences: await duplicateCount("paymenttransactions", "paymentReference", { isDeleted: { $ne: true } }),
  duplicateDraftNumbers: await duplicateCount("draftbookings", "draftNumber", { isDeleted: { $ne: true } }),
};
await mongoose.disconnect();
const report = { mode: "read-only", database: dbName, checks, ok: Object.values(checks).every((value) => value === 0) };
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
