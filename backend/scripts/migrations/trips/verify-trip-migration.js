import { verifyTripMigration } from "./trip-migration-lib.js";
import { printReport, withMigrationDatabase } from "./migration-runtime.js";

const report = await withMigrationDatabase((db) => verifyTripMigration(db));
printReport("Trip Migration Verification", report);
if (!report.ok) process.exitCode = 1;
