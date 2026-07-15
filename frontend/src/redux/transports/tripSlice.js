import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getAllTrips,
  getTripById,
  createTripApi,
  updateTripApi,
  deleteTripApi,
  toggleTripStatus,
} from "../../services/api/transports";
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
  }
);
//fetchBY id

export const fetchTripById = createAsyncThunk(
  "oneTrip/fetch",
  async (id, { rejectWithValue }) => {
    try {
      const res = await getTripById(id);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  }
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
  }
);

//update
export const updateExitingTrip = createAsyncThunk(
  "trip/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await updateTripApi(id, payload);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  }
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
  }
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
  }
);

//slices

const tripSlice = createSlice({
  name: "trip",
  initialState: {
    tripList: [],
    selectedTrip: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    //fetch
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.tripList = action.payload?.trips || action.payload || [];
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      //byid
      .addCase(fetchTripById.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(fetchTripById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTrip = action.payload?.oneTrip || action.payload || [];
      })
      .addCase(fetchTripById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      //create new

      .addCase(createNewTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.tripList.unshift(action.payload?.newTrip || action.payload);
      })
      .addCase(createNewTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNewTrip.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      //update
      .addCase(updateExitingTrip.fulfilled, (state, action) => {
        state.loading = false;
        const updateTrip = action.payload?.updateTrip || action.payload;
        state.tripList = state.tripList.map((trip) =>
          trip._id === updateTrip._id ? updateTrip : trip
        );
      })
      .addCase(updateExitingTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateExitingTrip.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      ///dalete
      .addCase(deleteTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.tripList = state.tripList.filter(
          (item) => item._id !== action.payload.id
        );
      })
      .addCase(deleteTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteTrip.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      //toggle

      .addCase(toggleTripActiveStatus.fulfilled, (state, action) => {
        state.loading = false;
        const toggle = action.payload?.updateStatusTrip;
        state.tripList = state.tripList.map((to) =>
          to._id === toggle._id ? toggle : to
        );
      })
      .addCase(toggleTripActiveStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleTripActiveStatus.pending, (state) => {
        state.loading = true;
        state.error = false;
      });
  },
})
export default tripSlice.reducer;
