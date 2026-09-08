import express from "express";

import { searchExternalFlights } from "../../controllers/trips/flight-provider-controller.js";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import { flightSearchRateLimiter } from "../../middleware/security/rate-limiters.js";
import { validate } from "../../middleware/validate.js";
import { externalFlightSearchSchema } from "../../validations/trips/duffel-search-validation.js";

const duffelProviderRoutes = express.Router();

duffelProviderRoutes.post(
  "/search",
  protect,
  authorize("admin", "superAdmin"),
  flightSearchRateLimiter,
  validate(externalFlightSearchSchema),
  searchExternalFlights,
);

export default duffelProviderRoutes;
