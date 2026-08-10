/*
=========================================================
Public Payment Result Page
=========================================================

وجود العميل في هذه الصفحة لا يعني نجاح الدفع.

يجب دائمًا:
---------------------------------------------------------
1- قراءة PaymentTransaction ID.
2- طلب الحالة من Backend.
3- الاستمرار في التحقق للحالات غير النهائية.
4- الانتقال للحجز فقط بعد SUCCESS ووجود bookingId.
=========================================================
*/

import {
  useEffect,
} from "react";

import {
  Alert,
  Button,
  Spinner,
} from "react-bootstrap";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  useTranslation,
} from "react-i18next";

import {
  fetchPaymentStatus,
} from "../../../redux/public/publicPaymentSlice";

import BookingProgressTimeline, {
  bookingSteps,
} from "../../../Components/shared/booking/BookingProgressTimeline";

/*
=========================================================
Transaction Status Groups
=========================================================
*/

/*
الحالات التي تتغير آليًا خلال ثوانٍ، مثل رجوع مزود الدفع
أو وصول Webhook. حالات التحويل البنكي لا توضع هنا لأنها
تنتظر مراجعة بشرية، ويكفي طلب واحد عند فتح الصفحة.
*/
const POLLING_STATUSES =
  new Set([
    "INITIATED",
    "PENDING",
    "PROCESSING",
    "CAPTURED",
    "PAID_PENDING_BOOKING",
  ]);

const FAILED_STATUSES =
  new Set([
    "FAILED",
    "REJECTED",
    "CANCELED",
    "CANCELLED",
    "EXPIRED",
  ]);

const SUCCESS_STATUSES =
  new Set([
    "SUCCESS",

    /*
    توافق مؤقت مع المعاملات القديمة.
    */
    "PAID",
    "PAID_PENDING_BOOKING",
  ]);

const getErrorMessage = (
  error,
  fallback,
) => {
  if (
    typeof error ===
    "string"
  ) {
    return error;
  }

  return (
    error?.message ||
    fallback
  );
};

