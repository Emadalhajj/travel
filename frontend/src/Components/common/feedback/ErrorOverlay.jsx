import { AlertCircle, X } from "lucide-react";

import { useTranslation } from "react-i18next";

function resolveErrorMessage(message) {
  if (!message) {
    return "";
  }

  if (typeof message === "string") {
    return message;
  }

  if (Array.isArray(message)) {
    return message
      .filter(Boolean)
      .map((value) =>
        typeof value === "string" ? value : value?.message || String(value),
      )
      .join("، ");
  }

  if (typeof message === "object") {
    if (typeof message.message === "string") {
      return message.message;
    }

    return Object.values(message.errors || message)
      .filter(Boolean)
      .map((value) =>
        typeof value === "string" ? value : value?.message || String(value),
      )
      .join("، ");
  }

  return String(message);
}

export default function ErrorOverlay({
  show = false,

  message,

  title,

  onDismiss,

  className = "",
}) {
  const { i18n } = useTranslation();

  const isArabic = i18n.language === "ar";

  if (!show || !message) {
    return null;
  }

  const displayMessage = resolveErrorMessage(message);

  if (!displayMessage) {
    return null;
  }

  const displayTitle = title || (isArabic ? "حدث خطأ" : "Something went wrong");

  return (
    <div
      role="alert"
      className={[
        "flex w-full gap-3",

        "rounded-app border border-rose-200",

        "bg-rose-50",

        "p-4",

        "text-rose-800",

        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <AlertCircle
        size={20}
        className="mt-0.5 shrink-0 text-rose-600"
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <p className="m-0 font-semibold">{displayTitle}</p>

        <p className="mb-0 mt-1 break-words text-sm leading-6 text-rose-700">
          {displayMessage}
        </p>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={isArabic ? "إغلاق رسالة الخطأ" : "Dismiss error"}
          className="
            inline-flex
            h-8 w-8
            shrink-0
            items-center
            justify-center

            rounded-button

            text-rose-600

            transition

            hover:bg-rose-100

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-rose-400
          "
        >
          <X size={17} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// import { Alert } from "react-bootstrap";
// import { useTranslation } from "react-i18next";

// export default function ErrorOverlay({ show = false, message }) {
//   const { i18n } = useTranslation();
//   const lang = i18n.language || "ar";

//   if (!show || !message) return null;

//   const displayMessage =
//     typeof message === "string"
//       ? message
//       : Array.isArray(message)
//         ? message
//             .filter(Boolean)
//             .join("، ")
//         : typeof message === "object"
//           ? (typeof message.message === "string"
//             ? message.message
//             : Object.values(message.errors || message)
//               .filter(Boolean)
//               .map((value) =>
//                 typeof value === "string"
//                   ? value
//                   : value?.message ||
//                     String(value),
//               )
//               .join("، "))
//           : String(message);

//   return (
//     <Alert
//       variant="danger"
//       className="mx-auto"
//       style={{ maxWidth: 700 }}
//       role="alert"
//     >
//       <strong>{lang === "ar" ? "خطأ:" : "Error:"}</strong>{" "}
//       {displayMessage}
//     </Alert>
//   );
// }
