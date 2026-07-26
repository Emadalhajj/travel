import { Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function ErrorOverlay({ show = false, message }) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";

  if (!show || !message) return null;

  const displayMessage =
    typeof message === "string"
      ? message
      : Array.isArray(message)
        ? message
            .filter(Boolean)
            .join("، ")
        : typeof message === "object"
          ? Object.values(message)
              .filter(Boolean)
              .map((value) =>
                typeof value === "string"
                  ? value
                  : value?.message ||
                    String(value),
              )
              .join("، ")
          : String(message);

  return (
    <Alert
      variant="danger"
      className="mx-auto"
      style={{ maxWidth: 700 }}
      role="alert"
    >
      <strong>{lang === "ar" ? "خطأ:" : "Error:"}</strong>{" "}
      {displayMessage}
    </Alert>
  );
}
