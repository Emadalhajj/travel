import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiAuthorizeDraftBookingPayment, apiGetPaymentStatus }
 from "../../services/api/public/paymentApi";
// import {
//   apiAuthorizeDraftBookingPayment,
//   apiGetPaymentStatus,
// } from "../../../services/api/public/paymentApi";

/*
=========================================================
Public Payment Slice
=========================================================

هذا Slice خاص بدفع العميل.

مهم:
لا يتم عمل Capture من العميل مباشرة.
العميل فقط يبدأ Authorization.
=========================================================
*/

export const authorizeDraftBookingPayment = createAsyncThunk(
  "publicPayment/authorizeDraftBookingPayment",
  async ({ draftBookingId, paymentData }, { rejectWithValue }) => {
    try {
      return await apiAuthorizeDraftBookingPayment(draftBookingId, paymentData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "حدث خطأ أثناء تفويض الدفع",
      );
    }
  },
);

export const fetchPaymentStatus = createAsyncThunk(
  "publicPayment/fetchPaymentStatus",
  async (paymentId, { rejectWithValue }) => {
    try {
      return await apiGetPaymentStatus(paymentId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "حدث خطأ أثناء جلب حالة الدفع",
      );
    }
  },
);

const initialState = {
  payment: null,
  paymentStatus: null,
  authorizationUrl: null,

  loading: false,
  error: null,
  success: false,
};

const publicPaymentSlice = createSlice({
  name: "publicPayment",
  initialState,
  reducers: {
    clearPublicPaymentError: (state) => {
      state.error = null;
    },

    resetPublicPayment: () => initialState,
  },
  extraReducers: (builder) => {
    builder

      // Authorization
      .addCase(authorizeDraftBookingPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(authorizeDraftBookingPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.payment =
          action.payload?.data || action.payload?.payment || action.payload;

        state.authorizationUrl =
          action.payload?.authorizationUrl ||
          action.payload?.data?.authorizationUrl ||
          action.payload?.paymentUrl ||
          null;
      })
      .addCase(authorizeDraftBookingPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Payment Status
      .addCase(fetchPaymentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentStatus.fulfilled, (state, action) => {
        state.loading = false;

        state.paymentStatus =
          action.payload?.status ||
          action.payload?.data?.status ||
          action.payload;
      })
      .addCase(fetchPaymentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPublicPaymentError, resetPublicPayment } =
  publicPaymentSlice.actions;

export default publicPaymentSlice.reducer;
