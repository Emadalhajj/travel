import { runPaymentRecoveryService } from "../services/payment/payment-recovery-service.js";

// Entry point for an external cron/scheduler. Scheduling is intentionally not
// started here so importing the application never creates a parallel timer.
export const runPaymentRecoveryJob = async ({ now = new Date(), limit = 100 } = {}) =>
  runPaymentRecoveryService({ recoveryNow: now, limit });
