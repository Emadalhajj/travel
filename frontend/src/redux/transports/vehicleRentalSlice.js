import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  apiGetVehicleRentals,
  apiGetOneVehicleRental,
  apiCreateVehicleRental,
  apiUpdateVehicleRental,
  apiDeleteVehicleRental,
  apiToggleVehicleRentalActive,
} from "../../services/api/vehicleRentals";

import { handleApiError } from "../../Utils/handleApiError";

export const fetchVehicleRentals = createAsyncThunk(
  "vehicleRentals/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiGetVehicleRentals(params);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const createVehicleRental = createAsyncThunk(
  "vehicleRentals/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiCreateVehicleRental(payload);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const updateVehicleRental = createAsyncThunk(
  "vehicleRentals/update",
  async ({ id, data, payload }, { rejectWithValue }) => {
    try {
      const res = await apiUpdateVehicleRental(id, payload || data);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const deleteVehicleRental = createAsyncThunk(
  "vehicleRentals/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiDeleteVehicleRental(id);
      return id;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const toggleVehicleRentalActive = createAsyncThunk(
  "vehicleRentals/toggleActive",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiToggleVehicleRentalActive(id);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

const vehicleRentalSlice = createSlice({
  name: "vehicleRentals",
  initialState: {
    vehicleRentalsList: [],
    selectedVehicleRental: null,
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicleRentals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVehicleRentals.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicleRentalsList = action.payload.data || [];
        state.pagination = {
          total: action.payload.total || 0,
          page: action.payload.page || 1,
          limit: action.payload.limit || 10,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchVehicleRentals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createVehicleRental.fulfilled, (state, action) => {
        state.vehicleRentalsList.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(updateVehicleRental.fulfilled, (state, action) => {
        const index = state.vehicleRentalsList.findIndex(
          (rental) => rental._id === action.payload._id
        );
        if (index !== -1) {
          state.vehicleRentalsList[index] = action.payload;
        }
      })
      .addCase(deleteVehicleRental.fulfilled, (state, action) => {
        state.vehicleRentalsList = state.vehicleRentalsList.filter(
          (rental) => rental._id !== action.payload
        );
        state.pagination.total -= 1;
      })
      .addCase(toggleVehicleRentalActive.fulfilled, (state, action) => {
        const index = state.vehicleRentalsList.findIndex(
          (rental) => rental._id === action.payload._id
        );
        if (index !== -1) {
          state.vehicleRentalsList[index] = action.payload;
        }
      });
  },
});

export const { setPage, setLimit } = vehicleRentalSlice.actions;
export default vehicleRentalSlice.reducer;