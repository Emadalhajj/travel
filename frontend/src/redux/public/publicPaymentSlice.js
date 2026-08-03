import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  apiGetPaymentStatus,
  apiInitializePublicPayment,
  apiSubmitBankTransferProof,
} from "../../services/api/public/paymentApi";

import { handleApiError } from "../../Utils/handleApiError";

const rejectPaymentError = (
  error,
  rejectWithValue,
) =>
  handleApiError(
    error,
    rejectWithValue,
    "ar",
    { structured: true },
  );

export const initializePublicPayment =
  createAsyncThunk(
    "publicPayment/initialize",
    async (payload, { rejectWithValue }) => {
      try {
        return await apiInitializePublicPayment(payload);
      } catch (error) {
        return rejectPaymentError(
          error,
          rejectWithValue,
        );
      }
    },
  );

export const fetchPaymentStatus =
  createAsyncThunk(
    "publicPayment/fetchPaymentStatus",
    async (transactionId, { rejectWithValue }) => {
      try {
        return await apiGetPaymentStatus(transactionId);
      } catch (error) {
        return rejectPaymentError(
          error,
          rejectWithValue,
        );
      }
    },
  );

export const submitBankTransferProof =
  createAsyncThunk(
    "publicPayment/submitBankTransferProof",
    async (payload, { rejectWithValue }) => {
      try {
        return await apiSubmitBankTransferProof(payload);
      } catch (error) {
        return rejectPaymentError(
          error,
          rejectWithValue,
        );
      }
    },
  );

const initialState = {
  initializationLoading: false,
  initializationResult: null,
  initializationError: null,
  paymentStatus: null,
  statusLoading: false,
  statusError: null,
  proofSubmitting: false,
  proofSubmissionResult: null,
  proofFieldErrors: {},
};

const publicPaymentSlice = createSlice({
  name: "publicPayment",
  initialState,
  reducers: {
    clearPublicPaymentError: (state) => {
      state.initializationError = null;
      state.statusError = null;
      state.proofFieldErrors = {};
    },
    clearPaymentStatus: (state) => {
      state.paymentStatus = null;
      state.statusError = null;
      state.statusLoading = false;
    },
    resetPublicPayment: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializePublicPayment.pending, (state) => {
        state.initializationLoading = true;
        state.initializationError = null;
      })
      .addCase(initializePublicPayment.fulfilled, (state, action) => {
        state.initializationLoading = false;
        state.initializationResult = action.payload?.data || null;
      })
      .addCase(initializePublicPayment.rejected, (state, action) => {
        state.initializationLoading = false;
        state.initializationError = action.payload;
      })
      .addCase(fetchPaymentStatus.pending, (state) => {
        state.statusLoading = true;
        state.statusError = null;
      })
      .addCase(fetchPaymentStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.paymentStatus = action.payload?.data || action.payload || null;
      })
      .addCase(fetchPaymentStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.statusError = action.payload;
      })
      .addCase(submitBankTransferProof.pending, (state) => {
        state.proofSubmitting = true;
        state.proofFieldErrors = {};
      })
      .addCase(submitBankTransferProof.fulfilled, (state, action) => {
        state.proofSubmitting = false;
        state.proofSubmissionResult = action.payload?.data || null;
      })
      .addCase(submitBankTransferProof.rejected, (state, action) => {
        state.proofSubmitting = false;
        state.proofFieldErrors = action.payload?.errors || {};
      });
  },
});

export const {
  clearPublicPaymentError,
  clearPaymentStatus,
  resetPublicPayment,
} = publicPaymentSlice.actions;

export default publicPaymentSlice.reducer;
