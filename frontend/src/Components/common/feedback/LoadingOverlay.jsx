import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";


const SIZE_CLASSES = {
  sm: {
    icon: 24,
    container: "min-h-24",
  },

  md: {
    icon: 32,
    container: "min-h-40",
  },

  lg: {
    icon: 40,
    container: "min-h-64",
  },
};


export default function LoadingOverlay({
  show = false,
  text,
  size = "md",
  overlay = true,
  className = "",
}) {
  const { i18n } = useTranslation();

  const isArabic =
    i18n.language === "ar";


  if (!show) {
    return null;
  }


  const sizeConfig =
    SIZE_CLASSES[size] ||
    SIZE_CLASSES.md;


  const displayText =
    text ??
    (isArabic
      ? "جارٍ التحميل..."
      : "Loading...");


  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"

      className={[
        "flex items-center justify-center",

        overlay
          ? [
              "absolute inset-0 z-30",
              "bg-surface/80",
              "backdrop-blur-[1px]",
            ].join(" ")
          : sizeConfig.container,

        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <Loader2
          size={sizeConfig.icon}
          className="animate-spin text-primary"
          aria-hidden="true"
        />

        {displayText && (
          <p className="m-0 text-sm font-medium text-content-muted">
            {displayText}
          </p>
        )}
      </div>
    </div>
  );
}