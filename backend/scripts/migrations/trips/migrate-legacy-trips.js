import { migrateLegacyTrips } from "./trip-migration-lib.js";
import { printReport, withMigrationDatabase } from "./migration-runtime.js";

const execute = process.argv.includes("--execute");
if (execute && process.argv.includes("--dry-run")) {
  throw new Error("Choose either --dry-run or --execute");
}

await withMigrationDatabase(async (db) => {
  const report = await migrateLegacyTrips(db, { execute });
  printReport(execute ? "Legacy Trips Migration" : "Legacy Trips Migration (dry-run)", report);
  if (!execute) console.log("No data changed. Re-run with --execute after reviewing the audit.");
});
