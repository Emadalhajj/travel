/*
وظيفته تحديد الشكل الأساسي للحجز.
*/
export const bookingInitialState = {
  selectedPackage: null,

  customer: {
    name: "",
    email: "",
    phone: "",
    nationality: "",
  },

  travelers: [],

  selectedProducts: [],

  pricing: {
    subtotal: 0,
    tax: 0,
    taxRate: 15,
    discount: 0,
    total: 0,
    currency: "SAR",
  },

  payment: {
    paymentMethod: "cash",
    paidAmount: 0,
    transactionId: "",
  },

  draftBooking: null,
  finalBooking: null,

  validationErrors: {},// يحتوي على الأخطاء التي تم التحقق منها لكل خطوة

  loading: false,
  error: null,
  documents: {},
};
