import countries from "i18n-iso-countries";
import ar from "i18n-iso-countries/langs/ar.json";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(ar);
countries.registerLocale(en);

export const getNationalityLabel = (value, isArabic = true) => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) return "-";

  const countryCode = normalizedValue.toUpperCase();

  if (/^[A-Z]{2}$/.test(countryCode)) {
    return (
      countries.getName(countryCode, isArabic ? "ar" : "en", {
        select: "official",
      }) || normalizedValue
    );
  }

  // دعم السجلات القديمة التي كانت تحفظ اسم الجنسية بدل كود الدولة.
  return normalizedValue;
};
