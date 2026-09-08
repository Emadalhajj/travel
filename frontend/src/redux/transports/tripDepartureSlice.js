import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { handleApiError } from "../../Utils/handleApiError";
import {
  cancelTripDepartureApi,
  completeTripDepartureApi,
  createTripDepartureApi,
  deleteTripDepartureApi,
  getTripDepartures,
  scheduleTripDepartureApi,
  toggleTripDepartureApi,
  updateTripDepartureApi,
} from "../../services/api/admin/tripDepartures";

const thunk = (name, request) => createAsyncThunk(name, async (arg, { rejectWithValue }) => {
  try { return (await request(arg)).data; }
  catch (error) { return handleApiError(error, rejectWithValue); }
});

export const fetchTripDepartures = thunk("tripDepartures/fetch", getTripDepartures);
export const createTripDeparture = thunk("tripDepartures/create", createTripDepartureApi);
export const updateTripDeparture = thunk("tripDepartures/update", ({ id, payload }) => updateTripDepartureApi(id, payload));
export const scheduleTripDeparture = thunk("tripDepartures/schedule", scheduleTripDepartureApi);
export const cancelTripDeparture = thunk("tripDepartures/cancel", cancelTripDepartureApi);
export const completeTripDeparture = thunk("tripDepartures/complete", completeTripDepartureApi);
export const toggleTripDeparture = thunk("tripDepartures/toggle", toggleTripDepartureApi);
export const deleteTripDeparture = thunk("tripDepartures/delete", deleteTripDepartureApi);

const mutationActions = [
  createTripDeparture, updateTripDeparture, scheduleTripDeparture,
  cancelTripDeparture, completeTripDeparture, toggleTripDeparture, deleteTripDeparture,
];

const slice = createSlice({
  name: "tripDepartures",
  initialState: {
    items: [], listLoading: false, mutationLoading: false, error: null, mutationError: null,
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTripDepartures.pending, (state) => { state.listLoading = true; state.error = null; })
      .addCase(fetchTripDepartures.fulfilled, (state, action) => {
        state.listLoading = false;
        const payload = action.payload || {};
        state.items = payload.departures || payload.data || [];
        const total = payload.total ?? state.items.length;
        const limit = payload.limit ?? 10;
        state.pagination = { total, page: payload.page ?? 1, limit, totalPages: payload.totalPages ?? Math.ceil(total / limit) };
      })
      .addCase(fetchTripDepartures.rejected, (state, action) => { state.listLoading = false; state.error = action.payload; });

    mutationActions.forEach((action) => {
      builder
        .addCase(action.pending, (state) => { state.mutationLoading = true; state.mutationError = null; })
        .addCase(action.fulfilled, (state) => { state.mutationLoading = false; })
        .addCase(action.rejected, (state, result) => { state.mutationLoading = false; state.mutationError = result.payload; });
    });
  },
});

export const selectTripDepartures = (state) => state.tripDepartures.items;
export const selectTripDeparturePagination = (state) => state.tripDepartures.pagination;
export const selectTripDepartureListLoading = (state) => state.tripDepartures.listLoading;
export const selectTripDepartureMutationLoading = (state) => state.tripDepartures.mutationLoading;
export const selectTripDepartureError = (state) => state.tripDepartures.error;
export default slice.reducer;
