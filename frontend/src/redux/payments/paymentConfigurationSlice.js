/*
=====================================================
Payment Configuration Slice
=====================================================

يدير:
-----------------------------------------------------
- قائمة إعدادات الدفع
- إعداد واحد
- الإنشاء
- التعديل
- تحديث الحالة
- الحذف
- Loading
- Error
- Pagination
=====================================================
*/

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  apiGetPaymentConfigurations,
  apiGetPaymentConfigurationById,
  apiCreatePaymentConfiguration,
  apiUpdatePaymentConfiguration,
  apiUpdatePaymentConfigurationStatus,
  apiDeletePaymentConfiguration,
} from "../../services/api/admin/paymentConfiguration";

import {
  handleApiError,
} from "../../Utils/handleApiError";

/*
=====================================================
Initial State
=====================================================
*/

const initialState = {
  items: [],

  selectedItem: null,

  pagination: {
    page: 1,

    limit: 10,

    total: 0,

    totalPages: 0,

    hasNextPage: false,

    hasPreviousPage: false,
  },

  loading: false,

  actionLoading: false,

  error: null,

  fieldErrors: {},

  successMessage: null,
};

/*
=====================================================
Fetch Payment Configurations
=====================================================
*/

export const fetchPaymentConfigurations = createAsyncThunk(
  "paymentConfigurations/fetchAll",

  async (params = {}, { rejectWithValue }) => {
    try {
      return await apiGetPaymentConfigurations(params);
    } catch (error) {
      return handleApiError(
        error,
        rejectWithValue,
        "ar",
        {
          structured: true,
        },
      );
    }
  },
);

/*
=====================================================
Fetch Payment Configuration By ID
=====================================================
*/

export const fetchPaymentConfigurationById = createAsyncThunk(
  "paymentConfigurations/fetchById",

  async (configurationId, { rejectWithValue }) => {
    try {
      return await apiGetPaymentConfigurationById(configurationId);
    } catch (error) {
      return handleApiError(
        error,
        rejectWithValue,
        "ar",
        {
          structured: true,
        },
      );
    }
  },
);

/*
=====================================================
Create Payment Configuration
=====================================================
*/

export const createPaymentConfiguration = createAsyncThunk(
  "paymentConfigurations/create",

  async (payload, { rejectWithValue }) => {
    try {
      return await apiCreatePaymentConfiguration(payload);
    } catch (error) {
      return handleApiError(
        error,
        rejectWithValue,
        "ar",
        {
          structured: true,
        },
      );
    }
  },
);

/*
=====================================================
Update Payment Configuration
=====================================================
*/

export const updatePaymentConfiguration = createAsyncThunk(
  "paymentConfigurations/update",

  async ({ configurationId, payload }, { rejectWithValue }) => {
    try {
      return await apiUpdatePaymentConfiguration({
        configurationId,

        payload,
      });
    } catch (error) {
      return handleApiError(
        error,
        rejectWithValue,
        "ar",
        {
          structured: true,
        },
      );
    }
  },
);

/*
=====================================================
Update Payment Configuration Status
=====================================================
*/

export const updatePaymentConfigurationStatus = createAsyncThunk(
  "paymentConfigurations/updateStatus",

  async ({ configurationId, isActive }, { rejectWithValue }) => {
    try {
      return await apiUpdatePaymentConfigurationStatus({
        configurationId,

        isActive,
      });
    } catch (error) {
      return handleApiError(
        error,
        rejectWithValue,
        "ar",
        {
          structured: true,
        },
      );
    }
  },
);

/*
=====================================================
Delete Payment Configuration
=====================================================
*/

export const deletePaymentConfiguration = createAsyncThunk(
  "paymentConfigurations/delete",

  async (configurationId, { rejectWithValue }) => {
    try {
      const response = await apiDeletePaymentConfiguration(configurationId);

      return {
        configurationId,

        response,
      };
    } catch (error) {
      return handleApiError(
        error,
        rejectWithValue,
        "ar",
        {
          structured: true,
        },
      );
    }
  },
);

/*
=====================================================
Helper: Extract Error State
=====================================================

يدعم أكثر من شكل محتمل لـhandleApiError.

مثال:
-----------------------------------------------------
{
  message,
  errors
}

أو:
{
  error,
  fieldErrors
}
=====================================================
*/

