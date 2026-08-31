import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  apiGetVisaTypes,
  apiCreateVisaType,
  apiUpdateVisaType,
  apiDeleteVisaType,
} from "../../services/api/admin/visas";
import { handleApiError } from "../../Utils/handleApiError";

const VISA_TYPES_TTL = 5 * 60 * 1000;

// 🟢 جلب جميع أنواع التأشيرات
export const fetchVisaTypes = createAsyncThunk(
  "visaTypes/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiGetVisaTypes();
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const ensureVisaTypes =
  ({ force = false } = {}) =>
  (dispatch, getState) => {
    const state = getState().visaTypes;
    const hasData = state.visaTypes?.length > 0;
    const fresh =
      Number(state.loadedAt) > 0 &&
      Date.now() - state.loadedAt < VISA_TYPES_TTL;

    if (!force && hasData && fresh) {
      return Promise.resolve({ cached: true, data: state.visaTypes });
    }

    if (state.loading) {
      return Promise.resolve({ skipped: true });
    }

    return dispatch(fetchVisaTypes());
  };

// create visa type
export const createVisaType = createAsyncThunk(
  "visaTypes/add",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiCreateVisaType(payload);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

// updaet visa type
export const updateVisaType = createAsyncThunk(
  "visaTypes/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiUpdateVisaType(id, data);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

// delete visa type
export const deleteVisaType = createAsyncThunk(
  "visaTypes/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiDeleteVisaType(id);
      return id;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const visaTypeSlice = createSlice({
  name: "visaTypes",

  initialState: {
    visaTypes: [],
    loading: false,
    error: null,
    loadedAt: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch visa types
      .addCase(fetchVisaTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisaTypes.fulfilled, (state, action) => {
        state.visaTypes = action.payload?.visaTypes || action.payload || [];
        state.loading = false;
        state.loadedAt = Date.now();
      })
      .addCase(fetchVisaTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // create
      .addCase(createVisaType.fulfilled, (state, action) => {
        const visaType = action.payload?.visaType || action.payload;
        state.visaTypes.unshift(visaType);
        state.loadedAt = Date.now();
      })

      // update
      .addCase(updateVisaType.fulfilled, (state, action) => {
        const updatedVisaType =
          action.payload?.updatedVisaType || action.payload;
        state.visaTypes = state.visaTypes.map((vt) =>
          vt._id === updatedVisaType._id ? updatedVisaType : vt,
        );
        state.loadedAt = Date.now();
      })
      // delete
      .addCase(deleteVisaType.fulfilled, (state, action) => {
        state.visaTypes = state.visaTypes.filter(
          (vt) => vt._id !== action.payload,
        );
        state.loadedAt = Date.now();
      });
  },
});

export const selectVisaTypeItems = (state) => state.visaTypes.visaTypes;
export const selectVisaTypeLoading = (state) => state.visaTypes.loading;
export const selectVisaTypeError = (state) => state.visaTypes.error;

export default visaTypeSlice.reducer;