export default function PublicPaymentResultPage() {
  const {
    draftId,
  } = useParams();

  const [
    searchParams,
  ] = useSearchParams();

  const dispatch =
    useDispatch();

  const navigate =
    useNavigate();

  const {
    i18n,
  } = useTranslation();

  const isArabic =
    i18n.language ===
    "ar";

  /*
  المرجع الأساسي هو معرف PaymentTransaction.

  reference قد يبقى مؤقتًا للتوافق فقط، لكنه لا يصلح
  بديلًا إذا كان يحتوي merchantTransactionId.
  */

  const transactionId =
    searchParams.get(
      "transactionId",
    );

  const {
    statusLoading,
    paymentStatus,
    statusError,
  } = useSelector(
    (
      state,
    ) =>
      state.publicPayment ||
      {},
  );

  const normalizedStatus =
    String(
      paymentStatus?.status ||
      "",
    ).toUpperCase();

  const isBankTransferSubmitted =
    paymentStatus?.paymentMethodCode === "BANK_TRANSFER" &&
    ["PENDING_VERIFICATION", "PENDING_REVIEW"].includes(normalizedStatus);

  const bankTransferSubmittedSteps = bookingSteps.map((step) =>
    step.key === "success"
      ? {
          ...step,
          labelAr: "تم التحويل",
          labelEn: "Transfer submitted",
        }
      : step,
  );

  /*
  =======================================================
  Fetch And Poll Payment Status
  =======================================================

  يتم الطلب مباشرة، ثم تكراره كل 3 ثوانٍ طالما
  أن المعاملة في حالة غير نهائية.

  Backend هو المصدر الوحيد للحقيقة.
  =======================================================
  */

  useEffect(() => {
    if (!transactionId) {
      return undefined;
    }

    let isActive = true;

    let pollingTimer =
      null;

    const checkStatus =
      async () => {
        try {
          const response =
            await dispatch(
              fetchPaymentStatus(
                transactionId,
              ),
            ).unwrap();

          if (!isActive) {
            return;
          }

          const transaction =
            response?.data ||
            response;

          const status =
            String(
              transaction?.status ||
              "",
            ).toUpperCase();

          /*
          نستمر في الاستعلام فقط للحالات التي قد تتغير.
          */

          if (
            POLLING_STATUSES.has(
              status,
            )
          ) {
            pollingTimer =
              window.setTimeout(
                checkStatus,
                3000,
              );
          }
        } catch {
          /*
          الخطأ محفوظ داخل Redux بواسطة rejected case.

          لا نستمر في Polling عند فشل الطلب حتى لا
          نرسل طلبات متكررة إلى Backend.
          */
        }
      };

    checkStatus();

    return () => {
      isActive = false;

      if (pollingTimer) {
        window.clearTimeout(
          pollingTimer,
        );
      }
    };
  }, [
    dispatch,
    transactionId,
  ]);

  /*
  =======================================================
  Missing Transaction ID
  =======================================================
  */

  if (!transactionId) {
    return (
      <div className="container py-5">
        <Alert variant="danger">
          {isArabic
            ? "تعذر تحديد معاملة الدفع"
            : "Unable to identify the payment transaction"}
        </Alert>

        <Button
          onClick={() =>
            navigate(
              `/booking/payment/${draftId}`,
            )
          }
        >
          {isArabic
            ? "العودة إلى الدفع"
            : "Back to payment"}
        </Button>
      </div>
    );
  }

  /*
  =======================================================
  Initial Loading
  =======================================================

  لا نغطي الصفحة بالتحميل عند كل Polling إذا كانت لدينا
  بيانات سابقة للمعاملة.
  =======================================================
  */

  if (
    statusLoading &&
    !paymentStatus
  ) {
    return (
      <div className="container py-5 text-center">
        <Spinner
          animation="border"
          role="status"
        />

        <div className="mt-3">
          {isArabic
            ? "جارٍ التحقق من حالة الدفع..."
            : "Checking payment status..."}
        </div>
      </div>
    );
  }

  /*
  =======================================================
  Request Error
  =======================================================
  */

  if (statusError) {
    return (
      <div className="container py-5">
        <Alert variant="danger">
          {getErrorMessage(
            statusError,
            isArabic
              ? "تعذر التحقق من حالة الدفع"
              : "Unable to check payment status",
          )}
        </Alert>

        <div className="d-flex gap-2">
          <Button
            onClick={() =>
              dispatch(
                fetchPaymentStatus(
                  transactionId,
                ),
              )
            }
          >
            {isArabic
              ? "إعادة التحقق"
              : "Check again"}
          </Button>

          <Button
            variant="outline-secondary"
            onClick={() =>
              navigate(
                `/booking/payment/${draftId}`,
              )
            }
          >
            {isArabic
              ? "العودة إلى الدفع"
              : "Back to payment"}
          </Button>
        </div>
      </div>
    );
  }

  /*
  =======================================================
  Bank Transfer Proof Submitted
  =======================================================

  الوصول لهذه المرحلة يعني استلام إثبات التحويل ووضعه
  في المراجعة، وليس اعتماد المبلغ ماليًا قبل مراجعة الإدارة.
  =======================================================
  */

  if (isBankTransferSubmitted) {
    return (
      <div className="container py-5" dir={isArabic ? "rtl" : "ltr"}>
        <BookingProgressTimeline
          currentStep="success"
          isArabic={isArabic}
          steps={bankTransferSubmittedSteps}
        />

        <Alert variant="success">
          <div className="fw-bold">
            {isArabic
              ? "تم إرسال التحويل للمراجعة"
              : "The transfer was submitted for review"}
          </div>

          <div className="mt-2">
            {isArabic
              ? "استلمنا بيانات الحوالة وإثبات الدفع، وسيتم تأكيد الحجز بعد اعتماد التحويل من الإدارة."
              : "We received the transfer details and proof. The booking will be confirmed after administrative review."}
          </div>
        </Alert>

        <div className="text-muted mb-3">
          {isArabic ? "الحالة الحالية:" : "Current status:"}{" "}
          <strong>{normalizedStatus}</strong>
        </div>

        <Button
          variant="outline-primary"
          onClick={() => navigate(`/draft-booking/${draftId}`)}
        >
          {isArabic ? "عرض بيانات المسودة" : "View draft details"}
        </Button>
      </div>
    );
  }

  /*
  =======================================================
  Success
  =======================================================
  */

  if (
    SUCCESS_STATUSES.has(
      normalizedStatus,
    )
  ) {
    /*
    ربما نجح الدفع لكن تحويل المسودة إلى حجز ما زال
    قيد التنفيذ.
    */

    if (
      !paymentStatus?.bookingId
    ) {
      return (
        <div className="container py-5">
          <Alert variant="info">
            {isArabic
              ? "تم تأكيد الدفع، ويجري الآن إنشاء الحجز."
              : "Payment is confirmed and the booking is being created."}
          </Alert>

          <div className="text-muted">
            {isArabic
              ? "سيتم تحديث الحالة تلقائيًا."
              : "The status will update automatically."}
          </div>
        </div>
      );
    }

    return (
      <div className="container py-5">
        <Alert variant="success">
          {isArabic
            ? "تم الدفع بنجاح"
            : "Payment completed successfully"}
        </Alert>

        <Button
          onClick={() =>
            navigate(
              `/booking/${paymentStatus.bookingId}`,
              {
                replace: true,
              },
            )
          }
        >
          {isArabic
            ? "عرض الحجز"
            : "View booking"}
        </Button>
      </div>
    );
  }

  /*
  =======================================================
  Failed Or Canceled
  =======================================================
  */

  if (
    FAILED_STATUSES.has(
      normalizedStatus,
    )
  ) {
    return (
      <div className="container py-5">
        <Alert variant="danger">
          <div>
            {isArabic
              ? "لم تكتمل عملية الدفع"
              : "Payment was not completed"}
          </div>

          {paymentStatus?.failureMessage && (
            <div className="mt-2">
              {
                paymentStatus.failureMessage
              }
            </div>
          )}
        </Alert>

        <Button
          onClick={() =>
            navigate(
              `/booking/payment/${draftId}`,
              {
                replace: true,
              },
            )
          }
        >
          {isArabic
            ? "إعادة المحاولة"
            : "Try again"}
        </Button>
      </div>
    );
  }

  /*
  =======================================================
  Processing
  =======================================================
  */

  return (
    <div className="container py-5">
      <Alert variant="warning">
        <div className="d-flex align-items-center gap-2">
          {statusLoading && (
            <Spinner
              animation="border"
              size="sm"
            />
          )}

          <span>
            {isArabic
              ? "عملية الدفع قيد التحقق أو المعالجة"
              : "Payment is being verified or processed"}
          </span>
        </div>
      </Alert>

      {normalizedStatus && (
        <div className="text-muted">
          {isArabic
            ? "الحالة الحالية:"
            : "Current status:"}{" "}
          <strong>
            {normalizedStatus}
          </strong>
        </div>
      )}
    </div>
  );
}
