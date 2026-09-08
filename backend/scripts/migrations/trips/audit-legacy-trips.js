import { auditLegacyTrips } from "./trip-migration-lib.js";
import { printReport, withMigrationDatabase } from "./migration-runtime.js";

await withMigrationDatabase(async (db) => {
  const report = await auditLegacyTrips(db);
  printReport("Legacy Trips Audit (read-only)", report.counts);
  const reviews = report.classifications
    .filter(({ classification }) =>
      ["MANUAL_REVIEW", "UNMAPPABLE", "INVENTORY_INCONSISTENT"]
        .includes(classification.status),
    )
    .map(({ trip, classification }) => ({
      tripId: trip._id,
      nameAr: trip.nameAr || "",
      nameEn: trip.nameEn || "",
      legacyType: trip.tripType || null,
      type: trip.type || null,
      subtype: trip.subtype || null,
      startDate: trip.startDate || null,
      capacity: {
        totalSeats: trip.capacity?.totalSeats ?? null,
        maxAdults: trip.capacity?.maxAdults ?? null,
        maxChildren: trip.capacity?.maxChildren ?? null,
      },
      ...classification,
    }));
  if (reviews.length) printReport("Manual review / skipped records", reviews);
});
