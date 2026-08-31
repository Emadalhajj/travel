import Hotel from "../../models/hotels/hotel-model.js";
import RoomType from "../../models/hotels/roomType-model.js";
import Trip from "../../models/transportition/trip-model.js";
import Transport from "../../models/transportition/transport-model.js";
import VehicleRental from "../../models/transportition/vehicle-rental-model.js";
import ExtraService from "../../models/extra-services/extra-service-model.js";
import Visa from "../../models/visa-model.js";
import PaymentMethod from "../../models/payments/payment-method-model.js";
import PaymentProvider from "../../models/payments/payment-provider-model.js";
import BankAccount from "../../models/payments/bank-account-model.js";

const MAX_LIMIT = 100;

const definitions = Object.freeze({
  hotels: { model: Hotel, fields: "nameAr nameEn" },
  "room-types": { model: RoomType, fields: "nameAr nameEn" },
  trips: { model: Trip, fields: "nameAr nameEn" },
  transports: { model: Transport, fields: "nameAr nameEn" },
  "vehicle-rentals": { model: VehicleRental, fields: "nameAr nameEn" },
  "extra-services": { model: ExtraService, fields: "nameAr nameEn" },
  visas: { model: Visa, fields: "name.ar name.en" },
  "payment-methods": {
    model: PaymentMethod,
    fields: "code nameAr nameEn configurationType requiresBankAccount requiresPaymentProvider isActive",
    map: (row) => row,
  },
  "payment-providers": {
    model: PaymentProvider,
    fields: "code nameAr nameEn supportedPaymentMethods isActive",
    map: (row) => row,
  },
  "bank-accounts": {
    model: BankAccount,
    fields: "bankNameAr bankNameEn accountNameAr accountNameEn beneficiaryName iban isActive",
    map: (row) => row,
  },
});

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function getAdminLookupService({ type, search, limit = 100 }) {
  const definition = definitions[type];
  if (!definition) {
    const error = new Error("Unsupported lookup type");
    error.statusCode = 400;
    throw error;
  }

  const boundedLimit = Math.min(Math.max(Number(limit) || 100, 1), MAX_LIMIT);
  const query = { isActive: { $ne: false } };
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    query.$or = type === "visas"
      ? [{ "name.ar": pattern }, { "name.en": pattern }]
      : [{ nameAr: pattern }, { nameEn: pattern }];
  }

  const rows = await definition.model
    .find(query)
    .select(definition.fields)
    .sort(type === "visas" ? { "name.en": 1 } : { nameEn: 1 })
    .limit(boundedLimit)
    .lean();

  return rows.map(definition.map || ((row) => ({
    _id: row._id,
    nameAr: row.nameAr ?? row.name?.ar ?? "",
    nameEn: row.nameEn ?? row.name?.en ?? "",
  })));
}

export async function getHotelLookupByIdService(hotelId) {
  return Hotel.findById(hotelId).select("nameAr nameEn").lean();
}
