import { runPaymentRecoveryService } from "../services/payment/payment-recovery-service.js";

// Entry point for an external cron/scheduler. Scheduling is intentionally not
// started here so importing the application never creates a parallel timer.
export const runPaymentRecoveryJob = async ({ now = new Date(), limit = 100 } = {}) =>
  runPaymentRecoveryService({ recoveryNow: now, limit });

export const createPaymentRecoveryJobRunner = ({
  runJob = runPaymentRecoveryJob,
  onSkipped = () => {},
} = {}) => {
  let activeRun = null;

  const run = (options) => {
    if (activeRun) {
      onSkipped();
      return Promise.resolve({ skipped: true, reason: "overlap" });
    }

    activeRun = Promise.resolve().then(() => runJob(options));
    return activeRun.finally(() => {
      activeRun = null;
    });
  };

  const waitForIdle = () => activeRun?.catch(() => undefined) || Promise.resolve();

  return { run, waitForIdle, isRunning: () => Boolean(activeRun) };
};
