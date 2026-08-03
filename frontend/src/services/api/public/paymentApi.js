import api from "../api";

/*
=========================================================
Public Payment API
=========================================================

التدفق الموحد فقط:
- initialize
- status
- bank-transfer proof

تم حذف تدفق التفويض القديم بعد نقل الصفحات إلى
initializePublicPayment.
=========================================================
*/

const PUBLIC_PAYMENT_BASE_URL =
  "/public/payments";

export const apiInitializePublicPayment = async (
  payload,
) => {
  const response = await api.post(
    `${PUBLIC_PAYMENT_BASE_URL}/initialize`,
    payload,
  );
  return response.data;
};

export const apiGetPaymentStatus = async (
  transactionId,
) => {
  if (!transactionId) {
    throw new Error(
      "Payment transaction ID is required",
    );
  }

  const response = await api.get(
    `${PUBLIC_PAYMENT_BASE_URL}/${transactionId}/status`,
  );
  return response.data;
};

export const apiSubmitBankTransferProof = async ({
  transactionId,
  transferReference,
  proofAttachments,
}) => {
  if (!transactionId) {
    throw new Error(
      "Payment transaction ID is required",
    );
  }

  const formData = new FormData();

  if (transferReference) {
    formData.append(
      "transferReference",
      transferReference,
    );
  }

  (proofAttachments || []).forEach((file) => {
    formData.append(
      "proofAttachments",
      file,
    );
  });

  const response = await api.post(
    `${PUBLIC_PAYMENT_BASE_URL}/bank-transfer/${transactionId}/proof`,
    formData,
  );

  return response.data;
};
