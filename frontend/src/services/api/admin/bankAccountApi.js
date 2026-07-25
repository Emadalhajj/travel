import api from "../api";

const BANK_ACCOUNT_BASE_URL =
  "/bank-accounts";

export const apiGetBankAccounts = (
  params,
) =>
  api.get(
    BANK_ACCOUNT_BASE_URL,
    {
      params,
    },
  );

export const apiCreateBankAccount = (
  payload,
) =>
  api.post(
    BANK_ACCOUNT_BASE_URL,
    payload,
  );

export const apiUpdateBankAccount = (
  id,
  data,
) =>
  api.patch(
    `${BANK_ACCOUNT_BASE_URL}/${id}`,
    data,
  );

export const apiUpdateBankAccountStatus = (
  id,
  data,
) =>
  api.patch(
    `${BANK_ACCOUNT_BASE_URL}/${id}/status`,
    data,
  );

export const apiDeleteBankAccount = (
  id,
) =>
  api.delete(
    `${BANK_ACCOUNT_BASE_URL}/${id}`,
  );

export const apiGetBankAccountById = (
  id,
) =>
  api.get(
    `${BANK_ACCOUNT_BASE_URL}/${id}`,
  );
