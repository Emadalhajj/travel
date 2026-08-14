import { useMemo } from "react";
import Select from "react-select";
import countries from "i18n-iso-countries";
import ar from "i18n-iso-countries/langs/ar.json";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(ar);
countries.registerLocale(en);

export default function NationalitySelect({
  value = "",
  onChange,
  isArabic = true,
  required = false,
  error = "",
  id,
}) {
  const options = useMemo(() => {
    const language = isArabic ? "ar" : "en";
    const names = countries.getNames(language, { select: "official" });

    return Object.entries(names)
      .map(([code, label]) => ({ value: code, label }))
      .sort((a, b) => a.label.localeCompare(b.label, language));
  }, [isArabic]);

  const selected =
    options.find((option) => option.value === value) ||
    options.find((option) => option.label === value) ||
    null;

  return (
    <div>
      <Select
        inputId={id}
        value={selected}
        options={options}
        isClearable={!required}
        isSearchable
        placeholder={isArabic ? "ابحث عن الجنسية..." : "Search nationality..."}
        noOptionsMessage={() =>
          isArabic ? "لا توجد نتيجة" : "No nationalities found"
        }
        onChange={(option) => onChange?.(option?.value || "")}
        classNamePrefix="nationality-select"
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: 48,
            borderRadius: 12,
            borderColor: error ? "#ef4444" : state.isFocused ? "#10b981" : "#e2e8f0",
            boxShadow: state.isFocused ? "0 0 0 3px #d1fae5" : "none",
          }),
          menu: (base) => ({ ...base, zIndex: 30 }),
        }}
      />
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
