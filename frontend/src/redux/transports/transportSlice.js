import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getTransports,
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
    listLoading: false,
    mutationLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      //fetch
      .addCase(fetchTransports.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchTransports.fulfilled, (state, action) => {
        state.listLoading = false;
        state.transportList =
          action.payload?.transports || action.payload || [];
      })
      .addCase(fetchTransports.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload;
      })
      //create
      .addCase(createNewTransport.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })

      .addCase(createNewTransport.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.transportList.unshift(
          action.payload?.newTransport || action.payload,
        );
      })
      .addCase(createNewTransport.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })
      //update
      .addCase(updateExistingTransport.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateExistingTransport.fulfilled, (state, action) => {
        state.mutationLoading = false;
        //console.log("update fulfilled → payload:", action.payload);

        const updatedTransport = action.payload?.updatedTransport;
        state.transportList = state.transportList.map((t) =>
          t._id === updatedTransport._id ? updatedTransport : t,
        );
      })
      .addCase(updateExistingTransport.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })
      //delete
      .addCase(deleteTransportById.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteTransportById.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.transportList = state.transportList.filter(
          (t) => t._id !== action.payload.id,
        );
      })
      .addCase(deleteTransportById.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })
      //toggle
      .addCase(toggleTransportActiveStatus.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(toggleTransportActiveStatus.fulfilled, (state, action) => {
        state.mutationLoading = false;
        const toggled = action.payload?.updatedTransport;
        state.transportList = state.transportList.map((t) =>
          t._id === toggled._id ? toggled : t,
        );
      })
      .addCase(toggleTransportActiveStatus.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});
export const selectTransportItems = (state) => state.transport.transportList;
export const selectTransportListLoading = (state) => state.transport.listLoading;
export const selectTransportError = (state) => state.transport.error;
export const selectTransportMutationLoading = (state) => state.transport.mutationLoading;
export default transportSlice.reducer;
