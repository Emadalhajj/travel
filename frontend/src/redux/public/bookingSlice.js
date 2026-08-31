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
import { createEmptyPagination, normalizePagination } from "../utils/pagination";
import { handleApiError } from "../../Utils/handleApiError";

const rejectBookingError = (error, rejectWithValue, fallbackMessage, options = {}) =>
  handleApiError(error, rejectWithValue, "ar", {
    fallbackMessage,
    ...options,
  });

const DRAFT_CACHE_TTL = 60 * 1000;

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
      return rejectBookingError(error, rejectWithValue, "حدث خطأ أثناء إنشاء المسودة");
    }
  },
);

export const updatePublicDraftBooking = createAsyncThunk(
  "publicBooking/updatePublicDraftBooking",
  async ({ draftId, data }, { rejectWithValue }) => {
    try {
      return await apiUpdateDraftBooking(draftId, data);
    } catch (error) {
      return rejectBookingError(error, rejectWithValue, "حدث خطأ أثناء تحديث المسودة");
    }
  },
);

export const fetchPublicDraftBookingById = createAsyncThunk(
  "publicBooking/fetchPublicDraftBookingById",
  async (draftId, { rejectWithValue }) => {
    try {
      return await apiGetDraftBookingById(draftId);
    } catch (error) {
      return rejectBookingError(error, rejectWithValue, "حدث خطأ أثناء جلب المسودة");
    }
  },
);

export const fetchPublicBookingById = createAsyncThunk(
  "publicBooking/fetchPublicBookingById",
  async (bookingId, { rejectWithValue }) => {
    try {
      return await apiGetBookingById(bookingId);
    } catch (error) {
      return rejectBookingError(error, rejectWithValue, "حدث خطأ أثناء جلب الحجز");
    }
  },
);

export const fetchPublicMyBookings = createAsyncThunk(
  "publicBooking/fetchPublicMyBookings",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await apiGetMyBookings(params);
    } catch (error) {
      return rejectBookingError(error, rejectWithValue, "حدث خطأ أثناء جلب حجوزاتك");
    }
  }
);

export const fetchPublicMyDraftBookings = createAsyncThunk(
  "publicBooking/fetchPublicMyDraftBookings",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await apiGetMyDraftBookings(params);
    } catch (error) {
      return rejectBookingError(error, rejectWithValue, "حدث خطأ أثناء جلب مسودات الحجز");
    }
  }
);

export const ensurePublicDraftBooking =
  (draftId, { force = false } = {}) =>
  (dispatch, getState) => {
    const {
      draftBooking,
      draftLoadedAt,
      draftLoading,
    } = getState().publicBooking;
    const sameDraft =
      String(draftBooking?._id || "") === String(draftId || "");
    const fresh =
      Number(draftLoadedAt) > 0 &&
      Date.now() - draftLoadedAt < DRAFT_CACHE_TTL;

    if (!force && sameDraft && fresh) {
      return Promise.resolve({ cached: true, data: draftBooking });
    }

    if (draftLoading && sameDraft) {
      return Promise.resolve({ skipped: true });
    }

    return dispatch(fetchPublicDraftBookingById(draftId));
  };

export const fetchPublicPendingBookingReviews = createAsyncThunk(
  "publicBooking/fetchPendingBookingReviews",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await apiGetMyDraftBookings({
        ...params,
        status: "pending_review",
      });
    } catch (error) {
      return rejectBookingError(error, rejectWithValue, "تعذر جلب الحجوزات قيد المراجعة");
    }
  },
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
      return rejectBookingError(error, rejectWithValue, "حدث خطأ أثناء إلغاء المسودة", {
        preferErrorMessage: true,
      });
    }
  },
);

export const completePublicDraftBooking = createAsyncThunk(
  "publicBooking/completePublicDraftBooking",
  async (draftId, { rejectWithValue }) => {
    try {
      return await apiCompleteDraftBooking(draftId);
    } catch (error) {
      return rejectBookingError(
        error,
        rejectWithValue,
        "حدث خطأ أثناء تحويل المسودة إلى حجز",
      );
    }
  },
);

const initialState = {
  draftBooking: null,
  draftLoadedAt: null,
  finalBooking: null,
  myBookings: [],
  myDraftBookings: [],
  pendingBookingReviews: [],
  pendingReviewsLoading: false,
  pendingReviewsError: null,
  draftPagination: createEmptyPagination(),
  pagination: createEmptyPagination(),
  draftLoading: false,
  draftError: null,
  bookingDetailsLoading: false,
  bookingDetailsError: null,
  bookingsListLoading: false,
  bookingsListError: null,
  draftsListLoading: false,
  draftsListError: null,
  submitLoading: false,
  submitError: null,
};

