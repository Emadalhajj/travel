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
    listLoading: false,
    mutationLoading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
  },
  reducers: {
    clearVisasError: (state) => {
      state.error = null;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisas.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchVisas.fulfilled, (state, action) => {
        state.listLoading = false;
        state.error = null;
        state.list = Array.isArray(action.payload?.visas)
          ? action.payload.visas
          : [];
        const total = action.payload?.total ?? state.list.length;
        const page = action.payload?.page ?? 1;
        const limit = action.payload?.limit ?? 10;
        state.pagination = {
          total,
          page,
          limit,
          totalPages:
            action.payload?.totalPages ?? Math.ceil(total / limit),
        };
      })
      .addCase(fetchVisas.rejected, (state, action) => {
        state.error = action.payload;
        state.listLoading = false;
      });

    builder
      .addCase(createVisa.pending, (s) => {
        s.mutationLoading = true;
        s.error = null;
      })
      .addCase(createVisa.fulfilled, (s, a) => {
        const visa = a.payload?.visa || a.payload;
        if (visa) {
          s.list.unshift(visa);
        }
        s.mutationLoading = false;
        s.error = null;
      })
      .addCase(createVisa.rejected, (s, a) => {
        s.error = a.payload || a.error?.message;
        s.mutationLoading = false;
      })

      .addCase(updateVisa.pending, (s) => {
        s.mutationLoading = true;
        s.error = null;
      })
      .addCase(updateVisa.fulfilled, (s, a) => {
        const updatedVisa =
          a.payload?.visa || a.payload?.updatevisa || a.payload;
        if (updatedVisa) {
          s.list = s.list.map((visa) =>
            visa._id === updatedVisa._id ? updatedVisa : visa,
          );
        }
        s.mutationLoading = false;
        s.error = null;
      })
      .addCase(updateVisa.rejected, (s, a) => {
        s.mutationLoading = false;
        s.error = a.payload || a.error?.message;
      })
      .addCase(deleteVisa.pending, (s) => {
        s.mutationLoading = true;
        s.error = null;
      })
      .addCase(deleteVisa.fulfilled, (s, a) => {
        s.mutationLoading = false;
        const deletedVisaId = a.payload?.id || a.meta.arg; //
        if (deletedVisaId) {
          s.list = s.list.filter((visa) => visa._id !== deletedVisaId);
        }
      })
      .addCase(deleteVisa.rejected, (s, a) => {
        s.mutationLoading = false;
        s.error = a.payload || a.error?.message;
      })
      .addCase(toggleVisa.pending, (s) => {
        s.mutationLoading = true;
        s.error = null;
      })
      .addCase(toggleVisa.fulfilled, (s, a) => {
        s.mutationLoading = false;
        const updatedVisa = a.payload;
        s.list = s.list.map((v) =>
          v._id === updatedVisa._id ? updatedVisa : v,
        );
      })
      .addCase(toggleVisa.rejected, (s, a) => {
        s.mutationLoading = false;
        s.error = a.payload || a.error?.message;
      });
  },
});

export const { clearVisasError, setPage, setLimit } = visaSlice.actions;
export const selectVisaItems = (state) => state.visas.list;
export const selectVisaPagination = (state) => state.visas.pagination;
export const selectVisaListLoading = (state) => state.visas.listLoading;
export const selectVisaError = (state) => state.visas.error;
export const selectVisaMutationLoading = (state) => state.visas.mutationLoading;
export default visaSlice.reducer;
