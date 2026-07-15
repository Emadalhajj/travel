import { useCallback, useEffect, useState } from "react";
import api from "../../services/api/api";
import { apiGetAvailablePackageProducts } from "../../services/api/availability";

/*
=========================================================
useAvailableProducts
=========================================================

هذا Hook مسؤول عن جلب المنتجات المتاحة حسب الفترة الزمنية.

يعتمد على:
startDate
endDate

ويجلب المنتجات حسب الأقسام:

1- التأشيرات
2- الفنادق
3- الرحلات
4- النقل
5- الزيارات
6- الخدمات الإضافية

ملاحظة:
إذا كان لديك API مختلف للـ Availability
غيّر فقط أسماء المسارات داخل fetchAvailableProducts.

=========================================================
*/
const emptyProducts = {
  visas: [],
  hotels: [],
  roomTypes: [],
  flights: [],
  transports: [],
  trips: [],
  ziyarats: [],
  extraServices: [],
  services: [],
  vehicleRentals: [],
};

export default function useAvailableProducts() {
  const [availableProducts, setAvailableProducts] = useState(emptyProducts);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);

  const fetchProductsByDate = useCallback(
    async ({ startDate, endDate, pilgrimsCount = 1 }) => {
      try {
        setLoadingProducts(true);
        setProductsError(null);

        if (!startDate || !endDate) {
          setAvailableProducts(emptyProducts);
          return;
        }

        const res = await apiGetAvailablePackageProducts({
          startDate,
          endDate,
          pilgrimsCount,
        });

        const data = res.data?.data || {};

        setAvailableProducts({
          visas: data.visas || [],
          hotels: data.hotels || [],
          roomTypes: data.roomTypes || [],
          flights: data.flights || [],
          transports: data.transports || [],
          trips: data.trips || [],
          ziyarats: data.ziyarats || data.ziyarat || [],
          extraServices: data.extraServices || [],
          services: data.services || [],
          vehicleRentals: data.vehicleRentals || [],
        });
      } catch (err) {
        setProductsError(
          err?.response?.data?.message ||
            err?.message ||
            "حدث خطأ أثناء تحميل المنتجات المتاحة",
        );

        setAvailableProducts(emptyProducts);
      } finally {
        setLoadingProducts(false);
      }
    },
    [],
  );

  return {
    availableProducts,
    loadingProducts,
    productsError,
    fetchProductsByDate,
  };
}

/*
شرح الملف:
هذا Hook مشترك بين الإدارة والعميل.
وظيفته جلب المنتجات المتاحة حسب startDate و endDate وعدد الحجاج.
سيستخدم في:
1. إنشاء برنامج من لوحة الإدارة.
2. بناء برنامج مخصص من العميل.
3. اختيار خدمات إضافية أثناء حجز برنامج جاهز.
*/