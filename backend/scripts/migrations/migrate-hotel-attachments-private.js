import crypto from "crypto";
import fs from "fs";
import path from "path";

import dotenv from "dotenv";
import mongoose from "mongoose";
import { assertExecuteApproved, getDatabaseConfig } from "../operations/database-safety.js";

dotenv.config({ path: ".env" });

const execute = process.argv.includes("--execute");
assertExecuteApproved({ execute, operation: "hotel attachment migration" });
const { uri, dbName } = getDatabaseConfig();

const digest = async (filePath) => {
  const buffer = await fs.promises.readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

const safeFilename = (value) => {
  const filename = path.basename(String(value || ""));
  if (!filename || filename !== value) throw new Error("Unsafe attachment filename");
  return filename;
};

await mongoose.connect(uri, {
  dbName,
  serverSelectionTimeoutMS: 10000,
});

const hotels = mongoose.connection.collection("hotels");
const documents = await hotels.find({ "attachments.0": { $exists: true } }).toArray();
const sourceRoot = path.resolve("uploads", "hotels");
const targetRoot = path.resolve("private-uploads", "hotel-attachments");
const summary = { mode: execute ? "execute" : "dry-run", scanned: 0, eligible: 0, changed: 0, skipped: 0, alreadyPrivate: 0, missing: 0, failed: 0 };

if (execute) await fs.promises.mkdir(targetRoot, { recursive: true });

for (const hotel of documents) {
  let changed = false;
  for (const attachment of hotel.attachments || []) {
    summary.scanned += 1;
    const filename = safeFilename(attachment.fileName || path.basename(String(attachment.url || "")));
    const privateUrl = `/api/private-files/hotels/${hotel._id}/${attachment._id}`;
    const source = path.join(sourceRoot, filename);
    const target = path.join(targetRoot, filename);

    if (attachment.url === privateUrl && fs.existsSync(target)) {
      summary.alreadyPrivate += 1;
      summary.skipped += 1;
      continue;
    }
    if (!fs.existsSync(source) && !fs.existsSync(target)) {
      summary.missing += 1;
      summary.failed += 1;
      continue;
    }

    summary.eligible += 1;
    if (!execute) continue;

    if (!fs.existsSync(target)) await fs.promises.copyFile(source, target);
    if (fs.existsSync(source) && (await digest(source)) !== (await digest(target))) {
      throw new Error(`Attachment copy verification failed for hotel ${hotel._id}`);
    }

    attachment.fileName = filename;
    attachment.url = privateUrl;
    changed = true;
  }

  if (execute && changed) {
    await hotels.updateOne({ _id: hotel._id }, { $set: { attachments: hotel.attachments } });
    for (const attachment of hotel.attachments || []) {
      const filename = safeFilename(attachment.fileName);
      const source = path.join(sourceRoot, filename);
      const target = path.join(targetRoot, filename);
      if (fs.existsSync(source) && fs.existsSync(target) && (await digest(source)) === (await digest(target))) {
        await fs.promises.unlink(source);
        summary.changed += 1;
      }
    }
  }
}

console.log(JSON.stringify(summary));
await mongoose.disconnect();