const getErrorState = (payload) => {
  if (typeof payload === "string") {
    return {
      message: payload,

      fieldErrors: {},
    };
  }

  return {
    message: payload?.message || payload?.error || "حدث خطأ غير متوقع",

    fieldErrors: payload?.errors || payload?.fieldErrors || {},
  };
};

/*
=====================================================
Helper: Replace Item
=====================================================
*/

const replaceItemById = (items, updatedItem) =>
  items.map((item) =>
    String(item._id) === String(updatedItem._id) ? updatedItem : item,
  );

/*
=====================================================
Slice
=====================================================
*/

const paymentConfigurationSlice = createSlice({
  name: "paymentConfigurations",

  initialState,

  reducers: {
    /*
      ===============================================
      Clear Error
      ===============================================
      */

    clearPaymentConfigurationError: (state) => {
      state.error = null;

      state.fieldErrors = {};
    },

    /*
      ===============================================
      Clear Success
      ===============================================
      */

    clearPaymentConfigurationSuccess: (state) => {
      state.successMessage = null;
    },

    /*
      ===============================================
      Clear Selected Item
      ===============================================
      */

    clearSelectedPaymentConfiguration: (state) => {
      state.selectedItem = null;
    },

    /*
      ===============================================
      Set Selected Item
      ===============================================

      مفيد عند فتح View/Edit/Clone مباشرة من الجدول
      دون طلب API جديد.
      */

    setSelectedPaymentConfiguration: (state, action) => {
      state.selectedItem = action.payload;
    },

    /*
      ===============================================
      Reset Slice
      ===============================================
      */

    resetPaymentConfigurationState: () => initialState,
  },

  extraReducers: (builder) => {
    /*
        =============================================
        Fetch All
        =============================================
        */

    builder
      .addCase(fetchPaymentConfigurations.pending, (state) => {
        state.loading = true;

        state.error = null;

        state.fieldErrors = {};
      })
      .addCase(fetchPaymentConfigurations.fulfilled, (state, action) => {
        state.loading = false;

        state.items = action.payload?.data || [];

        state.pagination =
          action.payload?.pagination || initialState.pagination;
      })
      .addCase(fetchPaymentConfigurations.rejected, (state, action) => {
        const errorState = getErrorState(action.payload);

        state.loading = false;

        state.error = errorState.message;

        state.fieldErrors = errorState.fieldErrors;
      });

    /*
        =============================================
        Fetch By ID
        =============================================
        */

    builder
      .addCase(fetchPaymentConfigurationById.pending, (state) => {
        state.actionLoading = true;

        state.error = null;

        state.fieldErrors = {};
      })
      .addCase(fetchPaymentConfigurationById.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.selectedItem = action.payload?.data || null;
      })
      .addCase(fetchPaymentConfigurationById.rejected, (state, action) => {
        const errorState = getErrorState(action.payload);

        state.actionLoading = false;

        state.error = errorState.message;

        state.fieldErrors = errorState.fieldErrors;
      });

    /*
        =============================================
        Create
        =============================================
        */

    builder
      .addCase(createPaymentConfiguration.pending, (state) => {
        state.actionLoading = true;

        state.error = null;

        state.fieldErrors = {};

        state.successMessage = null;
      })
      .addCase(createPaymentConfiguration.fulfilled, (state, action) => {
        const createdItem = action.payload?.data;

        state.actionLoading = false;

        state.successMessage =
          action.payload?.message || "تم إنشاء إعداد الدفع بنجاح";

        if (createdItem) {
          state.items = [createdItem, ...state.items];

          state.selectedItem = createdItem;

          state.pagination.total += 1;
        }
      })
      .addCase(createPaymentConfiguration.rejected, (state, action) => {
        const errorState = getErrorState(action.payload);

        state.actionLoading = false;

        state.error = errorState.message;

        state.fieldErrors = errorState.fieldErrors;
      });

    /*
        =============================================
        Update
        =============================================
        */

    builder
      .addCase(updatePaymentConfiguration.pending, (state) => {
        state.actionLoading = true;

        state.error = null;

        state.fieldErrors = {};

        state.successMessage = null;
      })
      .addCase(updatePaymentConfiguration.fulfilled, (state, action) => {
        const updatedItem = action.payload?.data;

        state.actionLoading = false;

        state.successMessage =
          action.payload?.message || "تم تحديث إعداد الدفع بنجاح";

        if (updatedItem) {
          state.items = replaceItemById(
            state.items,

            updatedItem,
          );

          state.selectedItem = updatedItem;
        }
      })
      .addCase(updatePaymentConfiguration.rejected, (state, action) => {
        const errorState = getErrorState(action.payload);

        state.actionLoading = false;

        state.error = errorState.message;

        state.fieldErrors = errorState.fieldErrors;
      });

    /*
        =============================================
        Update Status
        =============================================
        */

    builder
      .addCase(updatePaymentConfigurationStatus.pending, (state) => {
        state.actionLoading = true;

        state.error = null;

        state.fieldErrors = {};

        state.successMessage = null;
      })
      .addCase(updatePaymentConfigurationStatus.fulfilled, (state, action) => {
        const updatedItem = action.payload?.data;

        state.actionLoading = false;

        state.successMessage =
          action.payload?.message || "تم تحديث حالة إعداد الدفع بنجاح";

        if (updatedItem) {
          state.items = replaceItemById(
            state.items,

            updatedItem,
          );

          if (
            state.selectedItem &&
            String(state.selectedItem._id) === String(updatedItem._id)
          ) {
            state.selectedItem = updatedItem;
          }
        }
      })
      .addCase(updatePaymentConfigurationStatus.rejected, (state, action) => {
        const errorState = getErrorState(action.payload);

        state.actionLoading = false;

        state.error = errorState.message;

        state.fieldErrors = errorState.fieldErrors;
      });

    /*
        =============================================
        Delete
        =============================================
        */

    builder
      .addCase(deletePaymentConfiguration.pending, (state) => {
        state.actionLoading = true;

        state.error = null;

        state.fieldErrors = {};

        state.successMessage = null;
      })
      .addCase(deletePaymentConfiguration.fulfilled, (state, action) => {
        const { configurationId, response } = action.payload;

        state.actionLoading = false;

        state.successMessage = response?.message || "تم حذف إعداد الدفع بنجاح";

        state.items = state.items.filter(
          (item) => String(item._id) !== String(configurationId),
        );

        if (
          state.selectedItem &&
          String(state.selectedItem._id) === String(configurationId)
        ) {
          state.selectedItem = null;
        }

        state.pagination.total = Math.max(state.pagination.total - 1, 0);
      })
      .addCase(deletePaymentConfiguration.rejected, (state, action) => {
        const errorState = getErrorState(action.payload);

        state.actionLoading = false;

        state.error = errorState.message;

        state.fieldErrors = errorState.fieldErrors;
      });
  },
});

