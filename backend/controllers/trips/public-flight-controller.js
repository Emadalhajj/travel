import asyncHandler from "../../middleware/asyncHandler.js";
import {
  createPublicExternalFlightDraft,
  searchPublicExternalFlights,
} from "../../services/trips/public-external-flight-service.js";

export const searchPublicFlights = asyncHandler(async (req, res) => {
  const data = await searchPublicExternalFlights(req.body);
  res.status(200).json({ success: true, data });
});

export const createPublicFlightDraft = asyncHandler(async (req, res) => {
  const data = await createPublicExternalFlightDraft({
    ...req.body,
    userId: req.user._id,
  });
  res.status(201).json({ success: true, data });
});
