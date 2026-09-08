import Joi from "joi";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const dateOnly = Joi.string().pattern(DATE_ONLY_PATTERN);

const isPastDate = (value) => value < new Date().toISOString().slice(0, 10);

export const externalFlightSearchSchema = Joi.object({
  provider: Joi.string().uppercase().valid("DUFFEL").default("DUFFEL"),
  origin: Joi.string().trim().uppercase().length(3).pattern(/^[A-Z]{3}$/).required(),
  destination: Joi.string()
    .trim()
    .uppercase()
    .length(3)
    .pattern(/^[A-Z]{3}$/)
    .required()
    .custom((value, helpers) =>
      value === helpers.state.ancestors[0]?.origin
        ? helpers.error("any.invalid")
        : value),
  departureDate: dateOnly.required().custom((value, helpers) =>
    isPastDate(value) ? helpers.error("any.invalid") : value),
  returnDate: dateOnly.allow(null, "").optional().custom((value, helpers) =>
    value && value < helpers.state.ancestors[0]?.departureDate
      ? helpers.error("any.invalid")
      : value),
  adults: Joi.number().integer().min(1).max(9).default(1),
  children: Joi.number().integer().min(0).max(9).default(0),
  infants: Joi.number().integer().min(0).max(9).default(0).custom((value, helpers) =>
    value > helpers.state.ancestors[0]?.adults
      ? helpers.error("any.invalid")
      : value),
  cabinClass: Joi.string()
    .uppercase()
    .valid("ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST")
    .default("ECONOMY"),
});
