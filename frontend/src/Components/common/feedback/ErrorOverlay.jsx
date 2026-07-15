import { Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function ErrorOverlay({ show = false, message }) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";

  if (!show || !message) return null;

  return (
    <Alert
      variant="danger"
      className="mx-auto"
      style={{ maxWidth: 700 }}
      role="alert"
    >
      <strong>{lang === "ar" ? "خطأ:" : "Error:"}</strong>{" "}
      {message}
    </Alert>
  );
}