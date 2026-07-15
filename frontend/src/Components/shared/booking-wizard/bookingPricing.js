const TAX_RATE = 15;

const getPositiveNumber = (...values) => {
  for (const value of values) {
    const number = Number(value);

    if (Number.isFinite(number) && number > 0) {
      return number;
    }
  }

  return 0;
};

export const getProgramUnitPrice = (program) =>
  getPositiveNumber(
    program?.pricing?.finalPrice,
    program?.pricing?.totalPrice,
    program?.pricing?.basePrice,
    program?.finalPrice,
    program?.totalPrice,
    program?.basePrice,
  );

export const getProgramAvailableSeats = (program) => {
  const seats = [
    program?.capacity?.availableSeats,
    program?.availableSeats,
    program?.remainingSeats,
  ].find((value) => {
    const number = Number(value);

    return Number.isFinite(number) && number >= 0;
  });

  return seats === undefined ? null : Number(seats);
};

export const calculateBookingPricing = ({
  selectedPackage,
  travelers = [],
  selectedProducts = [],
  fallbackPricing = {},
}) => {
  const travelersCount = Math.max(1, travelers.length || 1);
  const packageUnitPrice = getProgramUnitPrice(selectedPackage);

  const selectedProductsSubtotal = selectedProducts.reduce((sum, item) => {
    const price = getPositiveNumber(
      item?.priceAtTime,
      item?.price,
      item?.pricing?.finalPrice,
      item?.pricing?.totalPrice,
      item?.pricing?.basePrice,
    );
    const quantity = Number(item?.quantity || 1);

    return sum + price * quantity;
  }, 0);

  const subtotal =
    packageUnitPrice > 0
      ? packageUnitPrice * travelersCount + selectedProductsSubtotal
      : getPositiveNumber(fallbackPricing?.subtotal, fallbackPricing?.total);

  const discount = Number(fallbackPricing?.discount || 0);
  const tax = Number((subtotal * (TAX_RATE / 100)).toFixed(2));
  const total = Math.max(0, Number((subtotal + tax - discount).toFixed(2)));

  return {
    subtotal,
    tax,
    taxRate: TAX_RATE,
    discount,
    total,
    currency: fallbackPricing?.currency || selectedPackage?.pricing?.currency || "SAR",
  };
};
