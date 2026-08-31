import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getAllTrips,
  createTripApi,
  updateTripApi,
  deleteTripApi,
  toggleTripStatus,
} from "../../services/api/admin/transports";
import { handleApiError } from "../../Utils/handleApiError";

//fetch

export const fetchTrips = createAsyncThunk(
  "trip/fetch",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getAllTrips(params);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);
//create trip

export const createNewTrip = createAsyncThunk(
  "trip/add",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createTripApi(payload);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

//update
export const updateExistingTrip = createAsyncThunk(
  "trip/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await updateTripApi(id, payload);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);
//delete
export const deleteTrip = createAsyncThunk(
  "trip/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteTripApi(id);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);
//toggle trip
export const toggleTripActiveStatus = createAsyncThunk(
  "trip/toggle",
  async (id, { rejectWithValue }) => {
    try {
      const res = await toggleTripStatus(id);

      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

//slices

const tripSlice = createSlice({
  name: "trip",
  initialState: {
    tripList: [],
    listLoading: false,
    mutationLoading: false,
    mutationError: null,
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
    //fetch
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.listLoading = true;
        state.error = false;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.listLoading = false;
        state.error = null;
        state.tripList = action.payload?.trips || action.payload || [];
        const total = action.payload?.total ?? state.tripList.length;
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
      .addCase(fetchTrips.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload;
      })
      //create new

      .addCase(createNewTrip.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.tripList.unshift(action.payload?.newTrip || action.payload);
      })
      .addCase(createNewTrip.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      })
      .addCase(createNewTrip.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      //update
      .addCase(updateExistingTrip.fulfilled, (state, action) => {
        state.mutationLoading = false;
        const updateTrip = action.payload?.updateTrip || action.payload;
        state.tripList = state.tripList.map((trip) =>
          trip._id === updateTrip._id ? updateTrip : trip,
        );
      })
      .addCase(updateExistingTrip.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      })
      .addCase(updateExistingTrip.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      ///dalete
      .addCase(deleteTrip.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.tripList = state.tripList.filter(
          (item) => item._id !== action.payload.id,
        );
      })
      .addCase(deleteTrip.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      })
      .addCase(deleteTrip.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      //toggle

      .addCase(toggleTripActiveStatus.fulfilled, (state, action) => {
        state.mutationLoading = false;
        const toggle = action.payload?.updateStatusTrip;
        state.tripList = state.tripList.map((to) =>
          to._id === toggle._id ? toggle : to,
        );
      })
      .addCase(toggleTripActiveStatus.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      })
      .addCase(toggleTripActiveStatus.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      });
  },
});
export const { setPage, setLimit } = tripSlice.actions;
export const selectTripItems = (state) => state.trip.tripList;
export const selectTripPagination = (state) => state.trip.pagination;
export const selectTripListLoading = (state) => state.trip.listLoading;
export const selectTripError = (state) => state.trip.error;
export const selectTripMutationLoading = (state) => state.trip.mutationLoading;
export default tripSlice.reducer;
