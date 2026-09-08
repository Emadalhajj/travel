import asyncHandler from "../../middleware/asyncHandler.js";
import { searchExternalFlightOffers } from "../../services/trips/providers/flight-provider-factory.js";

export const searchExternalFlights = asyncHandler(async (req, res) => {
  const offers = await searchExternalFlightOffers(req.body);

  res.status(200).json({
    success: true,
    data: offers,
  });
});
