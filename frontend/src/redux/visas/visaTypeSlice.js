import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  apiGetVisaTypes,
  apiCreateVisaType,
  apiUpdateVisaType,
  apiDeleteVisaType,
} from "../../services/api/admin/visas";
import { handleApiError } from "../../Utils/handleApiError";

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
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch visa types
      .addCase(fetchVisaTypes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVisaTypes.fulfilled, (state, action) => {
        state.visaTypes = action.payload?.visaTypes || action.payload || [];
        state.loading = false;
      })
      .addCase(fetchVisaTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // create
      .addCase(createVisaType.fulfilled, (state, action) => {
        state.visaTypes.unshift(action.payload?.visaTypes || action.payload);
      })

      // update
      .addCase(updateVisaType.fulfilled, (state, action) => {
        state.visaTypes = state.visaTypes.map((vt) =>
          vt._id === action.payload._id ? action.payload : vt,
        );
      })
      // delete
      .addCase(deleteVisaType.fulfilled, (state, action) => {
        state.visaTypes = state.visaTypes.filter(
          (vt) => vt._id !== action.payload,
        );
      });
  },
});

export default visaTypeSlice.reducer;
