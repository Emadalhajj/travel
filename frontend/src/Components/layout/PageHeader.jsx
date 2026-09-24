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

  className = "",
}) {
  const { i18n } = useTranslation();

  const isArabic = i18n.language === "ar";

  const title = isArabic ? titleAr : titleEn;

  const subtitle = isArabic ? subtitleAr : subtitleEn;

  const eyebrow = isArabic ? eyebrowAr : eyebrowEn;

  return (
    <motion.header
      initial={{
        opacity: 0,
        y: -12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.2,
      }}
      className={[
        "mb-5",

        center
          ? "text-center"
          : [
              "flex flex-col gap-3",
              "sm:flex-row",
              "sm:items-start",
              "sm:justify-between",
            ].join(" "),

        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* =========================
          PAGE INFO
      ========================= */}

      <div
        className={["min-w-0", center ? "" : "flex-1"]
          .filter(Boolean)
          .join(" ")}
      >
        {eyebrow && (
          <p
            className="
              mb-1
              text-sm
              font-semibold
              text-primary
            "
          >
            {eyebrow}
          </p>
        )}

        {title && (
          <h1
            className="
              m-0
              break-words
              text-xl
              font-bold
              leading-tight
              text-content

              sm:text-2xl
              lg:text-3xl
            "
          >
            {title}
          </h1>
        )}

        {subtitle && (
          <p
            className={[
              title ? "mt-1" : "m-0",

              "max-w-3xl",
              "text-sm",
              "leading-6",
              "text-content-muted",

              "sm:text-base",
            ].join(" ")}
          >
            {subtitle}
          </p>
        )}

        {children && <div className="mt-2">{children}</div>}
      </div>

      {/* =========================
          PAGE ACTIONS
      ========================= */}

      {actions && (
        <div
          className={[
            "w-full",

            "sm:w-auto",
            "sm:flex-shrink-0",

            center ? "mt-3 flex justify-center" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {actions}
        </div>
      )}
    </motion.header>
  );
}
