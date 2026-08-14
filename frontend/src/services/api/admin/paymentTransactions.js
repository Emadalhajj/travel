import api from "../api";

const BASE_URL = "/payment-transactions";

export const apiGetPaymentTransactions = async (
  params = {},
) => {
  const response = await api.get(BASE_URL, {
    params,
  });
  return response.data;
};

export const apiGetPaymentTransactionDetails = async (
  transactionId,
) => {
  const response = await api.get(
    `${BASE_URL}/${transactionId}`,
  );
  return response.data;
};

export const apiApproveBankTransfer = async ({
  transactionId,
  notes = "",
}) => {
  const response = await api.patch(
    `${BASE_URL}/${transactionId}/bank-transfer/approve`,
    { notes },
  );
  return response.data;
};

export const apiRejectBankTransfer = async ({
  transactionId,
  reason,
}) => {
  const response = await api.patch(
    `${BASE_URL}/${transactionId}/bank-transfer/reject`,
    { reason },
  );
  return response.data;
};

export const apiCapturePaymentTransaction = async ({
  transactionId,
  notes = "",
}) => {
  const response = await api.patch(
    `${BASE_URL}/${transactionId}/capture`,
    { notes },
  );
  return response.data;
};

export const apiVerifyProviderPaymentTransaction = async ({
  transactionId,
}) => {
  const response = await api.post(
    "/payment/callback",
    { transactionId },
  );

  return response.data;
};

export const apiRefundPaymentTransaction = async ({
  transactionId,
  reason,
}) => {
  const response = await api.patch(
    `${BASE_URL}/${transactionId}/refund`,
    { reason },
  );
  return response.data;
};

export const apiCancelPaymentTransaction = async ({
  transactionId,
  reason,
}) => {
  const response = await api.patch(
    `${BASE_URL}/${transactionId}/cancel`,
    { reason },
  );
  return response.data;
};
