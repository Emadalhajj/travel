import AppError from "../../utils/AppError.js";
import { hyperpayConfig } from "../../config/hyperpay.js";

const HYPERPAY_TIMEOUT_MS = Math.max(
  1000,
  Number(process.env.HYPERPAY_TIMEOUT_MS) || 15000,
);

const fetchHyperPay = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HYPERPAY_TIMEOUT_MS);
  timeout.unref?.();

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new AppError("انتهت مهلة الاتصال بمزود HyperPay", 504, "hyperpay");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const parseHyperPayResponse = async (response) => {
  if (typeof response?.text !== "function") {
    if (typeof response?.json === "function") {
      return response.json();
    }

    throw new AppError(
      "تعذر قراءة استجابة مزود الدفع",
      502,
      "hyperpay",
    );
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    throw new AppError(
      "مزود الدفع أعاد استجابة فارغة",
      502,
      "hyperpay",
    );
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new AppError(
      "استجابة مزود الدفع غير صالحة. تحقق من عنوان HyperPay وإعدادات البيئة",
      502,
      "hyperpay",
    );
  }
};

const getHyperPayErrorMessage = (
  data,
  fallback,
) => {
  const providerMessage = String(
    data?.result?.description ||
      data?.message ||
      "",
  ).trim();

  if (
    /invalid authentication|authentication information|unauthori[sz]ed/i.test(
      providerMessage,
    )
  ) {
    return "بيانات اعتماد HyperPay غير صحيحة أو لا تتوافق مع البيئة المحددة. تحقق من Entity ID وAccess Token";
  }

  return providerMessage || fallback;
};

export const createHyperPayCheckout = async ({
  amount,
  currency = "SAR",
  paymentMethodCode,
  merchantTransactionId,
  customer = {},
  draftId,
  paymentConfigurationId,
  returnUrl,
  providerConfig = {},
}) => {
  /*
  الأولوية:
  1- إعدادات المزود القادمة من قاعدة البيانات.
  2- إعدادات config/.env الحالية كـ fallback.
  */

  const entityId =
    providerConfig.entityId ||
    providerConfig.credentials?.entityId ||
    hyperpayConfig.entityId;

  const accessToken =
    providerConfig.accessToken ||
    providerConfig.credentials?.accessToken ||
    hyperpayConfig.accessToken;

  const baseUrl =
    providerConfig.baseUrl ||
    providerConfig.configuration?.baseUrl ||
    hyperpayConfig.baseUrl;

  const frontendUrl = (
    providerConfig.frontendUrl ||
    providerConfig.configuration?.frontendUrl ||
    hyperpayConfig.frontendUrl ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  if (!entityId || !accessToken) {
    throw new AppError(
      "HyperPay credentials are missing",
      500,
      "hyperpay",
    );
  }

  if (!baseUrl) {
    throw new AppError(
      "HyperPay base URL is missing",
      500,
      "hyperpay",
    );
  }

  const url = `${baseUrl}/v1/checkouts`;

  const params = new URLSearchParams();

  params.append("entityId", entityId);
  params.append(
    "amount",
    Number(amount).toFixed(2),
  );
  params.append("currency", currency);
  // نفصل التفويض عن التحصيل: نجاح Checkout يعني PA فقط.
  params.append("paymentType", "PA");

  params.append(
    "merchantTransactionId",
    merchantTransactionId,
  );

  params.append(
    "shopperResultUrl",
    returnUrl ||
      `${frontendUrl}/booking/payment/${draftId}/result` +
        `?reference=${encodeURIComponent(
          merchantTransactionId,
        )}`,
  );

  if (customer.email) {
    params.append(
      "customer.email",
      customer.email,
    );
  }

  const customerName =
    customer.name ||
    [
      customer.firstName,
      customer.lastName,
    ]
      .filter(Boolean)
      .join(" ");

  if (customerName) {
    params.append(
      "customer.givenName",
      customerName,
    );
  }

  const response = await fetchHyperPay(url, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type":
        "application/x-www-form-urlencoded",
    },

    body: params.toString(),
  });

  const data = await parseHyperPayResponse(response);

  if (!response.ok || !data?.id) {
    throw new AppError(
      getHyperPayErrorMessage(
        data,
        "تعذر إنشاء جلسة الدفع لدى HyperPay",
      ),
      400,
      "hyperpay",
    );
  }

  return data;
};

