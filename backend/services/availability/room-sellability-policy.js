const asValidDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const evaluateRoomSellablePeriod = ({
  roomType,
  startDate,
  endDate,
}) => {
  const periods = Array.isArray(roomType?.availability?.availablePeriods)
    ? roomType.availability.availablePeriods
    : [];

  if (!startDate && !endDate) {
    return {
      isSellable: true,
      policyConfigured: periods.length > 0,
      matchedPeriod: null,
    };
  }

  if (!periods.length) {
    return {
      isSellable: true,
      policyConfigured: false,
      matchedPeriod: null,
    };
  }

  const requestedStart = asValidDate(startDate);
  const requestedEnd = asValidDate(endDate);
  if (!requestedStart || !requestedEnd || requestedEnd <= requestedStart) {
    return {
      isSellable: false,
      policyConfigured: true,
      matchedPeriod: null,
    };
  }

  const matchedPeriod = periods.find((period) => {
    if (period?.isActive === false) return false;
    const periodStart = asValidDate(period?.startDate);
    const periodEnd = asValidDate(period?.endDate);
    return Boolean(
      periodStart &&
      periodEnd &&
      requestedStart >= periodStart &&
      requestedEnd <= periodEnd
    );
  }) || null;

  return {
    isSellable: Boolean(matchedPeriod),
    policyConfigured: true,
    matchedPeriod,
  };
};

export const isRoomSellableInPeriod = (input) =>
  evaluateRoomSellablePeriod(input).isSellable;
