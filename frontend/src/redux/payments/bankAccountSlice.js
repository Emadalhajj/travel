import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  apiGetBankAccounts,
  apiGetBankAccountById,
  apiCreateBankAccount,
  apiUpdateBankAccount,
  apiUpdateBankAccountStatus,
  apiDeleteBankAccount,
} from "../../services/api/admin/bankAccountApi";

import {
  handleApiError,
} from "../../Utils/handleApiError";

/*
=====================================================
Fetch Bank Accounts
=====================================================

تجلب قائمة الحسابات مع الفلاتر والترقيم.
يفترض أن استجابة الباك إند تكون:

{
  success: true,
  data: [...],
  pagination: {
    total,
    page,
    limit,
    pages
  }
}
=====================================================
*/

export const fetchBankAccounts =
  createAsyncThunk(
    "bankAccounts/fetch",

    async (
      params,
      {
        rejectWithValue,
      },
    ) => {
      try {
        const res =
          await apiGetBankAccounts(
            params,
          );

        return res.data;
      } catch (err) {
        return handleApiError(
          err,
          rejectWithValue,
        );
      }
    },
  );

export const fetchBankAccountById =
  createAsyncThunk(
    "bankAccounts/fetchById",
    async (
      id,
      {
        rejectWithValue,
      },
    ) => {
      try {
        const res =
          await apiGetBankAccountById(
            id,
          );

        return res.data.data;
      } catch (err) {
        return handleApiError(
          err,
          rejectWithValue,
        );
      }
    },
  );

/*
=====================================================
Create Bank Account
=====================================================
*/

export const createBankAccount =
  createAsyncThunk(
    "bankAccounts/create",

    async (
      payload,
      {
        rejectWithValue,
      },
    ) => {
      try {
        const res =
          await apiCreateBankAccount(
            payload,
          );

        return res.data.data;
      } catch (err) {
        return handleApiError(
          err,
          rejectWithValue,
        );
      }
    },
  );

/*
=====================================================
Update Bank Account
=====================================================
*/

export const updateBankAccount =
  createAsyncThunk(
    "bankAccounts/update",

    async (
      {
        id,
        data,
      },
      {
        rejectWithValue,
      },
    ) => {
      try {
        const res =
          await apiUpdateBankAccount(
            id,
            data,
          );

        return res.data.data;
      } catch (err) {
        return handleApiError(
          err,
          rejectWithValue,
        );
      }
    },
  );

/*
=====================================================
Update Bank Account Status
=====================================================

تستخدم لتغيير:
- isActive
- isPublic
- isDefault
=====================================================
*/

export const updateBankAccountStatus =
  createAsyncThunk(
    "bankAccounts/updateStatus",

    async (
      {
        id,
        data,
      },
      {
        rejectWithValue,
      },
    ) => {
      try {
        const res =
          await apiUpdateBankAccountStatus(
            id,
            data,
          );

        return res.data.data;
      } catch (err) {
        return handleApiError(
          err,
          rejectWithValue,
        );
      }
    },
  );

/*
=====================================================
Delete Bank Account
=====================================================
*/

export const deleteBankAccount =
  createAsyncThunk(
    "bankAccounts/delete",

    async (
      id,
      {
        rejectWithValue,
      },
    ) => {
      try {
        await apiDeleteBankAccount(
          id,
        );

        return id;
      } catch (err) {
        return handleApiError(
          err,
          rejectWithValue,
        );
      }
    },
  );

/*
=====================================================
Slice
=====================================================
*/