/*
=====================================================
HyperPay Result Classification
=====================================================

تصنيف Result Code القادم من HyperPay.
لا نثق في status مرسل من Frontend أو Callback Body.
=====================================================
*/

const HYPERPAY_SUCCESS_CODE_PATTERNS = [
  /^(000\.000\.)/,
  /^(000\.100\.1)/,
  /^(000\.[36])/,
];

const HYPERPAY_PENDING_CODE_PATTERNS = [
  /^(000\.200)/,
  /^(800\.400\.5)/,
  /^(100\.400\.500)/,
];

export const classifyHyperPayResultCode = (
  resultCode = "",
) => {
  const normalizedCode = String(
    resultCode || "",
  ).trim();

  if (
    HYPERPAY_SUCCESS_CODE_PATTERNS.some(
      (pattern) => pattern.test(normalizedCode),
    )
  ) {
    return "SUCCESS";
  }

  if (
    HYPERPAY_PENDING_CODE_PATTERNS.some(
      (pattern) => pattern.test(normalizedCode),
    )
  ) {
    return "PENDING";
  }

  return "FAILED";
};

/*
=====================================================
Verify HyperPay Payment
=====================================================

تنفذ طلب Server-to-Server إلى HyperPay للتحقق من
النتيجة الفعلية باستخدام checkoutId أو resourcePath.

لا تعيد Raw Payload إلى Controller، بل نتيجة منقحة.
=====================================================
*/

