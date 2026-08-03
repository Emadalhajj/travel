import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  apiCreatePaymentProvider,
  apiDeletePaymentProvider,
  apiGetPaymentProviderById,
  apiGetPaymentProviders,
  apiUpdatePaymentProvider,
  apiUpdatePaymentProviderStatus,
} from "../../services/api/admin/paymentProvider";

import {
  handleApiError,
} from "../../Utils/handleApiError";

const initialPagination = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const initialState = {
  paymentProvidersList: [],
  selectedProvider: null,
  loading: false,
  detailsLoading: false,
  saving: false,
  error: null,
  pagination: initialPagination,
};

export const fetchPaymentProviders =
  createAsyncThunk(
    "paymentProviders/fetch",
    async (
      params,
      {
        rejectWithValue,
      },
    ) => {
      try {
        return await apiGetPaymentProviders(
          params,
        );
      } catch (error) {
        return handleApiError(
          error,
          rejectWithValue,
        );
      }
    },
  );

export const fetchPaymentProviderById =
  createAsyncThunk(
    "paymentProviders/fetchById",
    async (
      providerId,
      {
        rejectWithValue,
      },
    ) => {
      try {
        const response =
          await apiGetPaymentProviderById(
            providerId,
          );

        return response.data;
      } catch (error) {
        return handleApiError(
          error,
          rejectWithValue,
        );
      }
    },
  );

export const createPaymentProvider =
  createAsyncThunk(
    "paymentProviders/create",
    async (
      payload,
      {
        rejectWithValue,
      },
    ) => {
      try {
        const response =
          await apiCreatePaymentProvider(
            payload,
          );

        return response.data;
      } catch (error) {
        return handleApiError(
          error,
          rejectWithValue,
        );
      }
    },
  );

export const updatePaymentProvider =
  createAsyncThunk(
    "paymentProviders/update",
    async (
      {
        providerId,
        data,
      },
      {
        rejectWithValue,
      },
    ) => {
      try {
        const response =
          await apiUpdatePaymentProvider({
            providerId,
            data,
          });

        return response.data;
      } catch (error) {
        return handleApiError(
          error,
          rejectWithValue,
        );
      }
    },
  );

export const updatePaymentProviderStatus =
  createAsyncThunk(
    "paymentProviders/updateStatus",
    async (
      {
        providerId,
        isActive,
      },
      {
        rejectWithValue,
      },
    ) => {
      try {
        const response =
          await apiUpdatePaymentProviderStatus({
            providerId,
            isActive,
          });

        return response.data;
      } catch (error) {
        return handleApiError(
          error,
          rejectWithValue,
        );
      }
    },
  );

export const deletePaymentProvider =
  createAsyncThunk(
    "paymentProviders/delete",
    async (
      providerId,
      {
        rejectWithValue,
      },
    ) => {
      try {
        await apiDeletePaymentProvider(
          providerId,
        );

        return providerId;
      } catch (error) {
        return handleApiError(
          error,
          rejectWithValue,
        );
      }
    },
  );

const replaceProvider = (
  providers,
  updatedProvider,
) =>
  providers.map((provider) =>
    provider._id ===
    updatedProvider?._id
      ? updatedProvider
      : provider,
  );

