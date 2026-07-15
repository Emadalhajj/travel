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

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 ${
        center
          ? "text-center"
          : "flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      }`}
    >
      <div>
        {(eyebrowAr || eyebrowEn) && (
          <p className="text-sm font-semibold text-emerald-700">
            {isArabic ? eyebrowAr : eyebrowEn}
          </p>
        )}

        <h1 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">
          {isArabic ? titleAr : titleEn}
        </h1>

        {(subtitleAr || subtitleEn) && (
          <p className="mt-2 text-sm text-slate-500">
            {isArabic ? subtitleAr : subtitleEn}
          </p>
        )}

        {children}
      </div>

      {actions && <div>{actions}</div>}
    </motion.div>
  );
}