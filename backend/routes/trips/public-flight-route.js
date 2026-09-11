import express from "express";
import {
  createPublicFlightDraft,
  searchPublicFlights,
} from "../../controllers/trips/public-flight-controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import {
  draftCreationRateLimiter,
  publicFlightSearchRateLimiter,
} from "../../middleware/security/rate-limiters.js";
import { validate } from "../../middleware/validate.js";
import {
  publicExternalFlightDraftSchema,
  publicExternalFlightSearchSchema,
} from "../../validations/trips/duffel-search-validation.js";

const router = express.Router();

router.post(
  "/search",
  publicFlightSearchRateLimiter,
  validate(publicExternalFlightSearchSchema),
  searchPublicFlights,
);

router.post(
  "/drafts",
  protect,
  draftCreationRateLimiter,
  validate(publicExternalFlightDraftSchema),
  createPublicFlightDraft,
);

export default router;