const paymentProviderSlice =
  createSlice({
    name: "paymentProviders",
    initialState,

    reducers: {
      setPage: (
        state,
        action,
      ) => {
        state.pagination.page =
          action.payload;
      },

      setLimit: (
        state,
        action,
      ) => {
        state.pagination.limit =
          action.payload;
        state.pagination.page = 1;
      },

      clearPaymentProviderError: (
        state,
      ) => {
        state.error = null;
      },

      clearSelectedPaymentProvider: (
        state,
      ) => {
        state.selectedProvider = null;
        state.detailsLoading = false;
      },

      setSelectedPaymentProvider: (
        state,
        action,
      ) => {
        state.selectedProvider =
          action.payload || null;
      },

      resetPaymentProviderState: () =>
        initialState,
    },

    extraReducers: (builder) => {
      builder
        .addCase(
          fetchPaymentProviders.pending,
          (state) => {
            state.loading = true;
            state.error = null;
          },
        )
        .addCase(
          fetchPaymentProviders.fulfilled,
          (state, action) => {
            state.loading = false;
            state.paymentProvidersList =
              action.payload?.data || [];
            state.pagination = {
              ...initialPagination,
              ...action.payload
                ?.pagination,
            };
          },
        )
        .addCase(
          fetchPaymentProviders.rejected,
          (state, action) => {
            state.loading = false;
            state.error =
              action.payload;
          },
        )

        .addCase(
          fetchPaymentProviderById.pending,
          (state) => {
            state.detailsLoading = true;
            state.error = null;
          },
        )
        .addCase(
          fetchPaymentProviderById.fulfilled,
          (state, action) => {
            state.detailsLoading = false;
            state.selectedProvider =
              action.payload;
          },
        )
        .addCase(
          fetchPaymentProviderById.rejected,
          (state, action) => {
            state.detailsLoading = false;
            state.error =
              action.payload;
          },
        )

        .addCase(
          createPaymentProvider.pending,
          (state) => {
            state.saving = true;
            state.error = null;
          },
        )
        .addCase(
          createPaymentProvider.fulfilled,
          (state, action) => {
            state.saving = false;

            if (action.payload) {
              state.paymentProvidersList.unshift(
                action.payload,
              );
              state.pagination.total += 1;
            }
          },
        )
        .addCase(
          createPaymentProvider.rejected,
          (state, action) => {
            state.saving = false;
            state.error =
              action.payload;
          },
        )

        .addCase(
          updatePaymentProvider.pending,
          (state) => {
            state.saving = true;
            state.error = null;
          },
        )
        .addCase(
          updatePaymentProvider.fulfilled,
          (state, action) => {
            state.saving = false;
            state.paymentProvidersList =
              replaceProvider(
                state.paymentProvidersList,
                action.payload,
              );
            state.selectedProvider =
              action.payload;
          },
        )
        .addCase(
          updatePaymentProvider.rejected,
          (state, action) => {
            state.saving = false;
            state.error =
              action.payload;
          },
        )

        .addCase(
          updatePaymentProviderStatus.pending,
          (state) => {
            state.loading = true;
            state.error = null;
          },
        )
        .addCase(
          updatePaymentProviderStatus.fulfilled,
          (state, action) => {
            state.loading = false;
            state.paymentProvidersList =
              replaceProvider(
                state.paymentProvidersList,
                action.payload,
              );
          },
        )
        .addCase(
          updatePaymentProviderStatus.rejected,
          (state, action) => {
            state.loading = false;
            state.error =
              action.payload;
          },
        )

        .addCase(
          deletePaymentProvider.pending,
          (state) => {
            state.loading = true;
            state.error = null;
          },
        )
        .addCase(
          deletePaymentProvider.fulfilled,
          (state, action) => {
            state.loading = false;
            state.paymentProvidersList =
              state.paymentProvidersList.filter(
                (provider) =>
                  provider._id !==
                  action.payload,
              );
            state.pagination.total =
              Math.max(
                state.pagination.total -
                  1,
                0,
              );
          },
        )
        .addCase(
          deletePaymentProvider.rejected,
          (state, action) => {
            state.loading = false;
            state.error =
              action.payload;
          },
        );
    },
  });

export const {
  setPage,
  setLimit,
  clearPaymentProviderError,
  clearSelectedPaymentProvider,
  setSelectedPaymentProvider,
  resetPaymentProviderState,
} = paymentProviderSlice.actions;

export const selectPaymentProviders = (
  state,
) =>
  state.paymentProviders
    ?.paymentProvidersList || [];

export const selectPaymentProviderPagination = (
  state,
) =>
  state.paymentProviders?.pagination ||
  initialPagination;

export const selectSelectedPaymentProvider = (
  state,
) =>
  state.paymentProviders
    ?.selectedProvider || null;

export const selectPaymentProvidersLoading = (
  state,
) =>
  Boolean(
    state.paymentProviders?.loading,
  );

export const selectPaymentProviderDetailsLoading = (
  state,
) =>
  Boolean(
    state.paymentProviders
      ?.detailsLoading,
  );

export const selectPaymentProviderSaving = (
  state,
) =>
  Boolean(
    state.paymentProviders?.saving,
  );

export const selectPaymentProviderError = (
  state,
) =>
  state.paymentProviders?.error ||
  null;

export default paymentProviderSlice.reducer;
