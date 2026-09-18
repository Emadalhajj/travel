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
          : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      }`}
    >
      <div className={center ? "" : "min-w-0 flex-1"}>
        {eyebrow && (
          <p className="mb-1 text-sm font-semibold text-emerald-700">
            {eyebrow}
          </p>
        )}

        {title && (
          <h1 className="m-0 text-xl font-bold leading-tight text-slate-900 sm:text-2xl lg:text-3xl">
            {title}
          </h1>
        )}

        {subtitle && (
          <p className={`${title ? "mt-1" : "m-0"} max-w-3xl text-sm leading-6 text-slate-500`}>
            {subtitle}
          </p>
        )}

        {children}
      </div>

      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-shrink-0 sm:justify-end">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
