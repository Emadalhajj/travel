import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllUsers,
  createUser,
  deleteUser,
  toggleUserStatus,
  
  getUserById,
  changePasswordUser,
  updatedUser,
} from "../../services/api/users";
import { handleApiError } from "../../Utils/handleApiError";

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getAllUsers(params);
      return res.data.data || res.data; // // { users , total } تأكد من إرجاع البيانات بشكل صحيح 
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const fetchUserById = createAsyncThunk(
  "users/fetchUserById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await getUserById(id);
      return res.data.data || res.data; // تأكد من إرجاع البيانات بشكل صحيح 
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const createNewUser = createAsyncThunk(
  "users/createNewUser",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createUser(payload);
      return res.data.data || res.data; //// newUser تأكد من إرجاع البيانات بشكل صحيح 
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await updatedUser(id, payload);
      return res.data.data || res.data; // updatedUser تأكد من إرجاع البيانات بشكل صحيح 
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const deleteUserById = createAsyncThunk(
  "users/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteUser(id);
      return res.data.data || res.data; // تأكد من إرجاع البيانات بشكل صحيح 
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const toggleStatus = createAsyncThunk(
  "users/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      const res = await toggleUserStatus(id);
      return res.data.data || res.data; // تأكد من إرجاع البيانات بشكل صحيح 
    } catch (err) {
      return handleApiError(err, rejectWithValue);
    }
  },
);

export const changePassword = createAsyncThunk(
  "users/changePassword",
  async ({ id, password }, { rejectWithValue }) => {
    try{
      const res = await changePasswordUser(id, password);
      return res.data.data || res.data;
    }catch(err){
      return handleApiError(err, rejectWithValue);
    }
  }
)
//slices
const usersSlice = createSlice({
  name: "users",
  initialState: {
    usersList: [],
    currentUser: null, // لتخزين بيانات المستخدم الحالي عند التعديل
    total : 0,
    loading: {
    fetch: false,
    create: false,
    update: false,
    delete: false,
    toggle: false,
    changePassword:false
  },
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* ================= FETCH ================= */
      .addCase(fetchUsers.pending, (state) => {
          state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.usersList = action.payload?.users ;
        state.total = action.payload?.total
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload;
      })
      .addCase(fetchUserById.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.currentUser = action.payload 
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload;
      })
       /* ================= CREATE ================= */
      .addCase(createNewUser.pending, (state) => {
        state.loading.create = true;
        state.error = null;
      })
      .addCase(createNewUser.fulfilled, (state, action) => {
        state.loading.create = false;
        state.usersList.unshift(action.payload); // إضافة المستخدم الجديد في بداية القائمة
      })
      .addCase(createNewUser.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.payload;
      })

      /* ================= UPDATE ================= */
      .addCase(updateUser.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
         state.loading.update = false;
        const updatedUser = action.payload ;

         const user = state.usersList.find((u) => u._id === updatedUser._id);
        if (user) {
          Object.assign(user, updatedUser);// تحديث بيانات المستخدم الموجود في القائمة بالبيانات الجديدة
        }

        // تحديث المستخدم في القائمة - طريقة اخرى
        // state.usersList = state.usersList.map((user) =>
        //   user._id === updatedUser._id ? updatedUser : user,
        // );
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload;
      })
            /* ================= DELETE ================= */
      .addCase(deleteUserById.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deleteUserById.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.usersList = state.usersList.filter(
          (user) => user._id !== action.payload
           
        );
      })
      .addCase(deleteUserById.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload;
      })
            /* ================= TOGGLE ================= */
      .addCase(toggleStatus.pending, (state) => {
        state.loading.toggle = true;
        state.error = null;
      })
      .addCase(toggleStatus.fulfilled, (state, action) => {
        state.loading.toggle = false;

        const toggledUser = action.payload
        const user = state.usersList.find((u)=> u._id === toggledUser._id)
        if(user){
            Object.assign(user , toggledUser)
        }
        
        // state.usersList = state.usersList.map((user) =>
        //   user._id === toggledUser._id ? toggledUser : user,
        // );
      })
      .addCase(toggleStatus.rejected, (state, action) => {
        state.loading.toggle = false;
        state.error = action.payload;
      })
      .addCase(changePassword.pending , (state)=>{
        state.loading.changePassword = true
        state.error = null;
      })
      .addCase(changePassword.fulfilled , (state , action)=>{
        state.loading.changePassword = false;
        const changePassword = action.payload
        const user = state.usersList.find((u)=> u._id === changePassword._id )
        if(user){
          Object.assign(user , changePassword)
        }
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading.changePassword = false;
        state.error = action.payload;
      });
  },
});
export default usersSlice.reducer;
