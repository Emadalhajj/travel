import api from "../api";

const LOOKUP_PATHS = Object.freeze({
  hotels: "/lookups/hotels",
  roomType: "/lookups/room-types",
  trip: "/lookups/trips",
  transport: "/lookups/transports",
  vehicleRental: "/lookups/vehicle-rentals",
  extraService: "/lookups/extra-services",
  visa: "/lookups/visas",
  paymentMethod: "/lookups/payment-methods",
  paymentProvider: "/lookups/payment-providers",
  bankAccount: "/lookups/bank-accounts",
});

export async function apiGetAdminLookup(type, params) {
  const path = LOOKUP_PATHS[type];
  if (!path) throw new Error(`Unsupported lookup: ${type}`);
  const response = await api.get(path, { params });
  return response.data?.data ?? [];
}

export async function apiGetHotelLookupById(hotelId) {
  const response = await api.get(`/lookups/hotels/${hotelId}`);
  return response.data?.data;
}
