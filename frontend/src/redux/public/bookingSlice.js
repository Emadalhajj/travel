import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  apiCreateDraftBooking,
  apiUpdateDraftBooking,
  apiGetDraftBookingById,
  apiCancelDraftBooking,
  apiCompleteDraftBooking,
  apiGetBookingById,
  apiGetMyBookings,
  apiGetMyDraftBookings,
} from "../../services/api/public/bookingApi";

/*
=========================================================
Public Booking Slice
=========================================================

هذا Slice مسؤول عن رحلة حجز العميل.

المنطق:
1- اختيار برنامج
2- إدخال بيانات المسافرين
3- إنشاء Draft Booking
4- لاحقًا Payment Authorization
5- لاحقًا Capture بعد تنفيذ الطلب

ملاحظة:
لا يتم إنشاء Booking نهائي من الواجهة العامة مباشرة.
=========================================================
*/

// إنشاء Draft Booking

export const createPublicDraftBooking = createAsyncThunk(
  "publicBooking/createPublicDraftBooking",
  async (data, { rejectWithValue }) => {
    try {
      return await apiCreateDraftBooking(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "حدث خطأ أثناء إنشاء المسودة",
      );
    }
  },
);

export const updatePublicDraftBooking = createAsyncThunk(
  "publicBooking/updatePublicDraftBooking",
  async ({ draftId, data }, { rejectWithValue }) => {
    try {
      return await apiUpdateDraftBooking(draftId, data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "حدث خطأ أثناء تحديث المسودة",
      );
    }
  },
);

export const fetchPublicDraftBookingById = createAsyncThunk(
  "publicBooking/fetchPublicDraftBookingById",
  async (draftId, { rejectWithValue }) => {
    try {
      return await apiGetDraftBookingById(draftId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "حدث خطأ أثناء جلب المسودة",
      );
    }
  },
);

export const fetchPublicBookingById = createAsyncThunk(
  "publicBooking/fetchPublicBookingById",
  async (bookingId, { rejectWithValue }) => {
    try {
      return await apiGetBookingById(bookingId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "حدث خطأ أثناء جلب الحجز",
      );
    }
  },
);

export const fetchPublicMyBookings = createAsyncThunk(
  "publicBooking/fetchPublicMyBookings",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await apiGetMyBookings(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "حدث خطأ أثناء جلب حجوزاتك"
      );
    }
  }
);

export const fetchPublicMyDraftBookings = createAsyncThunk(
  "publicBooking/fetchPublicMyDraftBookings",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await apiGetMyDraftBookings(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "حدث خطأ أثناء جلب مسودات الحجز"
      );
    }
  }
);

export const cancelPublicDraftBooking = createAsyncThunk(
  "publicBooking/cancelDraft",
  async (payload, { rejectWithValue }) => {
    try {
      const draftId =
        typeof payload === "string"
          ? payload
          : payload?.draftId;

      if (!draftId) {
        throw new Error("معرف المسودة مطلوب");
      }

      return await apiCancelDraftBooking(draftId);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "حدث خطأ أثناء إلغاء المسودة",
      );
    }
  },
);

export const completePublicDraftBooking = createAsyncThunk(
  "publicBooking/completePublicDraftBooking",
  async (draftId, { rejectWithValue }) => {
    try {
      return await apiCompleteDraftBooking(draftId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "حدث خطأ أثناء تحويل المسودة إلى حجز",
      );
    }
  },
);

const initialState = {
  draftBooking: null,

  currentStep: "customer_info",

  customer: {
    name: "",
    email: "",
    phone: "",
    nationality: "",
    
  },
  finalBooking: null,
  myBookings: [],
  myDraftBookings: [],
  
draftPagination: null,
  pagination: null,
  travelers: [],
  loading: false,
  submitLoading: false,
  error: null,
  success: false,
};

const publicBookingSlice = createSlice({
  name: "publicBooking",
  initialState,
  reducers: {
    setCustomer: (state, action) => {
      state.customer = { ...state.customer, ...action.payload };
    },
    setTravelers: (state, action) => {
      state.travelers = action.payload;
    },
    resetPublicBooking: () => initialState,
    clearPublicBookingError: (state) => {
      state.error = null;
    },
    setCurrentStep: (state, action) => {
  state.currentStep = action.payload;
},
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPublicDraftBooking.pending, (state) => {
        state.submitLoading = true;
        state.error = null;
      })
      .addCase(createPublicDraftBooking.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.success = true;
        state.draftBooking = action.payload?.data || action.payload;
      })
      .addCase(createPublicDraftBooking.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
      })

      .addCase(updatePublicDraftBooking.pending, (state) => {
        state.submitLoading = true;
        state.error = null;
      })
      .addCase(updatePublicDraftBooking.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.draftBooking = action.payload?.data || action.payload;
      })
      .addCase(updatePublicDraftBooking.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchPublicDraftBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicDraftBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.draftBooking = action.payload?.data || action.payload;
      })
      .addCase(fetchPublicDraftBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchPublicBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.finalBooking = action.payload?.data || action.payload;
      })
      .addCase(fetchPublicBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPublicMyBookings.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(fetchPublicMyBookings.fulfilled, (state, action) => {
  state.loading = false;

  state.myBookings =
    action.payload?.data ||
    action.payload?.items ||
    [];

  state.pagination = {
    total: action.payload?.total || 0,
    page: action.payload?.page || 1,
    pages: action.payload?.pages || 1,
    limit: action.payload?.limit || 10,
  };
})
.addCase(fetchPublicMyBookings.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})
.addCase(fetchPublicMyDraftBookings.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(fetchPublicMyDraftBookings.fulfilled, (state, action) => {
  state.loading = false;

  state.myDraftBookings =
    action.payload?.data ||
    action.payload?.items ||
    [];

  state.draftPagination = {
    total: action.payload?.total || 0,
    page: action.payload?.page || 1,
    pages: action.payload?.pages || 1,
    limit: action.payload?.limit || 10,
  };
})
// 
.addCase(fetchPublicMyDraftBookings.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})
.addCase(cancelPublicDraftBooking.pending, (state) => {
  state.submitLoading = true;
  state.error = null;
})
.addCase(cancelPublicDraftBooking.fulfilled, (state, action) => {
  state.submitLoading = false;
  state.draftBooking = action.payload?.data || action.payload;
})
.addCase(cancelPublicDraftBooking.rejected, (state, action) => {
  state.submitLoading = false;
  state.error = action.payload;
})

.addCase(completePublicDraftBooking.pending, (state) => {
  state.submitLoading = true;
  state.error = null;
})
.addCase(completePublicDraftBooking.fulfilled, (state, action) => {
  state.submitLoading = false;
  state.success = true;

  const payload = action.payload?.data || action.payload;

  state.draftBooking = payload?.draft || payload;
  state.finalBooking = payload?.booking || payload?.finalBooking || null;
})
.addCase(completePublicDraftBooking.rejected, (state, action) => {
  state.submitLoading = false;
  state.error = action.payload;
})
  },
});

export const {
  setCustomer,
  setTravelers,
    setCurrentStep,
  resetPublicBooking,
  clearPublicBookingError,
} = publicBookingSlice.actions;

export default publicBookingSlice.reducer;
