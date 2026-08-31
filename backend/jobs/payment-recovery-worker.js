import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../DB/mongoose.js";
import { createPaymentRecoveryJobRunner } from "./payment-recovery-job.js";

dotenv.config();

const intervalMs = Math.max(
  60000,
  Math.min(Number(process.env.PAYMENT_RECOVERY_INTERVAL_MS) || 120000, 300000),
);
const batchLimit = Math.max(
  1,
  Math.min(Number(process.env.PAYMENT_RECOVERY_BATCH_LIMIT) || 100, 500),
);
const runner = createPaymentRecoveryJobRunner({
  onSkipped: () => console.warn("Payment recovery run skipped because the previous run is active"),
});

let timer = null;
let stopping = false;

const execute = async () => {
  try {
    const result = await runner.run({ limit: batchLimit });
    if (!result?.skipped) {
      console.log("Payment recovery completed", {
        paid: result?.paidRecovery?.processed || 0,
        holds: result?.holdRecovery?.processed || 0,
        drafts: result?.draftExpiration?.modifiedCount || 0,
      });
    }
  } catch (error) {
    console.error("Payment recovery failed:", error?.message || error);
  }
};

const shutdown = async (reason, exitCode = 0) => {
  if (stopping) return;
  stopping = true;
  if (timer) clearInterval(timer);
  console.log(`Stopping payment recovery worker: ${reason}`);
  await runner.waitForIdle();
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  process.exitCode = exitCode;
};

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("unhandledRejection", (error) => {
  console.error("Unhandled recovery worker rejection:", error?.message || error);
  void shutdown("unhandledRejection", 1);
});
process.once("uncaughtException", (error) => {
  console.error("Uncaught recovery worker exception:", error?.message || error);
  void shutdown("uncaughtException", 1);
});

try {
  await connectDB();
  await execute();
  timer = setInterval(() => void execute(), intervalMs);
  console.log(`Payment recovery worker started with interval ${intervalMs}ms`);
} catch (error) {
  console.error("Payment recovery worker startup failed:", error?.message || error);
  await shutdown("startupFailure", 1);
}
