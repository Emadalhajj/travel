import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  apiGetRoomType,
  apiGetOneRoomType,
  apiCreateRoomType,
  apiUpdateRoomType,
  apiDeleteRoomType,
  apiGetRoomTypesByHotelId,
  apiToggleRoomType,
} from "../../services/api/hotels";
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
    selectedRoomType: null,
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
      // ================= GLOBAL PENDING =================
      /*
      في Redux Toolkit، addMatcher يعني:

      "نفذ هذا الكود لأي action يطابق شرط معين."
      */
      .addMatcher(
        (action) =>
          action.type.startsWith("roomTypes/") &&
          action.type.endsWith("/pending"),

        (state) => {
          state.loading = true;
          state.error = null;
        },
      )
      // ================= GLOBAL FULFILLED =================
      .addMatcher(
        (action) =>
          action.type.startsWith("roomTypes/") &&
          action.type.endsWith("/fulfilled"),

        (state) => {
          state.loading = false;
        },
      )

      // ================= GLOBAL REJECTED =================
      .addMatcher(
        (action) =>
          action.type.startsWith("roomTypes/") &&
          action.type.endsWith("/rejected"),

        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error?.message;
        },
      );
    /*
      .addCase(fetchRoomTypes.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchRoomTypes.fulfilled, (state, action) => {
    // أنواع الغرف بعد تطبيق الفلترة والفرز والpagination
        state.roomTypes = action.payload?.roomTypes || action.payload || []; //تايب روم هنا يجب ان يتطابق مع الفرونت
        state.loading = false;

        // console.log("FETCH ROOM TYPES PAYLOAD => ", action.payload);
      })
      .addCase(fetchRoomTypes.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(fetchRoomByHotelId.fulfilled, (state, action) => {
        state.roomTypes =
          action.payload?.roomTypes ||
          action.payload?.rooms ||
          action.payload ||
          [];
      })

      //create
      .addCase(createRoomType.fulfilled, (state, action) => {
        state.roomTypes.unshift(action.payload?.roomTypes || action.payload);
      })
      //update
      .addCase(updateRoomType.fulfilled, (state, action) => {
        const updatedRoom = action.payload.roomType;
        const index = state.roomTypes.findIndex(
          (r) => r._id === updatedRoom._id
        );

        if (index !== -1) {
          state.roomTypes[index] = updatedRoom; // 🔥 تحديث مباشر
        }
        // s.roomTypes = s.roomTypes.map((roomT) =>
        //   roomT._id === a.payload._id ? a.payload : roomT
        // );
      })
      //delete
      .addCase(deleteRoomType.fulfilled, (s, a) => {
        s.roomTypes = s.roomTypes.filter((roomT) => roomT._id !== a.payload);
      })
      // active status 
      .addCase(toggleRoomTypeActiveStatus.fulfilled , (state , action)=>{
          state.loading = false
    const updateToggle = action.payload?.roomType || action.payload
    state.roomTypes =  state.roomTypes.map((room)=>
      room._id === updateToggle._id ? updateToggle : room
    )

    }
    )
    */
  },
});

export const { setPage, setLimit } = roomTypeSlice.actions;
export default roomTypeSlice.reducer;
