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
import { assertExecuteApproved, getDatabaseConfig } from "../operations/database-safety.js";

const { uri, dbName } = getDatabaseConfig();

const apply =
  process.env.APPLY_PAYMENT_TX_MIGRATION === "true";
assertExecuteApproved({ execute: apply, operation: "payment transaction legacy migration" });

await mongoose.connect(uri, {
  dbName,
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
const summary = { mode: apply ? "execute" : "dry-run", scanned: count, changed: 0, skipped: 0, failed: 0 };

if (!apply) {
  console.log(
    JSON.stringify(summary),
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

summary.changed = migrated;
console.log(JSON.stringify(summary));
await mongoose.disconnect();
