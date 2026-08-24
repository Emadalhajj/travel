import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
// import axios from "axios";
import { register, loging } from "../../services/api";
import { updateUserProfile } from "../../services/api/admin/auth";
import { changePasswordUser } from "../../services/api/admin/auth";
import { exchangeGoogleAuth } from "../../services/api/admin/auth";

// 🟢 تسجيل المستخدم الجديد
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, thunkAPI) => {
    try {
      const response = await register(userData);
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Registration failed",
      );
    }
  },
);
// 🟢 تسجيل الدخول
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (loginData, thunkAPI) => {
    try {
      const response = await loging(loginData);
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Registration failed",
      );
    }
  },
);

export const completeGoogleLogin = createAsyncThunk(
  "auth/completeGoogleLogin",
  async (_, { rejectWithValue }) => {
    try {
      const response = await exchangeGoogleAuth();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Google login failed",
      );
    }
  },
);
//updateMyProfile
export const updateMyProfile = createAsyncThunk(
  "auth/updateMyProfile",
  async (formData, thunkAPI) => {
    try {
      const response = await updateUserProfile(formData);
      return response.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Update profile failed",
      );
    }
  },
);
// chage password (لما المستخدم يغير كلمة مروره بنفسه)
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await changePasswordUser(payload); // payload كامل
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Change password failed",
      );
    }
  },
);

// 🟣 الشريحة الرئيسية
const authSlice = createSlice({
  name: "auth",
  initialState: {
    currentUser: JSON.parse(localStorage.getItem("currentUser")) || null,
    loading: false,
    error: null,
    TypeAction: null,
  },
  reducers: {
    // setRegisterUser: (state, action) => {
    //   state.currentUser = action.payload;
    //   localStorage.setItem("currentUser", JSON.stringify(action.payload));
    // },
    // setloginUser: (state, action) => {
    //   state.currentUser = action.payload;
    //   localStorage.setItem("currentUser", JSON.stringify(action.payload));
    // },
    logoutUser: (state) => {
      state.currentUser = null;
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
      state.token = null;
      state.TypeAction = "logout";
    },
    clearError: (state) => {
      state.error = null;
    },
    // 🔹 تعيين المستخدم الحالي (مثلاً بعد إعادة تحميل الصفحة)
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload.user;
      localStorage.setItem("currentUser", JSON.stringify(action.payload.user));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        localStorage.setItem(
          "currentUser",
          JSON.stringify(action.payload.user),
        );
        state.TypeAction = "register";
        // toast.success("registration successful");
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.TypeAction = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;

        state.currentUser = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem(
          "currentUser",
          JSON.stringify(action.payload.user),
        );
        localStorage.setItem("token", action.payload.token);

        state.TypeAction = "login";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.TypeAction = null;
        toast.error(action.payload);
      })
      .addCase(completeGoogleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeGoogleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("currentUser", JSON.stringify(action.payload.user));
        localStorage.setItem("token", action.payload.token);
        state.TypeAction = "login";
      })
      .addCase(completeGoogleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase(updateMyProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMyProfile.fulfilled, (state, action) => {
        state.loading = false;

        const updatedUser = action.payload;
        state.currentUser = updatedUser;
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        toast.success("Profile updated successfully");
      })
      .addCase(updateMyProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        toast.success(
          action.payload.message || "Password changed successfully",
        );
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { logoutUser, clearError, setCurrentUser } = authSlice.actions;
export default authSlice.reducer;
