import AppError from "../../../utils/AppError.js";
import { getDuffelOffer, searchDuffelOffers } from "./duffel-offer-service.js";
import {
  createDuffelOrder,
  findDuffelOrdersByOffer,
  getDuffelOrder,
} from "./duffel-order-service.js";

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

export const getExternalFlightOffer = async (
  { provider = "DUFFEL", offerId },
  dependencies = {},
) => {
  const providerCode = String(provider || "").trim().toUpperCase();

  if (providerCode === "DUFFEL") {
    return getDuffelOffer(offerId, dependencies.duffel);
  }

  throw new AppError("FLIGHT_PROVIDER_UNSUPPORTED", 400, "provider", {
    provider: providerCode,
  });
};

export const createExternalFlightOrder = async (
  { provider = "DUFFEL", ...input },
  dependencies = {},
) => {
  const providerCode = String(provider || "").trim().toUpperCase();
  if (providerCode === "DUFFEL") {
    return createDuffelOrder(input, dependencies.duffel);
  }
  throw new AppError("FLIGHT_PROVIDER_UNSUPPORTED", 400, "provider", {
    provider: providerCode,
  });
};

export const getExternalFlightOrder = async (
  { provider = "DUFFEL", orderId },
  dependencies = {},
) => {
  const providerCode = String(provider || "").trim().toUpperCase();
  if (providerCode === "DUFFEL") {
    return getDuffelOrder(orderId, dependencies.duffel);
  }
  throw new AppError("FLIGHT_PROVIDER_UNSUPPORTED", 400, "provider", {
    provider: providerCode,
  });
};

export const findExternalFlightOrdersByOffer = async (
  { provider = "DUFFEL", offerId },
  dependencies = {},
) => {
  const providerCode = String(provider || "").trim().toUpperCase();
  if (providerCode === "DUFFEL") {
    return findDuffelOrdersByOffer(offerId, dependencies.duffel);
  }
  throw new AppError("FLIGHT_PROVIDER_UNSUPPORTED", 400, "provider", {
    provider: providerCode,
  });
};
