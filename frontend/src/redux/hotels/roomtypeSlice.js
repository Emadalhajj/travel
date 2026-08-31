import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import {
  apiGetRoomType,
  apiCreateRoomType,
  apiUpdateRoomType,
  apiDeleteRoomType,
  apiGetRoomTypesByHotelId,
  apiToggleRoomType,
} from "../../services/api/admin/hotels";
import { handleApiError } from "../../Utils/handleApiError";

// fetch

export const fetchRoomTypes = createAsyncThunk(
  "roomTypes/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiGetRoomType(params);
      return res.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

// export const fetchRoomTypes = createAsyncThunk(
//   "roomType/fetch",
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await apiGetRoomType();
//       return res.data;
//     } catch (err) {
//       return handleApiError(err, rejectWithValue);
//     }
//   }
// );
//fetch room by hotel id

export const fetchRoomByHotelId = createAsyncThunk(
  "roomTypes/fetchByHotelId",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiGetRoomTypesByHotelId(id);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

// create room type

export const createRoomType = createAsyncThunk(
  "roomTypes/add",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiCreateRoomType(payload);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);
//update

export const updateRoomType = createAsyncThunk(
  "roomTypes/update",
  async ({ id, data, payload }, { rejectWithValue }) => {
    try {
      const res = await apiUpdateRoomType(id, payload || data);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

// delete
export const deleteRoomType = createAsyncThunk(
  "roomTypes/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiDeleteRoomType(id);
      return id;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);
//update roomtype status
export const toggleRoomTypeActiveStatus = createAsyncThunk(
  "roomTypes/toggle",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiToggleRoomType(id);
      return res.data.data;
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const roomTypeSlice = createSlice({
  name: "roomTypes",
  initialState: {
    roomTypesList: [],
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
      // ================= FETCH =================
      .addCase(fetchRoomTypes.fulfilled, (state, action) => {
        state.roomTypesList =
          action.payload?.roomTypes || action.payload?.data || [];

        state.pagination = {
          total: action.payload?.total || 0,
          page: action.payload?.page || 1,
          limit: action.payload?.limit || 10,
          totalPages: Math.ceil(
            (action.payload?.total || 0) / (action.payload?.limit || 10),
          ),
        };
      })
      .addCase(fetchRoomByHotelId.fulfilled, (state, action) => {
        const items = action.payload || [];
        state.roomTypesList = items;
        state.pagination = {
          total: items.length,
          page: state.pagination.page || 1,
          limit: state.pagination.limit || 10,
          totalPages: Math.ceil(items.length / (state.pagination.limit || 10)),
        };
      })
      // ================= CREATE =================
      .addCase(createRoomType.fulfilled, (state, action) => {
        state.roomTypesList.unshift(action.payload);
      })
      // ================= UPDATE =================
      .addCase(updateRoomType.fulfilled, (state, action) => {
        const updateRoomType = action.payload || [];
        state.roomTypesList = state.roomTypesList.map((room) =>
          room._id === updateRoomType._id ? updateRoomType : room,
        );
      })

      // ================= DELETE =================
      .addCase(deleteRoomType.fulfilled, (state, action) => {
        state.roomTypesList = state.roomTypesList.filter(
          (room) => room._id !== action.payload,
        );
      })
      // ================= change active status =================
      .addCase(toggleRoomTypeActiveStatus.fulfilled, (state, action) => {
        const updateStatus = action.payload || [];
        state.roomTypesList = state.roomTypesList.map((room) =>
          room._id === updateStatus._id ? updateStatus : room,
        );
      })
      .addMatcher(
        isAnyOf(fetchRoomTypes.pending, fetchRoomByHotelId.pending),
        (state) => {
          state.listLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        isAnyOf(fetchRoomTypes.fulfilled, fetchRoomByHotelId.fulfilled),
        (state) => {
          state.listLoading = false;
        },
      )
      .addMatcher(
        isAnyOf(fetchRoomTypes.rejected, fetchRoomByHotelId.rejected),
        (state, action) => {
          state.listLoading = false;
          state.error = action.payload || action.error?.message;
        },
      )
      .addMatcher(
        isAnyOf(
          createRoomType.pending,
          updateRoomType.pending,
          deleteRoomType.pending,
          toggleRoomTypeActiveStatus.pending,
        ),
        (state) => {
          state.mutationLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        isAnyOf(
          createRoomType.fulfilled,
          updateRoomType.fulfilled,
          deleteRoomType.fulfilled,
          toggleRoomTypeActiveStatus.fulfilled,
        ),
        (state) => {
          state.mutationLoading = false;
        },
      )
      .addMatcher(
        isAnyOf(
          createRoomType.rejected,
          updateRoomType.rejected,
          deleteRoomType.rejected,
          toggleRoomTypeActiveStatus.rejected,
        ),
        (state, action) => {
          state.mutationLoading = false;
          state.error = action.payload || action.error?.message;
        },
      );
  },
});

export const { setPage, setLimit } = roomTypeSlice.actions;
export const selectRoomTypeItems = (state) => state.roomTypes.roomTypesList;
export const selectRoomTypePagination = (state) => state.roomTypes.pagination;
export const selectRoomTypeListLoading = (state) => state.roomTypes.listLoading;
export const selectRoomTypeError = (state) => state.roomTypes.error;
export const selectRoomTypeMutationLoading = (state) => state.roomTypes.mutationLoading;
export default roomTypeSlice.reducer;
