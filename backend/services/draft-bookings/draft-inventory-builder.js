import { buildBookingItemsFromDraft } from "./draft-booking-service.js";
import { INVENTORY_TYPES } from "../../constants/inventory/inventory-types.js";
import { INVENTORY_RESERVATION_MODES } from "../../constants/inventory/inventory-reservation-modes.js";
import AppError from "../../utils/AppError.js";

const getPositiveInteger = (value, fallback = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }

  return Math.max(1, Math.floor(number));
};

const addPeriodReservation = (reservations, {
  inventoryType,
  itemId,
  startDate,
  endDate,
  quantity,
  defaultTotal = 0,
}) => {
  if (!itemId || !startDate || !endDate) return;

  reservations.push({
    inventoryType,
    reservationMode: INVENTORY_RESERVATION_MODES.PERIOD,
    itemId,
    startDate,
    endDate,
    quantity: getPositiveInteger(quantity, 1),
    defaultTotal: Math.max(Number(defaultTotal) || 0, 0),
  });
};

const addSingleReservation = (reservations, {
  inventoryType,
  itemId,
  date,
  quantity,
  defaultTotal = 0,
}) => {
  if (!itemId || !date) return;

  reservations.push({
    inventoryType,
    reservationMode: INVENTORY_RESERVATION_MODES.SINGLE,
    itemId,
    date,
    quantity: getPositiveInteger(quantity, 1),
    defaultTotal: Math.max(Number(defaultTotal) || 0, 0),
  });
};

/*
ترجمة نقية من شكل DraftBooking إلى متطلبات المخزون.
لا تحجز موارد ولا تعرف أي شيء عن InventoryHold أو Payment.
*/
export const buildInventoryRequirementsFromDraft = ({ draft }) => {
  const safeDraft = draft || {};
  const travelersCount = Math.max(
    1,
    Array.isArray(safeDraft.travelers)
      ? safeDraft.travelers.length
      : 0,
  );
  const bookingItems = buildBookingItemsFromDraft(safeDraft);
  const inventoryReservations = [];

  const room = bookingItems?.room;
  addPeriodReservation(inventoryReservations, {
    inventoryType: INVENTORY_TYPES.ROOM_TYPE,
    itemId: room?.roomTypeId,
    startDate: room?.checkIn,
    endDate: room?.checkOut,
    quantity: room?.quantity,
  });

  const trip = bookingItems?.trip;
  const tripQuantity =
    trip?.chargeType === "PER_UNIT" ? trip?.quantity : travelersCount;

  if (trip?.tripId || trip?.departureId || trip?.departureAt) {
    if (!trip?.tripId || !trip?.departureId || !trip?.departureAt) {
      throw new AppError(
        "TRIP_DEPARTURE_DATA_INCOMPLETE",
        400,
        "trip.departureId",
      );
    }

    addSingleReservation(inventoryReservations, {
      inventoryType: INVENTORY_TYPES.TRIP_DEPARTURE,
      itemId: trip.departureId,
      date: trip.departureAt,
      quantity: tripQuantity,
      defaultTotal: 0,
    });
  }

  const transport = bookingItems?.transport;
  addPeriodReservation(inventoryReservations, {
    inventoryType: INVENTORY_TYPES.TRANSPORT,
    itemId: transport?.transportId,
    startDate: transport?.startDate,
    endDate: transport?.endDate,
    quantity:
      transport?.chargeType === "PER_TRAVELER"
        ? travelersCount
        : transport?.quantity,
  });

  const visa = bookingItems?.visa;
  addPeriodReservation(inventoryReservations, {
    inventoryType: INVENTORY_TYPES.VISA,
    itemId: visa?.visaId,
    startDate: safeDraft.program?.startDate,
    endDate: safeDraft.program?.endDate,
    quantity:
      visa?.chargeType === "PER_UNIT"
        ? visa?.quantity
        : travelersCount,
  });

  return {
    programReservation: safeDraft.program?.programId
      ? {
          programId: safeDraft.program.programId,
          seats: travelersCount,
        }
      : null,
    inventoryReservations,
  };
};
