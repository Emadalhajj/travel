import asyncHandler from "../../middleware/asyncHandler.js";
import { searchExternalFlightOffers } from "../../services/trips/providers/flight-provider-factory.js";
import { importExternalFlightOffer } from "../../services/trips/external-flight-import-service.js";

export const searchExternalFlights = asyncHandler(async (req, res) => {
  const offers = await searchExternalFlightOffers(req.body);

  res.status(200).json({
    success: true,
    data: offers,
  });
});

export const importExternalFlight = asyncHandler(async (req, res) => {
  const imported = await importExternalFlightOffer({
    ...req.body,
    userId: req.user?._id,
    req,
  });

  res.status(201).json({
    success: true,
    data: imported,
  });
});
