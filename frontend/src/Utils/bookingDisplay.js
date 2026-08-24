export const buildTravelerFullName = (traveler = {}) =>
  [
    traveler.firstNameAr || traveler.firstNameEn,
    traveler.secondNameAr || traveler.secondNameEn,
    traveler.thirdNameAr || traveler.thirdNameEn,
    traveler.lastNameAr || traveler.lastNameEn,
  ]
    .filter(Boolean)
    .join(" ");

export const formatGenderLabel = (value, t) => {
  if (value === "male") return t?.("male", "ذكر") || "ذكر";
  if (value === "female") return t?.("female", "أنثى") || "أنثى";
  return "-";
};

export const getBookingTotal = (booking) =>
  Number(
    booking?.pricing?.totalPrice ??
      booking?.pricing?.total ??
      booking?.pricing?.totalAmount ??
      0,
  );
