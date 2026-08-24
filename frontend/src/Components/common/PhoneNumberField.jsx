import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

const arabicRegionNames = new Intl.DisplayNames(["ar"], { type: "region" });
const englishRegionNames = new Intl.DisplayNames(["en"], { type: "region" });
const PHONE_COUNTRIES = getCountries().map((code) => ({
  code,
  nameAr: arabicRegionNames.of(code) || code,
  nameEn: englishRegionNames.of(code) || code,
  dialCode: getCountryCallingCode(code),
}));

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

const countrySelectStyles = (hasError) => ({
  control: (base, state) => ({
    ...base,
    minHeight: 46,
    borderRadius: 12,
    borderColor: hasError ? "#f87171" : state.isFocused ? "#10b981" : "#e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 2px #d1fae5" : "none",
    "&:hover": { borderColor: hasError ? "#f87171" : "#10b981" },
  }),
  valueContainer: (base) => ({ ...base, paddingInline: 10 }),
  indicatorSeparator: () => ({ display: "none" }),
  menu: (base) => ({ ...base, zIndex: 30 }),
});

const normalizeDigits = (value) => String(value || "")
  .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit))
  .replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
  .replace(/\D/g, "");

function splitPhone(value, defaultCountryCode) {
  const raw = String(value || "").trim();
  const digits = normalizeDigits(raw);
  const fallback = PHONE_COUNTRIES.find(({ code }) => code === defaultCountryCode) || PHONE_COUNTRIES[0];
  if (!raw.startsWith("+")) return { country: fallback, localNumber: digits };

  const parsedPhone = parsePhoneNumberFromString(raw);
  const country = PHONE_COUNTRIES.find(({ code }) => code === parsedPhone?.country) || [...PHONE_COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find(({ dialCode }) => digits.startsWith(dialCode));
  return country
    ? { country, localNumber: digits.slice(country.dialCode.length) }
    : { country: fallback, localNumber: digits };
}

export default function PhoneNumberField({
  label,
  value,
  onChange,
  required = false,
  error,
  isArabic = true,
  defaultCountryCode = "SA",
  hideLabel = false,
}) {
  const parsed = useMemo(() => splitPhone(value, defaultCountryCode), [value, defaultCountryCode]);
  const [selectedCountryCode, setSelectedCountryCode] = useState(parsed.country.code);
  const selectedCountry = PHONE_COUNTRIES.find(({ code }) => code === selectedCountryCode) || parsed.country;

  useEffect(() => {
    if (value) setSelectedCountryCode(parsed.country.code);
  }, [parsed.country.code, value]);

  const emit = (country, localNumber) => {
    const digits = normalizeDigits(localNumber).replace(/^0+/, "").slice(0, 15 - country.dialCode.length);
    onChange(digits ? `+${country.dialCode}${digits}` : "");
  };

  return (
    <div className="block min-w-0">
      {!hideLabel && <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label || (isArabic ? "رقم التواصل" : "Contact number")}
        {required && <span className="text-red-500"> *</span>}
      </span>}
      <div className="grid min-w-0 grid-cols-[minmax(135px,0.9fr)_minmax(0,1.4fr)] gap-2" dir={isArabic ? "rtl" : "ltr"}>
        <Select
          aria-label={isArabic ? "الدولة ومفتاح الاتصال" : "Country and calling code"}
          value={selectedCountry}
          options={PHONE_COUNTRIES}
          isRtl={isArabic}
          isSearchable
          styles={countrySelectStyles(Boolean(error))}
          getOptionValue={(country) => country.code}
          getOptionLabel={(country) => `${country.code} +${country.dialCode} ${country.nameAr} ${country.nameEn}`}
          formatOptionLabel={(country) => (
            <span dir="ltr" className="whitespace-nowrap font-semibold">
              {country.code} +{country.dialCode}
            </span>
          )}
          placeholder={isArabic ? "ابحث..." : "Search..."}
          noOptionsMessage={() => isArabic ? "لا توجد دولة مطابقة" : "No matching country"}
          onChange={(country) => {
            if (!country) return;
            setSelectedCountryCode(country.code);
            emit(country, parsed.localNumber);
          }}
        />
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required={required}
          aria-label={isArabic ? "رقم التواصل" : "Contact number"}
          placeholder={isArabic ? "رقم التواصل بدون مفتاح الدولة" : "Number without country code"}
          value={parsed.localNumber}
          className={`${inputClass} ${error ? "border-red-400" : ""}`}
          onChange={(event) => emit(selectedCountry, event.target.value)}
        />
      </div>
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
