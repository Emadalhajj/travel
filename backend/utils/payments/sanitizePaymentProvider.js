/*
4. أداة تنظيف بيانات مزود الدفع

طريقة الاستخدام في Audit Log

خدمة Audit الحالية تحفظ before وafter كما تصل إليها، ولذلك يجب تنظيف بيانات مزود الدفع قبل تمريرها إليها.

*/
/*
=====================================================
Sanitize Payment Provider
=====================================================

يمنع تسريب بيانات مزود الدفع الحساسة.

يستخدم في:
-----------------------------------------------------
- Audit Log
- API Responses
- Entity Details
- Logs
=====================================================
*/

/*
=====================================================
Sensitive Credential Fields
=====================================================
*/

const SENSITIVE_CREDENTIAL_FIELDS =
  new Set([
    "entityId",

    "accessToken",

    "webhookSecret",

    "apiSecret",

    "publishableKey",

    "secretKey",

    "apiKey",

    "merchantId",

    "terminalId",

    "profileId",

    "serverKey",

    "clientKey",
  ]);

/*
=====================================================
Convert To Plain Object
=====================================================

يدعم:
- Mongoose Document
- JavaScript Object
=====================================================
*/

const toPlainObject = (
  provider,
) => {
  if (!provider) {
    return null;
  }

  if (
    typeof provider.toObject ===
    "function"
  ) {
    return provider.toObject({
      virtuals: false,

      getters: false,
    });
  }

  return {
    ...provider,
  };
};

/*
=====================================================
Sanitize Credentials
=====================================================
*/

const sanitizeCredentials = (
  credentials,
  replacement,
) => {
  if (
    !credentials ||
    typeof credentials !==
      "object"
  ) {
    return {};
  }

  return Object.entries(
    credentials,
  ).reduce(
    (
      sanitized,
      [key, value],
    ) => {
      /*
      إذا كان الحقل حساسًا ولا يحتوي قيمة
      لا نضيفه إلى النتيجة.
      */

      if (
        SENSITIVE_CREDENTIAL_FIELDS.has(
          key,
        )
      ) {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          sanitized[key] =
            replacement;
        }

        return sanitized;
      }

      sanitized[key] =
        value;

      return sanitized;
    },
    {},
  );
};

/*
=====================================================
Credential Configuration Status
=====================================================

بدل إرسال قيمة الاعتماد، نرسل فقط هل تم إعدادها أم لا.
=====================================================
*/

const buildCredentialStatus = (
  credentials,
) => {
  if (
    !credentials ||
    typeof credentials !==
      "object"
  ) {
    return {};
  }

  return Object.entries(
    credentials,
  ).reduce(
    (
      result,
      [key, value],
    ) => {
      if (
        !SENSITIVE_CREDENTIAL_FIELDS.has(
          key,
        )
      ) {
        return result;
      }

      result[key] =
        Boolean(
          value !== undefined &&
            value !== null &&
            String(value).trim() !==
              "",
        );

      return result;
    },
    {},
  );
};

/*
=====================================================
Sanitize For API
=====================================================

يستخدم قبل إعادة البيانات إلى Frontend.

يعرض أن الحقل موجود دون إظهار القيمة الحقيقية.
=====================================================
*/

export const sanitizePaymentProviderForApi =
  (
    provider,
  ) => {
    const plainProvider =
      toPlainObject(provider);

    if (!plainProvider) {
      return null;
    }

    return {
      ...plainProvider,

      credentials:
        sanitizeCredentials(
          plainProvider.credentials,

          "********",
        ),

      credentialStatus:
        buildCredentialStatus(
          plainProvider.credentials,
        ),
    };
  };

/*
=====================================================
Sanitize For Audit
=====================================================

يستخدم قبل كتابة before وafter داخل Audit Log.
=====================================================
*/

export const sanitizePaymentProviderForAudit =
  (
    provider,
  ) => {
    const plainProvider =
      toPlainObject(provider);

    if (!plainProvider) {
      return null;
    }

    return {
      ...plainProvider,

      credentials:
        sanitizeCredentials(
          plainProvider.credentials,

          "[REDACTED]",
        ),
    };
  };