const publicBookingSlice = createSlice({
  name: "publicBooking",
  initialState,
  reducers: {
    resetPublicBooking: () => initialState,
    clearPublicBookingError: (state) => {
      state.draftError = null;
      state.bookingDetailsError = null;
      state.bookingsListError = null;
      state.draftsListError = null;
      state.submitError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPublicDraftBooking.pending, (state) => {
        state.submitLoading = true;
        state.submitError = null;
      })
      .addCase(createPublicDraftBooking.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.draftBooking = action.payload?.data || action.payload;
        state.draftLoadedAt = Date.now();
      })
      .addCase(createPublicDraftBooking.rejected, (state, action) => {
        state.submitLoading = false;
        state.submitError = action.payload;
      })

      .addCase(updatePublicDraftBooking.pending, (state) => {
        state.submitLoading = true;
        state.submitError = null;
      })
      .addCase(updatePublicDraftBooking.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.draftBooking = action.payload?.data || action.payload;
        state.draftLoadedAt = Date.now();
      })
      .addCase(updatePublicDraftBooking.rejected, (state, action) => {
        state.submitLoading = false;
        state.submitError = action.payload;
      })

      .addCase(fetchPublicDraftBookingById.pending, (state) => {
        state.draftLoading = true;
        state.draftError = null;
      })
      .addCase(fetchPublicDraftBookingById.fulfilled, (state, action) => {
        state.draftLoading = false;
        state.draftBooking = action.payload?.data || action.payload;
        state.draftLoadedAt = Date.now();
      })
      .addCase(fetchPublicDraftBookingById.rejected, (state, action) => {
        state.draftLoading = false;
        state.draftError = action.payload;
      })

      .addCase(fetchPublicBookingById.pending, (state) => {
        state.bookingDetailsLoading = true;
        state.bookingDetailsError = null;
      })
      .addCase(fetchPublicBookingById.fulfilled, (state, action) => {
        state.bookingDetailsLoading = false;
        state.finalBooking = action.payload?.data || action.payload;
      })
      .addCase(fetchPublicBookingById.rejected, (state, action) => {
        state.bookingDetailsLoading = false;
        state.bookingDetailsError = action.payload;
      })
.addCase(fetchPublicMyBookings.pending, (state) => {
  state.bookingsListLoading = true;
  state.bookingsListError = null;
})
.addCase(fetchPublicMyBookings.fulfilled, (state, action) => {
  state.bookingsListLoading = false;

  state.myBookings =
    action.payload?.data ||
    action.payload?.items ||
    [];

  state.pagination = normalizePagination(action.payload, state.pagination);
})
.addCase(fetchPublicMyBookings.rejected, (state, action) => {
  state.bookingsListLoading = false;
  state.bookingsListError = action.payload;
})
.addCase(fetchPublicMyDraftBookings.pending, (state) => {
  state.draftsListLoading = true;
  state.draftsListError = null;
})
.addCase(fetchPublicMyDraftBookings.fulfilled, (state, action) => {
  state.draftsListLoading = false;

  state.myDraftBookings =
    action.payload?.data ||
    action.payload?.items ||
    [];

  state.draftPagination = normalizePagination(action.payload, state.draftPagination);
})
// 
.addCase(fetchPublicMyDraftBookings.rejected, (state, action) => {
  state.draftsListLoading = false;
  state.draftsListError = action.payload;
})
.addCase(fetchPublicPendingBookingReviews.pending, (state) => {
  state.pendingReviewsLoading = true;
  state.pendingReviewsError = null;
})
.addCase(fetchPublicPendingBookingReviews.fulfilled, (state, action) => {
  state.pendingReviewsLoading = false;
  state.pendingBookingReviews =
    action.payload?.data || action.payload?.items || [];
})
.addCase(fetchPublicPendingBookingReviews.rejected, (state, action) => {
  state.pendingReviewsLoading = false;
  state.pendingReviewsError = action.payload;
})
.addCase(cancelPublicDraftBooking.pending, (state) => {
  state.submitLoading = true;
  state.submitError = null;
})
.addCase(cancelPublicDraftBooking.fulfilled, (state, action) => {
  state.submitLoading = false;
  state.draftBooking = action.payload?.data || action.payload;
  state.draftLoadedAt = Date.now();
})
.addCase(cancelPublicDraftBooking.rejected, (state, action) => {
  state.submitLoading = false;
  state.submitError = action.payload;
})

.addCase(completePublicDraftBooking.pending, (state) => {
  state.submitLoading = true;
  state.submitError = null;
})
.addCase(completePublicDraftBooking.fulfilled, (state, action) => {
  state.submitLoading = false;

  const payload = action.payload?.data || action.payload;

  state.draftBooking = payload?.draft || payload;
  state.draftLoadedAt = Date.now();
  state.finalBooking = payload?.booking || payload?.finalBooking || null;
})
.addCase(completePublicDraftBooking.rejected, (state, action) => {
  state.submitLoading = false;
  state.submitError = action.payload;
})
  },
});

export const {
  resetPublicBooking,
  clearPublicBookingError,
} = publicBookingSlice.actions;

export const selectPublicDraftBooking = (state) => state.publicBooking.draftBooking;
export const selectPublicDraftLoading = (state) => state.publicBooking.draftLoading;
export const selectPublicDraftError = (state) => state.publicBooking.draftError;
export const selectPublicFinalBooking = (state) => state.publicBooking.finalBooking;
export const selectPublicBookingDetailsLoading = (state) => state.publicBooking.bookingDetailsLoading;
export const selectPublicBookingDetailsError = (state) => state.publicBooking.bookingDetailsError;
export const selectPublicMyBookings = (state) => state.publicBooking.myBookings;
export const selectPublicBookingsPagination = (state) => state.publicBooking.pagination;
export const selectPublicBookingsListLoading = (state) => state.publicBooking.bookingsListLoading;
export const selectPublicBookingsListError = (state) => state.publicBooking.bookingsListError;
export const selectPublicMyDraftBookings = (state) => state.publicBooking.myDraftBookings;
export const selectPublicDraftsPagination = (state) => state.publicBooking.draftPagination;
export const selectPublicDraftsListLoading = (state) => state.publicBooking.draftsListLoading;
export const selectPublicDraftsListError = (state) => state.publicBooking.draftsListError;
export const selectPublicBookingSubmitLoading = (state) => state.publicBooking.submitLoading;
export const selectPublicBookingSubmitError = (state) => state.publicBooking.submitError;
export const selectPublicPendingBookingReviews = (state) => state.publicBooking.pendingBookingReviews;
export const selectPublicPendingReviewsLoading = (state) => state.publicBooking.pendingReviewsLoading;
export const selectPublicPendingReviewsError = (state) => state.publicBooking.pendingReviewsError;

export default publicBookingSlice.reducer;
