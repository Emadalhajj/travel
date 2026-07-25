import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getTransports,
  getTransportById,
  createTransport,
  updateTransport,
  deleteTransport,
  toggleTransportStatus,
} from "../../services/api/admin/transports";

import { handleApiError } from "../../Utils/handleApiError";

//fetch
export const fetchTransports = createAsyncThunk(
  "transport/fetch",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getTransports(params);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

// fetchTransportByj id
export const fetchTransportById = createAsyncThunk(
  "oneTransport/fetch",
  async (id, { rejectWithValue }) => {
    try {
      const res = await getTransportById(id);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);
//create

export const createNewTransport = createAsyncThunk(
  "transport/add",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createTransport(payload);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);
//update

export const updateExistingTransport = createAsyncThunk(
  "transport/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await updateTransport(id, payload);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);
//delete
export const deleteTransportById = createAsyncThunk(
  "transport/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deleteTransport(id);
      return id;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

//toggle status
export const toggleTransportActiveStatus = createAsyncThunk(
  "transport/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      const res = await toggleTransportStatus(id);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

const transportSlice = createSlice({
  name: "transport",
  initialState: {
    transportList: [],
    selectedTransport: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      //fetch
      .addCase(fetchTransports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransports.fulfilled, (state, action) => {
        state.loading = false;
        state.transportList =
          action.payload?.transports || action.payload || [];
      })
      .addCase(fetchTransportById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTransport =
          action.payload?.oneTransport || action.payload || [];
      })
      .addCase(fetchTransportById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      //create
      .addCase(createNewTransport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(createNewTransport.fulfilled, (state, action) => {
        state.loading = false;
        state.transportList.unshift(
          action.payload?.newTransport || action.payload,
        );
      })
      //update
      .addCase(updateExistingTransport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExistingTransport.fulfilled, (state, action) => {
        state.loading = false;
        //console.log("update fulfilled → payload:", action.payload);

        const updatedTransport = action.payload?.updatedTransport;
        state.transportList = state.transportList.map((t) =>
          t._id === updatedTransport._id ? updatedTransport : t,
        );
      })
      //delete
      .addCase(deleteTransportById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTransportById.fulfilled, (state, action) => {
        state.loading = false;
        state.transportList = state.transportList.filter(
          (t) => t._id !== action.payload.id,
        );
      })
      //toggle
      .addCase(toggleTransportActiveStatus.fulfilled, (state, action) => {
        const toggled = action.payload?.updatedTransport;
        state.transportList = state.transportList.map((t) =>
          t._id === toggled._id ? toggled : t,
        );
      });
  },
});
export default transportSlice.reducer;
