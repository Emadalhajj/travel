import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function PageHeader({
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  eyebrowAr,
  eyebrowEn,
  center = false,
  actions,
  children,
}) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const title = isArabic ? titleAr : titleEn;
  const subtitle = isArabic ? subtitleAr : subtitleEn;
  const eyebrow = isArabic ? eyebrowAr : eyebrowEn;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 ${
        center
          ? "text-center"
          : "flex flex-row flex-nowrap items-center justify-between gap-3"
      }`}
    >
      <div className={center ? "" : "min-w-0 flex-1"}>
        {eyebrow && (
          <p className="mb-1 text-sm font-semibold text-emerald-700">
            {eyebrow}
          </p>
        )}

        {title && (
          <h1 className="m-0 text-2xl font-bold leading-tight text-slate-900">
            {title}
          </h1>
        )}

        {subtitle && (
          <p className={`${title ? "mt-1" : "m-0"} text-sm text-slate-500`}>
            {subtitle}
          </p>
        )}

        {children}
      </div>

      {actions && (
        <div className="max-w-[65%] flex-shrink-0 overflow-x-auto">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
