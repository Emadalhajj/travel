import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  apiGetInventory,
  apiCreateInventory,
  apiUpsertInventoryPeriod,
  apiUpdateInventory,
  apiDeleteInventory,
  apiGetInventoryPeriods,
} from "../../services/api/admin/inventory";

import { handleApiError } from "../../Utils/handleApiError";

export const fetchInventory = createAsyncThunk(
  "inventory/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiGetInventory(params);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const fetchInventoryPeriods = createAsyncThunk(
  "inventory/fetchPeriods",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiGetInventoryPeriods(params);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const createInventory = createAsyncThunk(
  "inventory/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiCreateInventory(payload);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const upsertInventoryPeriod = createAsyncThunk(
  "inventory/upsertPeriod",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiUpsertInventoryPeriod(payload);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const updateInventory = createAsyncThunk(
  "inventory/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiUpdateInventory(id, data);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const deleteInventory = createAsyncThunk(
  "inventory/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiDeleteInventory(id);
      return id;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    inventoryList: [],
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
      // fetch
      .addCase(fetchInventory.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.listLoading = false;
        state.inventoryList = action.payload.data || [];
        state.pagination = {
          total: action.payload.total || 0,
          page: action.payload.page || 1,
          limit: action.payload.limit || 10,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload;
      })

      // create single
      .addCase(createInventory.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createInventory.fulfilled, (state, action) => {
        state.mutationLoading = false;

        if (Array.isArray(action.payload)) {
          state.inventoryList = [...action.payload, ...state.inventoryList];
        } else if (action.payload) {
          state.inventoryList.unshift(action.payload);
        }
      })
      .addCase(createInventory.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // upsert period
      .addCase(upsertInventoryPeriod.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(upsertInventoryPeriod.fulfilled, (state) => {
        state.mutationLoading = false;
      })
      .addCase(upsertInventoryPeriod.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // update
      .addCase(updateInventory.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateInventory.fulfilled, (state, action) => {
        state.mutationLoading = false;

        state.inventoryList = state.inventoryList.map((item) =>
          item._id === action.payload?._id ? action.payload : item,
        );
      })
      .addCase(updateInventory.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // delete
      .addCase(deleteInventory.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteInventory.fulfilled, (state, action) => {
        state.mutationLoading = false;

        state.inventoryList = state.inventoryList.filter(
          (item) => item._id !== action.payload,
        );
      })
      .addCase(deleteInventory.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })
      // fetch periods
      .addCase(fetchInventoryPeriods.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchInventoryPeriods.fulfilled, (state, action) => {
        state.listLoading = false;
        state.inventoryList = action.payload.data || [];
        state.pagination = {
          total: action.payload.total || 0,
          page: action.payload.page || 1,
          limit: action.payload.limit || 10,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchInventoryPeriods.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setPage, setLimit } = inventorySlice.actions;

export const selectInventoryItems = (state) => state.inventory.inventoryList;
export const selectInventoryPagination = (state) => state.inventory.pagination;
export const selectInventoryListLoading = (state) => state.inventory.listLoading;
export const selectInventoryError = (state) => state.inventory.error;
export const selectInventoryMutationLoading = (state) => state.inventory.mutationLoading;

export default inventorySlice.reducer;
