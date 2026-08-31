import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  apiGetAllHotels,
  apiCreateHotel,
  apiUpdateHotel,
  apiDeleteHotel,
  apiToggleHotel,
  // apiGetRoomTypesByHotelId,
} from "../../services/api/admin/hotels";
import { handleApiError } from "../../Utils/handleApiError";
// ====================== Async Thunks ======================
//fetch

export const fetchHotels = createAsyncThunk(
  "hotel/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiGetAllHotels(params);

      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

//create
export const createHotel = createAsyncThunk(
  "hotel/add",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiCreateHotel(payload);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

// update

export const updateHotel = createAsyncThunk(
  "update/hotel",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiUpdateHotel(id, payload);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

//delete
export const deleteHotel = createAsyncThunk(
  "delte/hotel",
  async (id, { rejectWithValue }) => {
    try {
      await apiDeleteHotel(id);
      return id;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);
//toggle
export const toggleHotel = createAsyncThunk(
  "toggle/hotel",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiToggleHotel(id);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

// ====================== Slice ======================

const hotelSlice = createSlice({
  name: "hotel",
  initialState: {
    hotelslist: [],
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
    setPaginationLimit: (state, action) => {
      state.pagination.limit = action.payload;
    },
    setPaginationPage: (state, action) => {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Hotels
      .addCase(fetchHotels.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.listLoading = false;
        state.hotelslist = action.payload?.hotels || action.payload?.data || [];
        if (action.payload?.total !== undefined) {
          state.pagination.total = action.payload.total;
          state.pagination.page = action.payload.page || 1;
          state.pagination.totalPages = Math.ceil(
            action.payload.total / state.pagination.limit,
          );
        }
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload;
      })

      // Create Hotel
      .addCase(createHotel.pending, (state) => {
        state.mutationLoading = true;
      })
      .addCase(createHotel.fulfilled, (state, action) => {
        state.mutationLoading = false;
        const newHotel = action.payload?.hotel || action.payload;
        if (newHotel) {
          state.hotelslist.unshift(newHotel);
        }
      })
      .addCase(createHotel.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // Update Hotel
      .addCase(updateHotel.pending, (state) => {
        state.mutationLoading = true;
      })
      .addCase(updateHotel.fulfilled, (state, action) => {
        state.mutationLoading = false;
        const updatedHotel = action.payload?.hotel || action.payload;
        if (updatedHotel) {
          state.hotelslist = state.hotelslist.map((hotel) =>
            hotel._id === updatedHotel._id ? updatedHotel : hotel,
          );
        }
      })
      .addCase(updateHotel.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // Delete Hotel
      .addCase(deleteHotel.pending, (state) => {
        state.mutationLoading = true;
      })
      .addCase(deleteHotel.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.hotelslist = state.hotelslist.filter(
          (hotel) => hotel._id !== action.payload,
        );
      })
      .addCase(deleteHotel.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // Toggle Status
      .addCase(toggleHotel.pending, (state) => {
        state.mutationLoading = true;
      })
      .addCase(toggleHotel.fulfilled, (state, action) => {
        state.mutationLoading = false;
        const toggled = action.payload?.hotel || action.payload;
        if (toggled) {
          state.hotelslist = state.hotelslist.map((hotel) =>
            hotel._id === toggled._id ? toggled : hotel,
          );
        }
      })
      .addCase(toggleHotel.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setPaginationLimit, setPaginationPage } = hotelSlice.actions;
export const selectHotelItems = (state) => state.hotels.hotelslist;
export const selectHotelPagination = (state) => state.hotels.pagination;
export const selectHotelListLoading = (state) => state.hotels.listLoading;
export const selectHotelError = (state) => state.hotels.error;
export const selectHotelMutationLoading = (state) => state.hotels.mutationLoading;
export default hotelSlice.reducer;
