// src/redux/visas/visaSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  apiGetVisas,
  apiCreateVisa,
  apiUpdateVisa,
  apiDeleteVisa,
  apiToggleVisa,
} from "../../services/api/admin/visas";
import { handleApiError } from "../../Utils/handleApiError";

export const fetchVisas = createAsyncThunk(
  "visas/fetch",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiGetVisas(params);
      // console.log("SERVER RAW RESPONSE =>", res.data);  // 🔥 هذا أهم شيء الآن
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const createVisa = createAsyncThunk(
  "visas/add",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiCreateVisa(payload);

      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const updateVisa = createAsyncThunk(
  "visas/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiUpdateVisa(id, data);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);
export const deleteVisa = createAsyncThunk(
  "visas/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiDeleteVisa(id);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);
export const toggleVisa = createAsyncThunk(
  "visas/toggle",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiToggleVisa(id);
      return res.data.visa;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const visaSlice = createSlice({
  name: "visas",
  initialState: {
    list: [],
    currentVisa: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearVisasError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisas.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.list = Array.isArray(action.payload?.visas)
          ? action.payload.visas
          : [];
      })
      .addCase(fetchVisas.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });

    builder
      .addCase(createVisa.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(createVisa.fulfilled, (s, a) => {
        const visa = a.payload?.visa || a.payload;
        if (visa) {
          s.list.unshift(visa);
        }
        s.loading = false;
        s.error = null;
      })
      .addCase(createVisa.rejected, (s, a) => {
        s.error = a.payload || a.error?.message;
        s.loading = false;
      })

      .addCase(updateVisa.pending, (s, a) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(updateVisa.fulfilled, (s, a) => {
        const updatedVisa = a.payload?.visa || a.payload;
        if (updatedVisa) {
          s.list = s.list.map((visa) =>
            visa._id === updatedVisa._id ? updatedVisa : visa,
          );
        }
      })
      .addCase(deleteVisa.fulfilled, (s, a) => {
        const deletedVisaId = a.payload?.id || a.meta.arg; //
        if (deletedVisaId) {
          s.list = s.list.filter((visa) => visa._id !== deletedVisaId);
        }
      })
      .addCase(toggleVisa.fulfilled, (s, a) => {
        const updatedVisa = a.payload;
        s.list = s.list.map((v) =>
          v._id === updatedVisa._id ? updatedVisa : v,
        );
      });
  },
});

export const { clearVisasError } = visaSlice.actions;
export default visaSlice.reducer;
