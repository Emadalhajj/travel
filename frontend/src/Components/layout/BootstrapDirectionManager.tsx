import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function BootstrapDirectionManager() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isArabic = i18n.language === "ar";
    const href = isArabic
      ? "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css"
      : "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";

    let link = document.getElementById("bootstrap-css") as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement("link");
      link.id = "bootstrap-css";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    link.href = href;

    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.documentElement.lang = isArabic ? "ar" : "en";
  }, [i18n.language]);

  return null;
}
