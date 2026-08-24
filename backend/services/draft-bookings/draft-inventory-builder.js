import { buildBookingItemsFromDraft } from "./draft-booking-service.js";

const getPositiveInteger = (value, fallback = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }

  return Math.max(1, Math.floor(number));
};

const addReservation = (reservations, {
  inventoryType,
  itemId,
  startDate,
  endDate,
  quantity,
}) => {
  if (!itemId || !startDate || !endDate) return;

  reservations.push({
    inventoryType,
    itemId,
    startDate,
    endDate,
    quantity: getPositiveInteger(quantity, 1),
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
  addReservation(inventoryReservations, {
    inventoryType: "roomType",
    itemId: room?.roomTypeId,
    startDate: room?.checkIn,
    endDate: room?.checkOut,
    quantity: room?.quantity,
  });

  const trip = bookingItems?.trip;
  addReservation(inventoryReservations, {
    inventoryType: "trip",
    itemId: trip?.tripId,
    startDate: trip?.travelDate,
    endDate: trip?.returnDate,
    quantity:
      trip?.chargeType === "PER_UNIT"
        ? trip?.quantity
        : travelersCount,
  });

  const transport = bookingItems?.transport;
  addReservation(inventoryReservations, {
    inventoryType: "transport",
    itemId: transport?.transportId,
    startDate: transport?.startDate,
    endDate: transport?.endDate,
    quantity:
      transport?.chargeType === "PER_TRAVELER"
        ? travelersCount
        : transport?.quantity,
  });

  const visa = bookingItems?.visa;
  addReservation(inventoryReservations, {
    inventoryType: "visa",
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
