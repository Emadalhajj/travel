import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { handleApiError } from "../../Utils/handleApiError";
import {
  apiGetExtraServices,
  apiGetOneExtraService,
  apiCreateExtraService,
  apiUpdateExtraService,
  apiDeleteExtraService,
  apiToggleExtraService,
} from "../../services/api/admin/extra-services";

export const fetchExtraServices = createAsyncThunk(
  "extraServices/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiGetExtraServices(params);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const fetchOneExtraService = createAsyncThunk(
  "extraServices/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiGetOneExtraService(id);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const createExtraService = createAsyncThunk(
  "extraServices/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiCreateExtraService(payload);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const updateExtraService = createAsyncThunk(
  "extraServices/update",
  async ({ id, data, payload }, { rejectWithValue }) => {
    try {
      const res = await apiUpdateExtraService(id, payload || data);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const deleteExtraService = createAsyncThunk(
  "extraServices/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiDeleteExtraService(id);
      return id;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const toggleExtraServiceStatus = createAsyncThunk(
  "extraServices/toggle",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await apiToggleExtraService(id, status);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

const extraServiceSlice = createSlice({
  name: "extraServices",
  initialState: {
    extraServicesList: [],
    selectedExtraService: null,
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
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    clearSelectedExtraService: (state) => {
      state.selectedExtraService = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExtraServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExtraServices.fulfilled, (state, action) => {
        state.loading = false;
        state.extraServicesList = action.payload.data || [];
        state.pagination = {
          total: action.payload.total || 0,
          page: action.payload.page || 1,
          limit: action.payload.limit || 10,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchExtraServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchOneExtraService.fulfilled, (state, action) => {
        state.selectedExtraService = action.payload;
      })

      .addCase(createExtraService.fulfilled, (state, action) => {
        state.extraServicesList.unshift(action.payload);
      })

      .addCase(updateExtraService.fulfilled, (state, action) => {
        state.extraServicesList = state.extraServicesList.map((item) =>
          item._id === action.payload._id ? action.payload : item,
        );
      })

      .addCase(deleteExtraService.fulfilled, (state, action) => {
        state.extraServicesList = state.extraServicesList.filter(
          (item) => item._id !== action.payload,
        );
      })
      .addCase(toggleExtraServiceStatus.fulfilled, (state, action) => {
        state.extraServicesList = state.extraServicesList.map((item) =>
          item._id === action.payload._id ? action.payload : item,
        );
      });
  },
});

export const { setPage, setLimit, clearSelectedExtraService } =
  extraServiceSlice.actions;

export default extraServiceSlice.reducer;
