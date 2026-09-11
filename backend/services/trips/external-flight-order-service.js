import AppError from "../../utils/AppError.js";
import { buildExternalFlightPassengers } from "./providers/external-flight-passenger-mapper.js";
import { createExternalFlightOrder } from "./providers/flight-provider-factory.js";
import { revalidateDraftExternalFlight } from "./external-flight-revalidation-service.js";

export const buildExternalFlightOrderInput = async ({
  draft,
  payment,
  metadata = {},
}, dependencies = {}) => {
  if (!draft?.trip?.external?.provider || !draft.trip.external.offerId) {
    throw new AppError("EXTERNAL_FLIGHT_UNAVAILABLE", 409, "trip.external");
  }

  const snapshot = await revalidateDraftExternalFlight(
    { trip: draft.trip },
    dependencies.revalidation,
  );
  const passengers = buildExternalFlightPassengers({
    travelers: draft.travelers || [],
    providerPassengers: snapshot.passengers.items || [],
    requiredIdentityDocumentTypes:
      dependencies.requiredIdentityDocumentTypes ||
      snapshot.supportedIdentityDocumentTypes ||
      [],
  });
  const orderType = String(payment?.orderType || "").toLowerCase();
  if (snapshot.paymentRequirements.requiresInstantPayment && orderType !== "instant") {
    throw new AppError("EXTERNAL_FLIGHT_INSTANT_PAYMENT_REQUIRED", 400,
      "payment.orderType");
  }

  return {
    provider: snapshot.provider,
    offer: {
      offerId: snapshot.offerId,
      pricing: snapshot.pricing,
      paymentRequirements: snapshot.paymentRequirements,
    },
    passengers,
    payment: {
      ...payment,
      amount: snapshot.pricing.total,
      currency: snapshot.pricing.currency,
    },
    metadata,
    snapshot,
  };
};

export const createExternalFlightOrderFromDraft = async (
  input,
  dependencies = {},
) => {
  const orderInput = await buildExternalFlightOrderInput(input, dependencies);
  return (dependencies.createOrder || createExternalFlightOrder)(orderInput);
};
