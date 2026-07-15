// src/hooks/useLocationSelect.js
import { useState, useEffect } from "react";
import { getAllCountries, getCitiesByCountry } from "../Utils/countries";

export const useLocationSelect = (formState, setFormState, isArabic) => {
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // جلب الدول عند تحميل الكومبوننت
  useEffect(() => {
    const fetchCountries = async () => {
      const data = await getAllCountries();
      setCountries(data);
    };
    fetchCountries();
  }, []);

  // جلب المدن عند تغيير الدولة
  const countryCode = formState?.location?.country?.code;

  useEffect(() => {
    if (!countryCode) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const cityList = await getCitiesByCountry(countryCode);
        setCities(cityList);
      } catch (err) {
        console.error("Error fetching cities:", err);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, [countryCode]);

  const getCountryOptions = (field) =>
  countries.map((country) => ({
    value: country.code,
    label:
      field.optionLang === "en"
        ? country.nameEn
        : country.nameAr,
    searchText: [country.nameAr, country.nameEn, country.code]
      .filter(Boolean)
      .join(" "),
    data: country,
  }));


 const getCityOptions = () =>
  cities.map((city) => ({
    value: city,
    label: city,
    searchText: city,
    data: {
      value: city,
      labelAr: city,
      labelEn: city,
    },
  }));

const getLocationOptions = (field) => {
  if (field.syncGroup === "country") return getCountryOptions(field);
  if (field.syncGroup === "city") return getCityOptions(field);
  return [];
};



  const getSelectedLocationOption = (field) => {
    const options = getLocationOptions(field);
    const countryCode = formState?.location?.country?.code;
    const value = get(formState, field.name);

    return (
      options.find((option) => {
        if (field.syncGroup === "country") {
          return (
            option.value === countryCode ||
            option.data?.nameAr === value ||
            option.data?.nameEn === value
          );
        }

        return option.value === value || option.label === value;
      }) || null
    );
  };

  // دالة التعامل مع اختيار الدولة
  const handleCountryChange = (selected) => {
    if (!selected) return;

    const country = selected.data || selected;

    setFormState((prev) => {
      let next = { ...prev };
      next = set(next, "location.country.code", country.code || selected.value);
      next = set(next, "location.country.ar", country.nameAr || "");
      next = set(next, "location.country.en", country.nameEn || "");
      next = set(next, "location.city.ar", "");
      next = set(next, "location.city.en", "");
      return next;
    });
  };

  // دالة التعامل مع اختيار المدينة
  const handleCityChange = (selected) => {
    if (!selected) return;

    const city = selected.data || selected;
    const cityName = city.value || city.labelEn || city.labelAr || selected.label;

    setFormState((prev) => {
      let next = { ...prev };
      next = set(next, "location.city.ar", cityName);
      next = set(next, "location.city.en", cityName);
      return next;
    });
  };

  const handleLocationSelectChange = (selected, field) => {
    if (field.syncGroup === "country") {
      handleCountryChange(selected);
      return;
    }

    if (field.syncGroup === "city") {
      handleCityChange(selected);
    }
  };

  return {
    countries,
    cities,
    loadingCities,
    handleCountryChange,
    handleCityChange,
    handleLocationSelectChange,
    getLocationOptions,
    getSelectedLocationOption,
    getCountryOptions,
    getCityOptions ,
  };
};

// Helper functions
const get = (obj, path) => path?.split(".").reduce((o, k) => o?.[k], obj);

const set = (obj, path, value) => {
  const keys = path.split(".");
  const root = { ...obj };
  let current = root;
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...current[keys[i]] };
    current = current[keys[i]];
  }
  current[keys.at(-1)] = value;
  return root;
};
