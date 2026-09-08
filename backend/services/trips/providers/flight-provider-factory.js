import AppError from "../../../utils/AppError.js";
import { searchDuffelOffers } from "./duffel-offer-service.js";

export const SUPPORTED_FLIGHT_PROVIDER_CODES = Object.freeze(["DUFFEL"]);

export const searchExternalFlightOffers = async (
  { provider = "DUFFEL", ...criteria },
  dependencies = {},
) => {
  const providerCode = String(provider || "").trim().toUpperCase();

  if (providerCode === "DUFFEL") {
    return searchDuffelOffers(criteria, dependencies.duffel);
  }

  throw new AppError("FLIGHT_PROVIDER_UNSUPPORTED", 400, "provider", {
    provider: providerCode,
  });
};
