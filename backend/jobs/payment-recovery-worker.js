import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../DB/mongoose.js";
import { createPaymentRecoveryJobRunner } from "./payment-recovery-job.js";
import { operationalLogger, safeErrorContext } from "../utils/operational-logger.js";

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
  onSkipped: () => operationalLogger.warn("payment_recovery_overlap_skipped"),
});
const shutdownTimeoutMs = Math.max(
  1000,
  Math.min(Number(process.env.WORKER_SHUTDOWN_TIMEOUT_MS) || 30000, 120000),
);

let timer = null;
let stopping = false;

const execute = async () => {
  try {
    const result = await runner.run({ limit: batchLimit });
    if (!result?.skipped) {
      operationalLogger.info("payment_recovery_completed", {
        counts: {
          paid: result?.paidRecovery?.processed || 0,
          paidRecovered: result?.paidRecovery?.recovered || 0,
          paidFailed: result?.paidRecovery?.failed || 0,
          holds: result?.holdRecovery?.processed || 0,
          holdsFailed: result?.holdRecovery?.failed || 0,
          drafts: result?.draftExpiration?.modifiedCount || 0,
        },
      });
    }
  } catch (error) {
    operationalLogger.error("payment_recovery_failed", safeErrorContext(error));
  }
};

const shutdown = async (reason, exitCode = 0) => {
  if (stopping) return;
  stopping = true;
  if (timer) clearInterval(timer);
  operationalLogger.info("payment_recovery_worker_stopping", { reason, exitCode });
  let timeout;
  await Promise.race([
    runner.waitForIdle(),
    new Promise((resolve) => {
      timeout = setTimeout(() => {
        operationalLogger.error("payment_recovery_shutdown_timeout", {
          reason,
          durationMs: shutdownTimeoutMs,
        });
        process.exitCode = 1;
        resolve();
      }, shutdownTimeoutMs);
      timeout.unref?.();
    }),
  ]);
  if (timeout) clearTimeout(timeout);
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  process.exitCode = exitCode;
};

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("unhandledRejection", (error) => {
  operationalLogger.error("payment_recovery_unhandled_rejection", safeErrorContext(error));
  void shutdown("unhandledRejection", 1);
});
process.once("uncaughtException", (error) => {
  operationalLogger.error("payment_recovery_uncaught_exception", safeErrorContext(error));
  void shutdown("uncaughtException", 1);
});

try {
  await connectDB();
  await execute();
  timer = setInterval(() => void execute(), intervalMs);
  operationalLogger.info("payment_recovery_worker_started", {
    durationMs: intervalMs,
    counts: { batchLimit },
  });
} catch (error) {
  operationalLogger.error("payment_recovery_worker_startup_failed", safeErrorContext(error));
  await shutdown("startupFailure", 1);
}