/*
=====================================================
Actions
=====================================================
*/

export const {
  clearPaymentConfigurationError,

  clearPaymentConfigurationSuccess,

  clearSelectedPaymentConfiguration,

  setSelectedPaymentConfiguration,

  resetPaymentConfigurationState,
} = paymentConfigurationSlice.actions;

/*
=====================================================
Selectors
=====================================================
*/

export const selectPaymentConfigurations = (state) =>
  state.paymentConfigurations?.items || [];

export const selectPaymentConfigurationPagination = (state) =>
  state.paymentConfigurations?.pagination || initialState.pagination;

export const selectSelectedPaymentConfiguration = (state) =>
  state.paymentConfigurations?.selectedItem || null;

export const selectPaymentConfigurationLoading = (state) =>
  Boolean(state.paymentConfigurations?.loading);

export const selectPaymentConfigurationActionLoading = (state) =>
  Boolean(state.paymentConfigurations?.actionLoading);

export const selectPaymentConfigurationError = (state) =>
  state.paymentConfigurations?.error || null;

export const selectPaymentConfigurationFieldErrors = (state) =>
  state.paymentConfigurations?.fieldErrors || {};

export const selectPaymentConfigurationSuccess = (state) =>
  state.paymentConfigurations?.successMessage || null;

export default paymentConfigurationSlice.reducer;
