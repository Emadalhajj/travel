import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  apiGetPaymentTransactions,
  apiGetPaymentTransactionDetails,
  apiApproveBankTransfer,
  apiRejectBankTransfer,
  apiCapturePaymentTransaction,
  apiVerifyProviderPaymentTransaction,
  apiRefundPaymentTransaction,
  apiCancelPaymentTransaction,
} from "../../services/api/admin/paymentTransactions";

import { handleApiError } from "../../Utils/handleApiError";

const runOperation = async (
  apiCall,
  payload,
  rejectWithValue,
) => {
  try {
    return await apiCall(payload);
  } catch (error) {
    return handleApiError(
      error,
      rejectWithValue,
      "ar",
      { structured: true },
    );
  }
};

export const fetchPaymentTransactions =
  createAsyncThunk(
    "paymentTransactions/fetchList",
    async (params, { rejectWithValue }) =>
      runOperation(
        apiGetPaymentTransactions,
        params,
        rejectWithValue,
      ),
  );

export const fetchPaymentTransactionDetails =
  createAsyncThunk(
    "paymentTransactions/fetchDetails",
    async (transactionId, { rejectWithValue }) =>
      runOperation(
        apiGetPaymentTransactionDetails,
        transactionId,
        rejectWithValue,
      ),
  );

const createOperationThunk = (
  name,
  apiCall,
) =>
  createAsyncThunk(
    `paymentTransactions/${name}`,
    async (payload, { rejectWithValue }) =>
      runOperation(
        apiCall,
        payload,
        rejectWithValue,
      ),
  );

export const approveBankTransfer =
  createOperationThunk(
    "approveBankTransfer",
    apiApproveBankTransfer,
  );
export const rejectBankTransfer =
  createOperationThunk(
    "rejectBankTransfer",
    apiRejectBankTransfer,
  );
export const capturePaymentTransaction =
  createOperationThunk(
    "capture",
    apiCapturePaymentTransaction,
  );
export const verifyProviderPaymentTransaction =
  createOperationThunk(
    "verifyProviderPayment",
    apiVerifyProviderPaymentTransaction,
  );
export const refundPaymentTransaction =
  createOperationThunk(
    "refund",
    apiRefundPaymentTransaction,
  );
export const cancelPaymentTransaction =
  createOperationThunk(
    "cancel",
    apiCancelPaymentTransaction,
  );

const operationThunks = [
  approveBankTransfer,
  rejectBankTransfer,
  capturePaymentTransaction,
  verifyProviderPaymentTransaction,
  refundPaymentTransaction,
  cancelPaymentTransaction,
];

const initialState = {
  items: [],
  pagination: null,
  filters: {
    page: 1,
    limit: 20,
    search: "",
    status: "",
    paymentMethodCode: "",
    providerCode: "",
    dateFrom: "",
    dateTo: "",
  },
  selectedTransaction: null,
  listLoading: false,
  detailsLoading: false,
  operationLoading: false,
  activeOperation: "",
  error: null,
};

const slice = createSlice({
  name: "paymentTransactions",
  initialState,
  reducers: {
    setPaymentTransactionFilters: (
      state,
      action,
    ) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    clearSelectedPaymentTransaction: (
      state,
    ) => {
      state.selectedTransaction = null;
    },
    clearPaymentTransactionError: (
      state,
    ) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchPaymentTransactions.pending,
        (state) => {
          state.listLoading = true;
          state.error = null;
        },
      )
      .addCase(
        fetchPaymentTransactions.fulfilled,
        (state, action) => {
          state.listLoading = false;
          state.items = action.payload?.data || [];
          state.pagination =
            action.payload?.pagination || null;
        },
      )
      .addCase(
        fetchPaymentTransactions.rejected,
        (state, action) => {
          state.listLoading = false;
          state.error = action.payload;
        },
      )
      .addCase(
        fetchPaymentTransactionDetails.pending,
        (state) => {
          state.detailsLoading = true;
          state.error = null;
        },
      )
      .addCase(
        fetchPaymentTransactionDetails.fulfilled,
        (state, action) => {
          state.detailsLoading = false;
          state.selectedTransaction =
            action.payload?.data || null;
        },
      )
      .addCase(
        fetchPaymentTransactionDetails.rejected,
        (state, action) => {
          state.detailsLoading = false;
          state.error = action.payload;
        },
      );

    operationThunks.forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.operationLoading = true;
          state.activeOperation = thunk.typePrefix;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.operationLoading = false;
          state.activeOperation = "";
          const result = action.payload?.data;
          if (
            state.selectedTransaction &&
            result?.transactionId
          ) {
            state.selectedTransaction = {
              ...state.selectedTransaction,
              ...result,
            };
          }
        })
        .addCase(thunk.rejected, (state, action) => {
          state.operationLoading = false;
          state.activeOperation = "";
          state.error = action.payload;
        });
    });
  },
});

export const {
  setPaymentTransactionFilters,
  clearSelectedPaymentTransaction,
  clearPaymentTransactionError,
} = slice.actions;

export default slice.reducer;
