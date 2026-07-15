// src/utils/countries.js
const OUNTRIES_API = 'https://restcountries.com/v3.1';
// const CITIES_API = 'https://countriesnow.space/api/v0.1/countries/cities';
// import OUNTRIES_API from "../Utils/data/countries.json";
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
  if (cache.has('countries')) return cache.get('countries');

  try {
    const res = await fetch(`${OUNTRIES_API}/all?fields=name,cca2,translations,flags`);
    const data = await res.json();

    const countries = data.map(country => ({
      code: country.cca2,
      nameEn: country.name.common,
      nameAr: country.translations?.ara?.common || country.name.common,
      flag: country.flags?.png || country.flags?.svg,
    })).sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));

    cache.set('countries', countries);
    return countries;
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
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
