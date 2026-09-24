import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { handleApiError } from "../../Utils/handleApiError";
import {
  apiCreateCoupon,
  apiDeleteCoupon,
  apiGetCoupons,
  apiUpdateCoupon,
} from "../../services/api/admin/couponApi";

export const fetchCoupons = createAsyncThunk("coupons/fetch", async (params, { rejectWithValue }) => {
  try { return (await apiGetCoupons(params)).data; } catch (error) { return handleApiError(error, rejectWithValue); }
});
export const createCoupon = createAsyncThunk("coupons/create", async (data, { rejectWithValue }) => {
  try { return (await apiCreateCoupon(data)).data.data; } catch (error) { return handleApiError(error, rejectWithValue); }
});
export const updateCoupon = createAsyncThunk("coupons/update", async (payload, { rejectWithValue }) => {
  try { return (await apiUpdateCoupon(payload)).data.data; } catch (error) { return handleApiError(error, rejectWithValue); }
});
export const deleteCoupon = createAsyncThunk("coupons/delete", async (id, { rejectWithValue }) => {
  try { await apiDeleteCoupon(id); return id; } catch (error) { return handleApiError(error, rejectWithValue); }
});

const slice = createSlice({
  name: "coupons",
  initialState: { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }, loading: false, mutationLoading: false, error: null },
  reducers: {},
  extraReducers: (builder) => builder
    .addCase(fetchCoupons.pending, (state) => { state.loading = true; state.error = null; })
    .addCase(fetchCoupons.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.items || [];
      state.pagination = {
        total: action.payload.total || 0,
        page: action.payload.page || 1,
        limit: action.payload.limit || 10,
        totalPages: action.payload.totalPages || 0,
      };
    })
    .addCase(fetchCoupons.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
    .addMatcher((action) => /coupons\/(create|update|delete)\/pending$/.test(action.type), (state) => { state.mutationLoading = true; })
    .addMatcher((action) => /coupons\/(create|update|delete)\/(fulfilled|rejected)$/.test(action.type), (state) => { state.mutationLoading = false; }),
});

export const selectCoupons = (state) => state.coupons.items;
export const selectCouponPagination = (state) => state.coupons.pagination;
export const selectCouponLoading = (state) => state.coupons.loading;
export const selectCouponMutationLoading = (state) => state.coupons.mutationLoading;
export const selectCouponError = (state) => state.coupons.error;
export default slice.reducer;

