import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  apiGetPublicPaymentConfigurations,
} from "../../services/api/public/paymentConfiguration";

import {
  handleApiError,
} from "../../Utils/handleApiError";

export const fetchPublicPaymentConfigurations =
  createAsyncThunk(
    "publicPaymentConfigurations/fetch",

    async (
      params,
      {
        rejectWithValue,
      },
    ) => {
      try {
        return await apiGetPublicPaymentConfigurations(
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

const initialState = {
  items: [],

  selectedMethodCode: "",

  loading: false,

  error: null,
};

const publicPaymentConfigurationSlice =
  createSlice({
    name:
      "publicPaymentConfigurations",

    initialState,

    reducers: {
      setSelectedPublicPaymentMethod:
        (
          state,
          action,
        ) => {
          state.selectedMethodCode =
            action.payload ||
            "";
        },

      clearPublicPaymentConfigurations:
        (state) => {
          state.items = [];

          state.selectedMethodCode =
            "";

          state.error =
            null;
        },
    },

    extraReducers:
      (builder) => {
        builder
          .addCase(
            fetchPublicPaymentConfigurations.pending,
            (state) => {
              state.loading =
                true;

              state.error =
                null;
            },
          )
          .addCase(
            fetchPublicPaymentConfigurations.fulfilled,
            (
              state,
              action,
            ) => {
              state.loading =
                false;

              state.items =
                action.payload?.data ||
                [];

              const stillAvailable =
                state.items.some(
                  (item) =>
                    item.paymentMethodCode ===
                    state.selectedMethodCode,
                );

              if (!stillAvailable) {
                state.selectedMethodCode =
                  "";
              }
            },
          )
          .addCase(
            fetchPublicPaymentConfigurations.rejected,
            (
              state,
              action,
            ) => {
              state.loading =
                false;

              state.error =
                action.payload?.message ||
                action.payload ||
                "تعذر تحميل طرق الدفع";
            },
          );
      },
  });

export const {
  setSelectedPublicPaymentMethod,
  clearPublicPaymentConfigurations,
} =
  publicPaymentConfigurationSlice.actions;

export const selectPublicPaymentConfigurations =
  (state) =>
    state.publicPaymentConfigurations
      ?.items || [];

export const selectSelectedPublicPaymentMethodCode =
  (state) =>
    state.publicPaymentConfigurations
      ?.selectedMethodCode ||
    "";

export const selectPublicPaymentConfigurationsLoading =
  (state) =>
    Boolean(
      state.publicPaymentConfigurations
        ?.loading,
    );

export const selectPublicPaymentConfigurationsError =
  (state) =>
    state.publicPaymentConfigurations
      ?.error ||
    null;

export default publicPaymentConfigurationSlice.reducer;
