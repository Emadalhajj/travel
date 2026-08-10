/*
=====================================================
Payment Transaction Legacy Fields Migration
=====================================================

يشغل مرة واحدة قبل اعتماد الموديل المنظف.
ينشئ Backup داخل مجموعة مستقلة ثم ينقل القيم القديمة:
- gatewayReference -> paymentReference عند غيابها.
- transactionId -> providerReference عند غيابها.
ثم يحذف gatewayReference/gatewayResponse/transactionId.

التشغيل الفعلي يتطلب:
APPLY_PAYMENT_TX_MIGRATION=true
=====================================================
*/

import mongoose from "mongoose";
import "dotenv/config";

const uri =
  process.env.DB_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MongoDB connection URI is missing");
}

const apply =
  process.env.APPLY_PAYMENT_TX_MIGRATION === "true";

await mongoose.connect(uri, {
  dbName:
    process.env.DB_NAME ||
    "umrahDB",
});

const db = mongoose.connection.db;
const transactions = db.collection("paymenttransactions");
const backups = db.collection(
  "paymenttransaction_legacy_backups",
);

const filter = {
  $or: [
    { gatewayReference: { $exists: true } },
    { gatewayResponse: { $exists: true } },
    { transactionId: { $exists: true } },
  ],
};

const count = await transactions.countDocuments(filter);
console.log(`Legacy transactions found: ${count}`);

if (!apply) {
  console.log(
    "Dry run only. Set APPLY_PAYMENT_TX_MIGRATION=true to apply.",
  );
  await mongoose.disconnect();
  process.exit(0);
}

const cursor = transactions.find(filter);
let migrated = 0;

for await (const transaction of cursor) {
  await backups.updateOne(
    { transactionId: transaction._id },
    {
      $setOnInsert: {
        transactionId: transaction._id,
        legacy: {
          gatewayReference:
            transaction.gatewayReference,
          gatewayResponse:
            transaction.gatewayResponse,
          transactionId:
            transaction.transactionId,
        },
        backedUpAt: new Date(),
      },
    },
    { upsert: true },
  );

  const set = {};

  if (
    !transaction.paymentReference &&
    transaction.gatewayReference
  ) {
    set.paymentReference =
      transaction.gatewayReference;
  }

  if (
    !transaction.providerReference &&
    transaction.transactionId
  ) {
    set.providerReference =
      transaction.transactionId;
  }

  await transactions.updateOne(
    { _id: transaction._id },
    {
      ...(Object.keys(set).length
        ? { $set: set }
        : {}),
      $unset: {
        gatewayReference: "",
        gatewayResponse: "",
        transactionId: "",
      },
    },
  );

  migrated += 1;
}

console.log(`Migrated transactions: ${migrated}`);
await mongoose.disconnect();
