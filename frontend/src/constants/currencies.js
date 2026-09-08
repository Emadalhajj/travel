export const DEFAULT_CURRENCY = "SAR";

export const SUPPORTED_CURRENCIES = Object.freeze([
  "SAR",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "EGP",
  "TRY",
]);

const CURRENCY_LABELS_AR = Object.freeze({
  SAR: "ريال سعودي",
  USD: "دولار أمريكي",
  EUR: "يورو",
  GBP: "جنيه إسترليني",
  AED: "درهم إماراتي",
  EGP: "جنيه مصري",
  TRY: "ليرة تركية",
});

const CURRENCY_LABELS_EN = Object.freeze({
  SAR: "Saudi Riyal",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  AED: "UAE Dirham",
  EGP: "Egyptian Pound",
  TRY: "Turkish Lira",
});

export const CURRENCY_OPTIONS = Object.freeze(
  SUPPORTED_CURRENCIES.map((value) => Object.freeze({
    value,
    labelAr: CURRENCY_LABELS_AR[value],
    labelEn: CURRENCY_LABELS_EN[value],
  })),
);
