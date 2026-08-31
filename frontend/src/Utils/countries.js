// src/utils/countries.js
import countries from "i18n-iso-countries";
import arLocale from "i18n-iso-countries/langs/ar.json";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(arLocale);
countries.registerLocale(enLocale);
// const CITIES_API = 'https://countriesnow.space/api/v0.1/countries/cities';
// import COUNTRIES_API from "../Utils/data/countries.json";
const COUNTRIES_CACHE_TTL = 5 * 60 * 1000;
let countriesCache = null;
let countriesLoadedAt = 0;

export const resetCountriesCacheForTests = () => {
  countriesCache = null;
  countriesLoadedAt = 0;
};

// Cache لتجنب التكرار
const getCities = async (countryCode)=> {
  const res = await fetch(
    `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?countryIds=${countryCode}&limit=100`,
    {
      headers: {
        'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY',
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
      }
    }
  )
  const data = await res.json();
  return data.data;
}
const cache = new Map();

export const getAllCountries = async () => {
  if (
    countriesCache &&
    Date.now() - countriesLoadedAt < COUNTRIES_CACHE_TTL
  ) {
    return countriesCache;
  }
  const arabicNames = countries.getNames("ar", { select: "official" });
  const englishNames = countries.getNames("en", { select: "official" });

  countriesCache = Object.entries(englishNames)
    .map(([code, nameEn]) => ({
      code,
      nameEn,
      nameAr: arabicNames[code] || nameEn,
    }))
    .sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));
  countriesLoadedAt = Date.now();

  return countriesCache;
};

export const getCitiesByCountry = async (countryCodeOrName) => {
  const countries = await getAllCountries();
  const country =
    countries.find((c) => c.code === countryCodeOrName) ||
    countries.find((c) => c.nameEn === countryCodeOrName);
  const countryName = country?.nameEn || countryCodeOrName;
  const cacheKey = `cities-${countryName}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const res = await fetch(getCities(countryCodeOrName), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName })
    });

    const result = await res.json();

    if (result.data && Array.isArray(result.data)) {
      const cities = result.data.sort((a, b) => a.localeCompare(b, 'en'));
      cache.set(cacheKey, cities);
      return cities;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching cities for ${countryName}:`, error);
    return [];
  }
};

// للحصول على اسم الدولة حسب الكود
export const getCountryByCode = async (code) => {
  const countries = await getAllCountries();
  return countries.find(c => c.code === code);
};

// import { getNames } from 'country-list';
// import countries from 'i18n-iso-countries';

// countries.registerLocale(require("i18n-iso-countries/langs/ar.json"));
// countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

// export const getAllCountries = (lang = 'ar') => {
//   const names = getNames(lang); // country-list
//   const isoNames = countries.getNames(lang);

//   return Object.entries(isoNames || names).map(([code, name]) => ({
//     code: code,
//     nameAr: lang === 'ar' ? name : getNames('ar')[code] || name,
//     nameEn: lang === 'en' ? name : getNames('en')[code] || name,
//   })).sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
// };

// // للحصول على دولة معينة
// export const getCountry = (code, lang = 'ar') => {
//   const all = getAllCountries(lang);
//   return all.find(c => c.code === code);
// };
