// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import { toast } from "react-toastify";
// import {
//   apiCreateVisaBooking,
//   apiGetMyBookings,
//   apiListAllBookings,
//   apiUpdateBookingStatus,
// } from "../../services/api/bookings";// import reducer from "../auth/authSlice";
// import { handleApiError  } from "../../Utils/handleApiError";



// // create booking (FormData)
// export const createVisaBooking = createAsyncThunk(
//   "bookings/createVisaBooking",
//   async (formData, { rejectWithValue }) => {
//     try {
//       const res = await apiCreateVisaBooking(formData);
//       // expecting { message, booking }
//       return res.data;
//     } catch (err) {
//       return handleApiError(err, rejectWithValue);
//     }
//   }
// );


// // get my bookings
// export const fetchMyBookings = createAsyncThunk(
//   "bookings/fetchMyBookings",
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await apiGetMyBookings();
//       return res.data; // expecting { bookings: [...] }
//     } catch (err) {
//       return handleApiError(err, rejectWithValue);
//     }
//   }
// );

// // admin: list all
// export const fetchAllBookings = createAsyncThunk(
//   "bookings/fetchAll",
//   async (params, { rejectWithValue }) => {
//     try {
//       const res = await apiListAllBookings(params);
//       return res.data;
//     } catch (err) {
//       return handleApiError(err, rejectWithValue);
//     }
//   }
// );
// // admin: update status
// export const updateBookingStatus = createAsyncThunk(
//   "bookings/updateStatus",
//   async ({ id, status }, { rejectWithValue }) => {
//     try {
//       const res = await apiUpdateBookingStatus(id, status);
//       return res.data;
//     } catch (err) {
//       return handleApiError(err, rejectWithValue);
//     }
//   }
// );


// export const bookingSlice = createSlice({
//   name: "bookings",
//   initialState: {
//       myBookings: [],
//     allBookings: [],
//     loading: false,
//     error: null,
//     lastCreated: null,
//   },
//   reducers: {
//     clearBookingError: (state) => {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {

//     // create
//     builder
//       .addCase(createVisaBooking.pending, (s) => {
//         s.loading = true;
//         s.error = null;
//       })
//       .addCase(createVisaBooking.fulfilled, (s, action) => {
//         s.loading = false;
//         const booking = action.payload?.booking || action.payload;
//         if (booking) {
//           s.myBookings.unshift(booking);
//           s.lastCreated = booking;
//         }
//       })
//       .addCase(createVisaBooking.rejected, (s, action) => {
//         s.loading = false;
//         s.error = action.payload || action.error?.message;
//       });

//  // fetch my
//     builder
//       .addCase(fetchMyBookings.pending, (s) => {
//         s.loading = true;
//         s.error = null;
//       })
//       .addCase(fetchMyBookings.fulfilled, (s, action) => {
//         s.loading = false;
//         s.myBookings = action.payload?.bookings || action.payload || [];
//       })
//       .addCase(fetchMyBookings.rejected, (s, action) => {
//         s.loading = false;
//         s.error = action.payload || action.error?.message;
//       });

//        // fetch all
//     builder
//       .addCase(fetchAllBookings.pending, (s) => {
//         s.loading = true;
//         s.error = null;
//       })
//       .addCase(fetchAllBookings.fulfilled, (s, action) => {
//         s.loading = false;
//         s.allBookings = action.payload?.bookings || action.payload || [];
//       })
//       .addCase(fetchAllBookings.rejected, (s, action) => {
//         s.loading = false;
//         s.error = action.payload || action.error?.message;
//       });
//       // update status
//     builder
//       .addCase(updateBookingStatus.pending, (s) => {
//         s.loading = true;
//         s.error = null;
//       })
//       .addCase(updateBookingStatus.fulfilled, (s, action) => {
//         s.loading = false;
//         const updated = action.payload?.booking || action.payload;
//         if (updated) {
//           // update in both lists if exist
//           s.myBookings = s.myBookings.map((b) => (b._id === updated._id ? updated : b));
//           s.allBookings = s.allBookings.map((b) => (b._id === updated._id ? updated : b));
//         }
//       })
//       .addCase(updateBookingStatus.rejected, (s, action) => {
//         s.loading = false;
//         s.error = action.payload || action.error?.message;
//       });


//   },
// });

// export const  {clearBookingsError } = bookingSlice.actions
// export default bookingSlice.reducer;