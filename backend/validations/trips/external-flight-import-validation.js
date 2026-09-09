import Joi from "joi";

export const externalFlightImportSchema = Joi.object({
  provider: Joi.string().uppercase().valid("DUFFEL").default("DUFFEL"),
  offerId: Joi.string().trim().pattern(/^off_[A-Za-z0-9]+$/).required(),
});
