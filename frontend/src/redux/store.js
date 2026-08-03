import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./auth/authSlice";
import bookingReducer from "./bookings/bookingsSlice";
import visaReducer from "./visas/visaSlice";
import visaTypeReducer from "./visas/visaTypeSlice";
import roomTypeReducer from "./hotels/roomtypeSlice";
import hotelReducer from "./hotels/hotelSlice";
import transportReducer from "./transports/transportSlice";
import tripReducer from "./transports/tripSlice";
import usersReducer from "./auth/usersSlice";
import umrahProgramReducer from "./umrah/umrahProgramSlice";
import extraServiceReducer from "./extraServices/extraServiceSlice";
import vehicleRentalReducer from "./transports/vehicleRentalSlice";
import inventoryReducer from "./inventory/inventorySlice";
import publicProgramReducer from "./public/programSlice";
import publicBookingReducer from "./public/bookingSlice";
import publicPaymentReducer from "./public/publicPaymentSlice";
import bankAccountsReducer from "./payments/bankAccountSlice";
import paymentMethodsReducer from "./payments/paymentMethodSlice";
import paymentProvidersReducer from "./payments/paymentProviderSlice";
import paymentConfigurationReducer from "./payments/paymentConfigurationSlice";
import publicPaymentConfigurationReducer from "./public/publicPaymentConfigurationSlice";
import paymentTransactionReducer from "./payments/paymentTransactionSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    bookings: bookingReducer,
    visas: visaReducer,
    visaTypes: visaTypeReducer,
    roomTypes: roomTypeReducer,
    hotels: hotelReducer,
    transport: transportReducer,
    trip: tripReducer,
    users: usersReducer,
    umrahPrograms: umrahProgramReducer,
    extraServices: extraServiceReducer,
    vehicleRentals: vehicleRentalReducer,
    inventory: inventoryReducer,
    publicPrograms: publicProgramReducer,

    publicBooking: publicBookingReducer,
    publicPayment: publicPaymentReducer,
    bankAccounts: bankAccountsReducer,
    paymentMethods: paymentMethodsReducer,
    paymentProviders: paymentProvidersReducer,
    paymentConfigurations: paymentConfigurationReducer,
    publicPaymentConfigurations:
  publicPaymentConfigurationReducer,
    paymentTransactions: paymentTransactionReducer,

  }, // أضف الـ reducers الخاصة بك هنا
});

export default store;
