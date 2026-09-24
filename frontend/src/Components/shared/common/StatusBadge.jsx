const TONE_CLASSES = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",

  warning: "border-amber-200 bg-amber-50 text-amber-700",

  success: "border-emerald-200 bg-emerald-50 text-emerald-700",

  info: "border-blue-200 bg-blue-50 text-blue-700",

  danger: "border-rose-200 bg-rose-50 text-rose-700",

  violet: "border-violet-200 bg-violet-50 text-violet-700",

  orange: "border-orange-200 bg-orange-50 text-orange-700",
};

const STATUS_TONES = {
  /* General */
  active: "success",
  inactive: "neutral",

  /* Draft / workflow */
  draft: "neutral",
  initiated: "neutral",
  pending: "warning",
  pending_proof: "warning",
  pending_approval: "warning",
  pending_review: "warning",
  pending_verification: "warning",
  processing: "info",

  /* Positive */
  confirmed: "success",
  scheduled: "info",
  authorized: "info",
  completed: "success",

  /* Negative */
  cancelled: "danger",
  failed: "danger",
  sold_out: "danger",

  /* Payment */
  paid: "success",
  success: "success",
  captured: "success",
  paid_pending_booking: "info",
  partial: "info",
  rejected: "danger",
  refunded: "violet",
  partially_refunded: "violet",

  /* Time */
  expired: "orange",
};

const LABELS = {
  general: {
    active: {
      ar: "نشط",
      en: "Active",
    },

    inactive: {
      ar: "غير نشط",
      en: "Inactive",
    },
  },

  booking: {
    draft: {
      ar: "مسودة",
      en: "Draft",
    },

    pending: {
      ar: "قيد الانتظار",
      en: "Pending",
    },

    pending_review: {
      ar: "بانتظار المراجعة",
      en: "Pending Review",
    },

    confirmed: {
      ar: "مؤكد",
      en: "Confirmed",
    },

    completed: {
      ar: "مكتمل",
      en: "Completed",
    },

    cancelled: {
      ar: "ملغي",
      en: "Cancelled",
    },

    expired: {
      ar: "منتهي",
      en: "Expired",
    },
  },

  payment: {
    initiated: {
      ar: "بدأت العملية",
      en: "Initiated",
    },

    pending: {
      ar: "بانتظار الدفع",
      en: "Pending",
    },

    pending_approval: {
      ar: "بانتظار الموافقة",
      en: "Pending Approval",
    },

    pending_review: {
      ar: "بانتظار المراجعة",
      en: "Pending Review",
    },

    pending_verification: {
      ar: "بانتظار التحقق",
      en: "Pending Verification",
    },

    pending_proof: {
      ar: "بانتظار إثبات الدفع",
      en: "Pending Proof",
    },

    processing: {
      ar: "قيد المعالجة",
      en: "Processing",
    },

    authorized: {
      ar: "مصرح بها",
      en: "Authorized",
    },

    partial: {
      ar: "مدفوع جزئيًا",
      en: "Partially Paid",
    },

    paid: {
      ar: "مدفوع",
      en: "Paid",
    },

    success: {
      ar: "ناجحة",
      en: "Success",
    },

    captured: {
      ar: "تم التحصيل",
      en: "Captured",
    },

    paid_pending_booking: {
      ar: "مدفوع بانتظار الحجز",
      en: "Paid, pending booking",
    },

    failed: {
      ar: "فشل الدفع",
      en: "Failed",
    },

    rejected: {
      ar: "مرفوضة",
      en: "Rejected",
    },

    refunded: {
      ar: "مسترد",
      en: "Refunded",
    },

    partially_refunded: {
      ar: "مسترد جزئيًا",
      en: "Partially Refunded",
    },

    cancelled: {
      ar: "ملغاة",
      en: "Cancelled",
    },

    expired: {
      ar: "منتهية",
      en: "Expired",
    },
  },

  user: {
    active: {
      ar: "نشط",
      en: "Active",
    },

    inactive: {
      ar: "معطل",
      en: "Inactive",
    },
  },

  program: {
    draft: {
      ar: "مسودة",
      en: "Draft",
    },

    active: {
      ar: "نشط",
      en: "Active",
    },

    inactive: {
      ar: "غير نشط",
      en: "Inactive",
    },

    sold_out: {
      ar: "مكتمل العدد",
      en: "Sold Out",
    },

    expired: {
      ar: "منتهي",
      en: "Expired",
    },
  },

  departure: {
    draft: {
      ar: "مسودة",
      en: "Draft",
    },

    scheduled: {
      ar: "مجدولة",
      en: "Scheduled",
    },

    cancelled: {
      ar: "ملغاة",
      en: "Cancelled",
    },

    completed: {
      ar: "مكتملة",
      en: "Completed",
    },
  },
};