const bankAccountSlice =
  createSlice({
    name: "bankAccounts",

    initialState: {
      bankAccountsList: [],
      selectedAccount: null,

      loading: false,
      saving: false,

      error: null,

      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    },

    reducers: {
      setPage: (
        state,
        action,
      ) => {
        state.pagination.page =
          action.payload;
      },

      setLimit: (
        state,
        action,
      ) => {
        state.pagination.limit =
          action.payload;

        state.pagination.page = 1;
      },

      clearSelectedBankAccount: (
        state,
      ) => {
        state.selectedAccount = null;
        state.error = null;
      },
    },

    extraReducers: (
      builder,
    ) => {
      builder

        .addCase(
          fetchBankAccountById.pending,
          (state) => {
            state.loading = true;
            state.error = null;
          },
        )

        .addCase(
          fetchBankAccountById.fulfilled,
          (state, action) => {
            state.loading = false;
            state.selectedAccount =
              action.payload;
          },
        )

        .addCase(
          fetchBankAccountById.rejected,
          (state, action) => {
            state.loading = false;
            state.error =
              action.payload;
          },
        )

        /*
        =================================================
        Fetch
        =================================================
        */

        .addCase(
          fetchBankAccounts.pending,

          (state) => {
            state.loading = true;
            state.error = null;
          },
        )

        .addCase(
          fetchBankAccounts.fulfilled,

          (
            state,
            action,
          ) => {
            state.loading = false;

            /*
            لأن apiGetBankAccounts يعيد response.data،
            فـ action.payload سيكون:

            {
              success,
              data,
              pagination
            }
            */

            state.bankAccountsList =
              action.payload?.data ||
              [];

            state.pagination = {
              total:
                action.payload
                  ?.pagination
                  ?.total ||
                0,

              page:
                action.payload
                  ?.pagination
                  ?.page ||
                1,

              limit:
                action.payload
                  ?.pagination
                  ?.limit ||
                10,

              totalPages:
                action.payload
                  ?.pagination
                  ?.pages ||
                action.payload
                  ?.pagination
                  ?.totalPages ||
                0,
            };
          },
        )

        .addCase(
          fetchBankAccounts.rejected,

          (
            state,
            action,
          ) => {
            state.loading = false;

            state.error =
              action.payload;
          },
        )

        /*
        =================================================
        Create
        =================================================
        */

        .addCase(
          createBankAccount.pending,

          (state) => {
            state.loading = true;
            state.saving = true;
            state.error = null;
          },
        )

        .addCase(
          createBankAccount.fulfilled,

          (
            state,
            action,
          ) => {
            state.loading = false;
            state.saving = false;

            if (
              action.payload
            ) {
              /*
              إذا الحساب الجديد أصبح افتراضيًا،
              نلغي الافتراضي محليًا عن الحسابات
              الأخرى لنفس العملة.
              */

              if (
                action.payload
                  .isDefault
              ) {
                state.bankAccountsList =
                  state.bankAccountsList.map(
                    (
                      item,
                    ) =>
                      item.currency ===
                        action.payload
                          .currency
                        ? {
                            ...item,

                            isDefault:
                              false,
                          }
                        : item,
                  );
              }

              state.bankAccountsList.unshift(
                action.payload,
              );
            }
          },
        )

        .addCase(
          createBankAccount.rejected,

          (
            state,
            action,
          ) => {
            state.loading = false;
            state.saving = false;

            state.error =
              action.payload;
          },
        )

        /*
        =================================================
        Update
        =================================================
        */

        .addCase(
          updateBankAccount.pending,

          (state) => {
            state.loading = true;
            state.saving = true;
            state.error = null;
          },
        )

        .addCase(
          updateBankAccount.fulfilled,

          (
            state,
            action,
          ) => {
            state.loading = false;
            state.saving = false;

            const updated =
              action.payload;

            if (
              !updated
            ) {
              return;
            }

            /*
            إذا أصبح الحساب افتراضيًا،
            نلغي الافتراضي عن بقية حسابات
            نفس العملة قبل استبداله.
            */

            if (
              updated.isDefault
            ) {
              state.bankAccountsList =
                state.bankAccountsList.map(
                  (
                    item,
                  ) => {
                    if (
                      item.currency !==
                      updated.currency
                    ) {
                      return item;
                    }

                    return {
                      ...item,

                      isDefault:
                        item._id ===
                        updated._id,
                    };
                  },
                );
            }

            state.bankAccountsList =
              state.bankAccountsList.map(
                (
                  item,
                ) =>
                  item._id ===
                  updated._id
                    ? updated
                    : item,
              );
          },
        )

        .addCase(
          updateBankAccount.rejected,

          (
            state,
            action,
          ) => {
            state.loading = false;
            state.saving = false;

            state.error =
              action.payload;
          },
        )

        /*
        =================================================
        Status Update
        =================================================
        */

        .addCase(
          updateBankAccountStatus.pending,

          (state) => {
            state.loading = true;
            state.error = null;
          },
        )

        .addCase(
          updateBankAccountStatus.fulfilled,

          (
            state,
            action,
          ) => {
            state.loading = false;

            const updated =
              action.payload;

            if (
              !updated
            ) {
              return;
            }

            if (
              updated.isDefault
            ) {
              state.bankAccountsList =
                state.bankAccountsList.map(
                  (
                    item,
                  ) => {
                    if (
                      item.currency !==
                      updated.currency
                    ) {
                      return item;
                    }

                    return {
                      ...item,

                      isDefault:
                        item._id ===
                        updated._id,
                    };
                  },
                );
            }

            state.bankAccountsList =
              state.bankAccountsList.map(
                (
                  item,
                ) =>
                  item._id ===
                  updated._id
                    ? updated
                    : item,
              );
          },
        )

        .addCase(
          updateBankAccountStatus.rejected,

          (
            state,
            action,
          ) => {
            state.loading = false;

            state.error =
              action.payload;
          },
        )

        /*
        =================================================
        Delete
        =================================================
        */

        .addCase(
          deleteBankAccount.pending,

          (state) => {
            state.loading = true;
            state.error = null;
          },
        )

        .addCase(
          deleteBankAccount.fulfilled,

          (
            state,
            action,
          ) => {
            state.loading = false;

            state.bankAccountsList =
              state.bankAccountsList.filter(
                (
                  item,
                ) =>
                  item._id !==
                  action.payload,
              );
          },
        )

        .addCase(
          deleteBankAccount.rejected,

          (
            state,
            action,
          ) => {
            state.loading = false;

            state.error =
              action.payload;
          },
        );
    },
  });

export const {
  setPage,
  setLimit,
  clearSelectedBankAccount,
} = bankAccountSlice.actions;

export default bankAccountSlice.reducer;