export const verifyHyperPayPayment = async ({
  checkoutId,
  resourcePath = "",
  providerConfig = {},
}) => {
  const entityId =
    providerConfig.entityId ||
    providerConfig.credentials?.entityId ||
    hyperpayConfig.entityId;

  const accessToken =
    providerConfig.accessToken ||
    providerConfig.credentials?.accessToken ||
    hyperpayConfig.accessToken;

  const baseUrl =
    providerConfig.baseUrl ||
    providerConfig.configuration?.baseUrl ||
    hyperpayConfig.baseUrl;

  if (!entityId || !accessToken || !baseUrl) {
    throw new AppError(
      "HyperPay verification configuration is missing",
      500,
      "hyperpay",
    );
  }

  const normalizedBaseUrl = String(baseUrl)
    .replace(/\/+$/, "");

  let statusUrl;

  if (resourcePath) {
    const safeResourcePath = String(resourcePath)
      .trim();

    let baseUrlObject;
    let statusUrlObject;

    try {
      baseUrlObject = new URL(
        normalizedBaseUrl,
      );
      statusUrlObject = new URL(
        safeResourcePath,
        `${normalizedBaseUrl}/`,
      );
    } catch {
      throw new AppError(
        "HyperPay resourcePath is invalid",
        400,
        "resourcePath",
      );
    }

    /*
    لا نرسل Access Token إلى نطاق قادم من الطلب.
    يجب أن يبقى resourcePath داخل نفس HyperPay origin.
    */
    if (
      statusUrlObject.origin !==
      baseUrlObject.origin
    ) {
      throw new AppError(
        "HyperPay resourcePath origin is not allowed",
        400,
        "resourcePath",
      );
    }

    statusUrl =
      statusUrlObject.toString();
  } else {
    if (!checkoutId) {
      throw new AppError(
        "HyperPay checkoutId is required",
        400,
        "checkoutId",
      );
    }

    statusUrl =
      `${normalizedBaseUrl}/v1/checkouts/` +
      `${encodeURIComponent(checkoutId)}/payment`;
  }

  const separator = statusUrl.includes("?")
    ? "&"
    : "?";

  const response = await fetchHyperPay(
    `${statusUrl}${separator}entityId=${encodeURIComponent(
      entityId,
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  );

  const data = await parseHyperPayResponse(response);

  if (!response.ok) {
    throw new AppError(
      getHyperPayErrorMessage(
        data,
        "تعذر التحقق من عملية الدفع لدى HyperPay",
      ),
      response.status >= 500 ? 502 : 400,
      "hyperpay",
    );
  }

  const resultCode =
    data?.result?.code || "";

  return {
    verificationStatus:
      classifyHyperPayResultCode(
        resultCode,
      ),
    resultCode,
    resultDescription:
      data?.result?.description || "",
    providerReference:
      data?.id || "",
    merchantTransactionId:
      data?.merchantTransactionId || "",
    paymentType:
      data?.paymentType || "",
    amount:
      data?.amount || "",
    currency:
      data?.currency || "",
    paymentBrand:
      data?.paymentBrand || "",
  };
};

const resolveHyperPayCredentials = (providerConfig = {}) => ({
  entityId:
    providerConfig.entityId ||
    providerConfig.credentials?.entityId ||
    hyperpayConfig.entityId,
  accessToken:
    providerConfig.accessToken ||
    providerConfig.credentials?.accessToken ||
    hyperpayConfig.accessToken,
  baseUrl: String(
    providerConfig.baseUrl ||
      providerConfig.configuration?.baseUrl ||
      hyperpayConfig.baseUrl ||
      "",
  ).replace(/\/+$/, ""),
});

const executeHyperPayReferencedPayment = async ({
  referencedPaymentId,
  paymentType,
  amount,
  currency,
  providerConfig = {},
}) => {
  const { entityId, accessToken, baseUrl } =
    resolveHyperPayCredentials(providerConfig);

  if (!entityId || !accessToken || !baseUrl) {
    throw new AppError(
      "HyperPay operation configuration is missing",
      500,
      "hyperpay",
    );
  }

  if (!referencedPaymentId) {
    throw new AppError(
      "HyperPay referenced payment ID is required",
      400,
      "providerReference",
    );
  }

  const params = new URLSearchParams();
  params.append("entityId", entityId);
  params.append("paymentType", paymentType);

  if (amount !== undefined && amount !== null) {
    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new AppError("Invalid payment amount", 400, "amount");
    }
    params.append("amount", normalizedAmount.toFixed(2));
  }

  if (currency) {
    params.append("currency", String(currency).toUpperCase());
  }

  const response = await fetchHyperPay(
    `${baseUrl}/v1/payments/${encodeURIComponent(referencedPaymentId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    },
  );

  const data = await parseHyperPayResponse(response);
  const resultCode = data?.result?.code || "";
  const operationStatus = classifyHyperPayResultCode(resultCode);

  if (!response.ok || operationStatus !== "SUCCESS") {
    throw new AppError(
      getHyperPayErrorMessage(
        data,
        `تعذر تنفيذ عملية ${paymentType} لدى HyperPay`,
      ),
      response.status >= 500 ? 502 : 409,
      "providerOperation",
    );
  }

  // لا نعيد Raw Payload إلى طبقات النظام الأعلى.
  return {
    operationStatus,
    resultCode,
    resultDescription: data?.result?.description || "",
    providerReference: data?.id || "",
    referencedPaymentId,
    paymentType: data?.paymentType || paymentType,
    amount: data?.amount || amount || "",
    currency: data?.currency || currency || "",
    timestamp: data?.timestamp || null,
  };
};

export const captureHyperPayPayment = (payload) =>
  executeHyperPayReferencedPayment({ ...payload, paymentType: "CP" });

export const refundHyperPayPayment = (payload) =>
  executeHyperPayReferencedPayment({ ...payload, paymentType: "RF" });

export const cancelHyperPayPayment = (payload) =>
  executeHyperPayReferencedPayment({ ...payload, paymentType: "RV" });