export default function StatusBadge({
  value,
  type = "booking",
  isArabic = true,
  label,
  tone,
  className = "",
}) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();

  const resolvedTone = tone || STATUS_TONES[normalizedValue] || "neutral";

  const resolvedClasses = TONE_CLASSES[resolvedTone] || TONE_CLASSES.neutral;

  const statusLabel =
    LABELS[type]?.[normalizedValue] || LABELS.general[normalizedValue];

  const resolvedLabel =
    label ||
    (statusLabel ? (isArabic ? statusLabel.ar : statusLabel.en) : value) ||
    "-";

  return (
    <span
      className={[
        "inline-flex items-center justify-center",

        "max-w-full whitespace-nowrap overflow-hidden text-ellipsis",

        "rounded-full border",

        "px-2.5 py-1",

        "text-xs font-semibold",

        resolvedClasses,

        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {resolvedLabel}
    </span>
  );
}

// export default function StatusBadge({
//   value,
//   type = "booking",
//   isArabic = true,
// }) {
//   const bookingClasses = {
//     draft: "bg-slate-100 text-slate-700",
//     pending_review: "bg-amber-100 text-amber-800",
//     pending: "bg-amber-100 text-amber-700",
//     confirmed: "bg-emerald-100 text-emerald-700",
//     completed: "bg-blue-100 text-blue-700",
//     cancelled: "bg-red-100 text-red-700",
//   };

//   const paymentClasses = {
//     pending: "bg-amber-100 text-amber-700",
//     partial: "bg-blue-100 text-blue-700",
//     paid: "bg-emerald-100 text-emerald-700",
//     failed: "bg-red-100 text-red-700",
//     refunded: "bg-slate-100 text-slate-700",
//   };

//   const userClasses = {
//     active: "bg-emerald-100 text-emerald-700",
//     inactive: "bg-red-100 text-red-700",
//   };

//   const programClasses = {
//     draft: "bg-amber-100 text-amber-800",
//     active: "bg-emerald-100 text-emerald-700",
//     inactive: "bg-slate-100 text-slate-700",
//     sold_out: "bg-red-100 text-red-700",
//     expired: "bg-slate-200 text-slate-800",
//   };

//   const departureClasses = {
//     draft: "bg-slate-100 text-slate-700",
//     scheduled: "bg-emerald-100 text-emerald-700",
//     cancelled: "bg-red-100 text-red-700",
//     completed: "bg-blue-100 text-blue-700",
//   };

//   const normalizedValue = String(value || "").toLowerCase();

//   const classes =
//     type === "payment"
//       ? paymentClasses[normalizedValue]
//       : type === "departure"
//         ? departureClasses[normalizedValue]
//         : type === "program"
//           ? programClasses[normalizedValue]
//           : type === "user"
//             ? userClasses[normalizedValue]
//             : bookingClasses[normalizedValue];

//   const bookingLabels = {
//     draft: isArabic ? "مسودة" : "Draft",
//     pending_review: isArabic ? "بانتظار المراجعة" : "Pending Review",
//     confirmed: isArabic ? "مؤكد" : "Confirmed",
//     completed: isArabic ? "مكتمل" : "Completed",
//     cancelled: isArabic ? "ملغي" : "Cancelled",
//   };

//   const userLabels = {
//     active: isArabic ? "نشط" : "Active",
//     inactive: isArabic ? "معطل" : "Inactive",
//   };

//   const programLabels = {
//     draft: isArabic ? "مسودة" : "Draft",
//     active: isArabic ? "نشط" : "Active",
//     inactive: isArabic ? "غير نشط" : "Inactive",
//     sold_out: isArabic ? "مكتمل العدد" : "Sold out",
//     expired: isArabic ? "منتهي" : "Expired",
//   };

//   const departureLabels = {
//     draft: isArabic ? "مسودة" : "Draft",
//     scheduled: isArabic ? "مجدولة" : "Scheduled",
//     cancelled: isArabic ? "ملغاة" : "Cancelled",
//     completed: isArabic ? "مكتملة" : "Completed",
//   };

//   const label =
//     type === "booking"
//       ? bookingLabels[normalizedValue] || value
//       : type === "departure"
//         ? departureLabels[normalizedValue] || value
//         : type === "program"
//           ? programLabels[normalizedValue] || value
//           : type === "user"
//             ? userLabels[normalizedValue] || value
//             : value;

//   return (
//     <span
//       className={`rounded-full px-3 py-1 text-xs font-bold ${
//         classes || "bg-slate-100 text-slate-700"
//       }`}
//     >
//       {label || "-"}
//     </span>
//   );
// }
