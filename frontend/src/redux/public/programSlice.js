import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  apiGetPublicPrograms,
  apiGetPublicProgramById,
} from "../../services/api/public/programApi";

/*
=========================================================
Public Program Slice
=========================================================

هذا Slice مسؤول عن برامج العمرة المعروضة للعميل.

يستخدم في:
- صفحة عرض البرامج العامة
- صفحة تفاصيل البرنامج
- بداية رحلة الحجز
=========================================================
*/

// جلب البرامج العامة
export const fetchPublicPrograms = createAsyncThunk(
  "publicPrograms/fetchPublicPrograms",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await apiGetPublicPrograms(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "حدث خطأ أثناء جلب البرامج"
      );
    }
  }
);

// جلب تفاصيل برنامج واحد
export const fetchPublicProgramById = createAsyncThunk(
  "publicPrograms/fetchPublicProgramById",
  async (programId, { rejectWithValue }) => {
    try {
      return await apiGetPublicProgramById(programId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "حدث خطأ أثناء جلب تفاصيل البرنامج"
      );
    }
  }
);

const initialState = {
  programs: [],
  selectedProgram: null,

  pagination: null,

  loading: false,
  detailsLoading: false,

  error: null,
};

const getProgramsFromResponse = (payload) =>
  payload?.data || payload?.items || payload?.programs || [];

const getPaginationFromResponse = (payload) =>
  payload?.pagination ||
  payload?.meta || {
    total: payload?.total || 0,
    page: payload?.page || 1,
    pages: payload?.pages || 1,
    limit: payload?.limit || 10,
  };

const publicProgramSlice = createSlice({
  name: "publicPrograms",
  initialState,
  reducers: {
    clearSelectedProgram: (state) => {
      state.selectedProgram = null;
    },

    clearPublicProgramError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // ================================
      // Fetch Public Programs
      // ================================
      .addCase(fetchPublicPrograms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicPrograms.fulfilled, (state, action) => {
        state.loading = false;

        state.programs = getProgramsFromResponse(action.payload);

        state.pagination = getPaginationFromResponse(action.payload);
      })
      .addCase(fetchPublicPrograms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================================
      // Fetch Public Program Details
      // ================================
      .addCase(fetchPublicProgramById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicProgramById.fulfilled, (state, action) => {
        state.detailsLoading = false;

        state.selectedProgram =
          action.payload?.data ||
          action.payload?.program ||
          action.payload;
      })
      .addCase(fetchPublicProgramById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearSelectedProgram,
  clearPublicProgramError,
} = publicProgramSlice.actions;

export default publicProgramSlice.reducer;
