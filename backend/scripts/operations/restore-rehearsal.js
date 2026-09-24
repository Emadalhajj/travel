import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { MongoClient } from "mongodb";

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.once("error", reject);
  child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}: ${stderr.trim()}`)));
});

const temporaryRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "travel-phase4-restore-"));
const archive = path.join(temporaryRoot, "backup.archive.gz");
const uri = String(process.env.RESTORE_REHEARSAL_URI || "mongodb://127.0.0.1:27017").trim();
const parsed = new URL(uri);
if (!new Set(["127.0.0.1", "localhost", "::1"]).has(parsed.hostname)) {
  throw new Error("Restore rehearsal accepts loopback MongoDB only");
}
const suffix = crypto.randomBytes(6).toString("hex");
const sourceName = `phase4_source_${suffix}`;
const restoreName = `phase4_restore_${suffix}`;
const client = new MongoClient(uri);

try {
  await client.connect();
  const source = client.db(sourceName);
  await source.collection("rehearsal").insertMany([
    { key: "alpha", amount: 10 },
    { key: "beta", amount: 20 },
  ]);
  await source.collection("rehearsal").createIndex({ key: 1 }, { unique: true, name: "unique_rehearsal_key" });

  await run("mongodump", [`--uri=${uri}`, `--db=${sourceName}`, `--archive=${archive}`, "--gzip"]);
  const backup = await fs.promises.readFile(archive);
  if (!backup.length) throw new Error("Backup archive is empty");

  for (let round = 1; round <= 2; round += 1) {
    await run("mongorestore", [
      `--uri=${uri}`,
      `--archive=${archive}`,
      "--gzip",
      "--drop",
      `--nsFrom=${sourceName}.*`,
      `--nsTo=${restoreName}.*`,
    ]);
    const restored = client.db(restoreName);
    const documents = await restored.collection("rehearsal").find({}, { projection: { _id: 0 } }).sort({ key: 1 }).toArray();
    const indexes = await restored.collection("rehearsal").indexes();
    if (JSON.stringify(documents) !== JSON.stringify([{ key: "alpha", amount: 10 }, { key: "beta", amount: 20 }])) {
      throw new Error(`Restore verification failed on round ${round}`);
    }
    if (!indexes.some((index) => index.name === "unique_rehearsal_key" && index.unique)) {
      throw new Error(`Index restore verification failed on round ${round}`);
    }
  }

  console.log(JSON.stringify({
    environment: "isolated-ephemeral",
    backupBytes: backup.length,
    backupSha256: crypto.createHash("sha256").update(backup).digest("hex"),
    restoredDocuments: 2,
    restoredIndexes: 2,
    rehearsalRounds: 2,
    productionConnections: 0,
    ok: true,
  }, null, 2));
} finally {
  await client.db(sourceName).dropDatabase().catch(() => {});
  await client.db(restoreName).dropDatabase().catch(() => {});
  await client.close().catch(() => {});
  await fs.promises.rm(temporaryRoot, { recursive: true, force: true });
}
