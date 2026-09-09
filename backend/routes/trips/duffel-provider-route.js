import express from "express";

import { importExternalFlight, searchExternalFlights } from "../../controllers/trips/flight-provider-controller.js";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import { flightSearchRateLimiter } from "../../middleware/security/rate-limiters.js";
import { validate } from "../../middleware/validate.js";
import { externalFlightSearchSchema } from "../../validations/trips/duffel-search-validation.js";
import { externalFlightImportSchema } from "../../validations/trips/external-flight-import-validation.js";

const duffelProviderRoutes = express.Router();

duffelProviderRoutes.post(
  "/search",
  protect,
  authorize("admin", "superAdmin"),
  flightSearchRateLimiter,
  validate(externalFlightSearchSchema),
  searchExternalFlights,
);

duffelProviderRoutes.post(
  "/import",
  protect,
  authorize("admin", "superAdmin"),
  flightSearchRateLimiter,
  validate(externalFlightImportSchema),
  importExternalFlight,
);

export default duffelProviderRoutes;
