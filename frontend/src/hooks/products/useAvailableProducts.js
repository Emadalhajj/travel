import { useCallback, useEffect, useRef, useState } from "react";
import { apiGetAvailablePackageProducts } from "../../services/api/admin/availability";

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

const AVAILABILITY_DEBOUNCE_MS = 250;

const buildAvailabilityQuery = ({ startDate, endDate, pilgrimsCount = 1 }) => ({
  startDate,
  endDate,
  pilgrimsCount: Math.max(1, Number(pilgrimsCount) || 1),
});

export default function useAvailableProducts() {
  const [availableProducts, setAvailableProducts] = useState(emptyProducts);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const scheduledQueryKeyRef = useRef("");
  const successfulQueryKeyRef = useRef("");

  useEffect(() => () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    abortControllerRef.current?.abort();
    requestSequenceRef.current += 1;
  }, []);

  const fetchProductsByDate = useCallback(
    (input) => {
      const query = buildAvailabilityQuery(input);
      const queryKey = JSON.stringify(query);

      if (!query.startDate || !query.endDate) {
        if (debounceTimerRef.current) {
          window.clearTimeout(debounceTimerRef.current);
        }
        abortControllerRef.current?.abort();
        requestSequenceRef.current += 1;
        scheduledQueryKeyRef.current = "";
        successfulQueryKeyRef.current = "";
        setAvailableProducts(emptyProducts);
        setProductsError(null);
        setLoadingProducts(false);
        return;
      }

      if (
        queryKey === scheduledQueryKeyRef.current ||
        queryKey === successfulQueryKeyRef.current
      ) {
        return;
      }

      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      abortControllerRef.current?.abort();

      const requestSequence = requestSequenceRef.current + 1;
      requestSequenceRef.current = requestSequence;
      scheduledQueryKeyRef.current = queryKey;
      setLoadingProducts(true);
      setProductsError(null);

      debounceTimerRef.current = window.setTimeout(async () => {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
          const res = await apiGetAvailablePackageProducts(query, {
            signal: controller.signal,
          });

          if (requestSequence !== requestSequenceRef.current) return;

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
          successfulQueryKeyRef.current = queryKey;
        } catch (err) {
          if (controller.signal.aborted || requestSequence !== requestSequenceRef.current) {
            return;
          }
          setProductsError(
            err?.response?.data?.message ||
              err?.message ||
              "حدث خطأ أثناء تحميل المنتجات المتاحة",
          );
          setAvailableProducts(emptyProducts);
          scheduledQueryKeyRef.current = "";
        } finally {
          if (requestSequence === requestSequenceRef.current) {
            setLoadingProducts(false);
          }
        }
      }, AVAILABILITY_DEBOUNCE_MS);
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
