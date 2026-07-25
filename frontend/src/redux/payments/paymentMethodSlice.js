// redux/payments/paymentMethodSlice.js

import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  apiCreatePaymentMethod,
  apiDeletePaymentMethod,
  apiGetPaymentMethods,
  apiUpdatePaymentMethod,
  apiUpdatePaymentMethodStatus,
} from "../../services/api/admin/paymentMethod";

import {
  handleApiError,
} from "../../Utils/handleApiError";

/*
=====================================================
Fetch
=====================================================
*/

export const fetchPaymentMethods =
  createAsyncThunk(
    "paymentMethods/fetch",

    async (
      params,
      {
        rejectWithValue,
      },
    ) => {
      try {
        const res =
          await apiGetPaymentMethods(
            params,
          );

        return res.data;
      } catch (err) {
        return handleApiError(
          err,
          rejectWithValue,
        );
      }
    },
  );

/*
=====================================================
Create
=====================================================
*/

export const createPaymentMethod =
  createAsyncThunk(
    "paymentMethods/create",

    async (
      payload,
      {
        rejectWithValue,
      },
    ) => {
      try {
        const res =
          await apiCreatePaymentMethod(
            payload,
          );

        return res.data.data;
      } catch (err) {
        return handleApiError(
          err,
          rejectWithValue,
        );
      }
    },
  );

/*
=====================================================
Update
=====================================================
*/

export const updatePaymentMethod =
  createAsyncThunk(
    "paymentMethods/update",

    async (
      {
        id,
        data,
      },
      {
        rejectWithValue,
      },
    ) => {
      try {
        const res =
          await apiUpdatePaymentMethod(
            id,
            data,
          );

        return res.data.data;
      } catch (err) {
        return handleApiError(
          err,
          rejectWithValue,
        );
      }
    },
  );

/*
=====================================================
Status
=====================================================
*/

export const updatePaymentMethodStatus =
  createAsyncThunk(
    "paymentMethods/updateStatus",

    async (
      {
        id,
        data,
      },
      {
        rejectWithValue,
      },
    ) => {
      try {
        const res =
          await apiUpdatePaymentMethodStatus(
            id,
            data,
          );

        return res.data.data;
      } catch (err) {
        return handleApiError(
          err,
          rejectWithValue,
        );
      }
    },
  );

/*
=====================================================
Delete
=====================================================
*/

export const deletePaymentMethod =
  createAsyncThunk(
    "paymentMethods/delete",

    async (
      id,
      {
        rejectWithValue,
      },
    ) => {
      try {
        await apiDeletePaymentMethod(
          id,
        );

        return id;
      } catch (err) {
        return handleApiError(
          err,
          rejectWithValue,
        );
      }
    },
  );

/*
=====================================================
Slice
=====================================================
*/

const paymentMethodSlice =
  createSlice({
    name: "paymentMethods",

    initialState: {
      paymentMethodsList: [],

      loading: false,

      error: null,

      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    },

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

        state.pagination.page =
          1;
      },
    },

    extraReducers: (
      builder,
    ) => {
      builder

        /*
        Fetch
        */

        .addCase(
          fetchPaymentMethods.pending,
          (state) => {
            state.loading = true;
            state.error = null;
          },
        )

        .addCase(
          fetchPaymentMethods.fulfilled,
          (
            state,
            action,
          ) => {
            state.loading = false;

            state.paymentMethodsList =
              action.payload?.data ||
              [];

            state.pagination = {
              total:
                action.payload?.total ||
                0,

              page:
                action.payload?.page ||
                1,

              limit:
                action.payload?.limit ||
                10,

              totalPages:
                action.payload
                  ?.totalPages ||
                0,
            };
          },
        )

        .addCase(
          fetchPaymentMethods.rejected,
          (
            state,
            action,
          ) => {
            state.loading = false;
            state.error =
              action.payload;
          },
        )

        /*
        Create
        */

        .addCase(
          createPaymentMethod.pending,
          (state) => {
            state.loading = true;
            state.error = null;
          },
        )

        .addCase(
          createPaymentMethod.fulfilled,
          (
            state,
            action,
          ) => {
            state.loading = false;

            if (
              action.payload
            ) {
              state.paymentMethodsList.unshift(
                action.payload,
              );
            }
          },
        )

        .addCase(
          createPaymentMethod.rejected,
          (
            state,
            action,
          ) => {
            state.loading = false;
            state.error =
              action.payload;
          },
        )

        /*
        Update
        */

        .addCase(
          updatePaymentMethod.pending,
          (state) => {
            state.loading = true;
            state.error = null;
          },
        )

        .addCase(
          updatePaymentMethod.fulfilled,
          (
            state,
            action,
          ) => {
            state.loading = false;

            state.paymentMethodsList =
              state.paymentMethodsList.map(
                (item) =>
                  item._id ===
                  action.payload?._id
                    ? action.payload
                    : item,
              );
          },
        )

        .addCase(
          updatePaymentMethod.rejected,
          (
            state,
            action,
          ) => {
            state.loading = false;
            state.error =
              action.payload;
          },
        )

        /*
        Status
        */

        .addCase(
          updatePaymentMethodStatus.pending,
          (state) => {
            state.loading = true;
            state.error = null;
          },
        )

        .addCase(
          updatePaymentMethodStatus.fulfilled,
          (
            state,
            action,
          ) => {
            state.loading = false;

            state.paymentMethodsList =
              state.paymentMethodsList.map(
                (item) =>
                  item._id ===
                  action.payload?._id
                    ? action.payload
                    : item,
              );
          },
        )

        .addCase(
          updatePaymentMethodStatus.rejected,
          (
            state,
            action,
          ) => {
            state.loading = false;
            state.error =
              action.payload;
          },
        )

        /*
        Delete
        */

        .addCase(
          deletePaymentMethod.pending,
          (state) => {
            state.loading = true;
            state.error = null;
          },
        )

        .addCase(
          deletePaymentMethod.fulfilled,
          (
            state,
            action,
          ) => {
            state.loading = false;

            state.paymentMethodsList =
              state.paymentMethodsList.filter(
                (item) =>
                  item._id !==
                  action.payload,
              );
          },
        )

        .addCase(
          deletePaymentMethod.rejected,
          (
            state,
            action,
          ) => {
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
} = paymentMethodSlice.actions;

export default paymentMethodSlice.reducer;