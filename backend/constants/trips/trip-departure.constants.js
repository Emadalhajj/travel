export const TRIP_DEPARTURE_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
});

export const TRIP_DEPARTURE_STATUS_VALUES = Object.freeze(
  Object.values(TRIP_DEPARTURE_STATUS),
);

export const TRIP_DEPARTURE_STATUS_TRANSITIONS = Object.freeze({
  [TRIP_DEPARTURE_STATUS.DRAFT]: Object.freeze([
    TRIP_DEPARTURE_STATUS.SCHEDULED,
    TRIP_DEPARTURE_STATUS.CANCELLED,
  ]),
  [TRIP_DEPARTURE_STATUS.SCHEDULED]: Object.freeze([
    TRIP_DEPARTURE_STATUS.COMPLETED,
    TRIP_DEPARTURE_STATUS.CANCELLED,
  ]),
  [TRIP_DEPARTURE_STATUS.CANCELLED]: Object.freeze([]),
  [TRIP_DEPARTURE_STATUS.COMPLETED]: Object.freeze([]),
});

export const canTransitionTripDepartureStatus = (fromStatus, toStatus) =>
  fromStatus === toStatus ||
  Boolean(TRIP_DEPARTURE_STATUS_TRANSITIONS[fromStatus]?.includes(toStatus));
