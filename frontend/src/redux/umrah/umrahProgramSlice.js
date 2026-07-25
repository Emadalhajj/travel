import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  apiGetUmrahPrograms,
  apiGetOneUmrahProgram,
  apiCreateUmrahProgram,
  apiUpdateUmrahProgram,
  apiDeleteUmrahProgram,
  apiToggleUmrahProgram,
  apiGetPublicUmrahPrograms,
  apiGetPublicUmrahProgramDetails,
} from "../../services/api/admin/umrahPrograms";

import { handleApiError } from "../../Utils/handleApiError";

const getProgramsFromResponse = (payload) =>
  payload?.data || payload?.items || [];

const getTotalPagesFromResponse = (payload) =>
  payload?.totalPages || payload?.pages || 0;

export const fetchUmrahPrograms = createAsyncThunk(
  "umrahPrograms/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiGetUmrahPrograms(params);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const fetchOneUmrahProgram = createAsyncThunk(
  "umrahPrograms/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiGetOneUmrahProgram(id);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const createUmrahProgram = createAsyncThunk(
  "umrahPrograms/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiCreateUmrahProgram(payload);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const updateUmrahProgram = createAsyncThunk(
  "umrahPrograms/update",
  async ({ id, data, payload }, { rejectWithValue }) => {
    try {
      const res = await apiUpdateUmrahProgram(id, payload || data);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const deleteUmrahProgram = createAsyncThunk(
  "umrahPrograms/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiDeleteUmrahProgram(id);
      return id;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const toggleUmrahProgramStatus = createAsyncThunk(
  "umrahPrograms/toggle",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await apiToggleUmrahProgram(id, status);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const fetchPublicUmrahPrograms = createAsyncThunk(
  "umrahPrograms/fetchPublic",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiGetPublicUmrahPrograms(params);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const fetchPublicUmrahProgramDetails = createAsyncThunk(
  "umrahPrograms/fetchPublicDetails",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiGetPublicUmrahProgramDetails(id);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

const initialState = {
  umrahProgramsList: [],
  publicUmrahProgramsList: [],
  selectedUmrahProgram: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

const umrahProgramSlice = createSlice({
  name: "umrahPrograms",
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    clearSelectedUmrahProgram: (state) => {
      state.selectedUmrahProgram = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUmrahPrograms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUmrahPrograms.fulfilled, (state, action) => {
        state.loading = false;
        state.umrahProgramsList = getProgramsFromResponse(action.payload);

        state.pagination = {
          total: action.payload.total || 0,
          page: action.payload.page || 1,
          limit: action.payload.limit || 10,
          totalPages: getTotalPagesFromResponse(action.payload),
        };
      })
      .addCase(fetchUmrahPrograms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchOneUmrahProgram.fulfilled, (state, action) => {
        state.selectedUmrahProgram = action.payload;
      })

      .addCase(createUmrahProgram.fulfilled, (state, action) => {
        state.umrahProgramsList.unshift(action.payload);
      })

      .addCase(updateUmrahProgram.fulfilled, (state, action) => {
        state.umrahProgramsList = state.umrahProgramsList.map((item) =>
          item._id === action.payload._id ? action.payload : item,
        );
      })

      .addCase(deleteUmrahProgram.fulfilled, (state, action) => {
        state.umrahProgramsList = state.umrahProgramsList.filter(
          (item) => item._id !== action.payload,
        );
      })

      .addCase(toggleUmrahProgramStatus.fulfilled, (state, action) => {
        state.umrahProgramsList = state.umrahProgramsList.map((item) =>
          item._id === action.payload._id ? action.payload : item,
        );
      })

      .addCase(fetchPublicUmrahPrograms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPublicUmrahPrograms.fulfilled, (state, action) => {
        state.loading = false;
        state.publicUmrahProgramsList = getProgramsFromResponse(action.payload);
      })
      .addCase(fetchPublicUmrahPrograms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchPublicUmrahProgramDetails.fulfilled, (state, action) => {
        state.selectedUmrahProgram = action.payload;
      });
  },
});

export const { setPage, setLimit, clearSelectedUmrahProgram } =
  umrahProgramSlice.actions;

export default umrahProgramSlice.reducer;
