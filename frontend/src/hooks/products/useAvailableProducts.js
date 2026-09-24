import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiGetAvailablePackageProducts,
  apiSearchPublicAccommodations,
} from "../../services/api/admin/availability";

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

const buildAvailabilityQuery = ({
  startDate, endDate, pilgrimsCount = 1, category, mode,
  adults, children, roomsCount, search, city, country, minPrice, maxPrice,
  stars, hotelType, bedType, mealPlan, facilities, sort, page, limit,
}) => ({
  ...(startDate ? { startDate } : {}),
  ...(endDate ? { endDate } : {}),
  pilgrimsCount: Math.max(1, Number(pilgrimsCount) || 1),
  ...(category ? { category } : {}),
  ...(mode ? { mode } : {}),
  ...(category === "roomTypes" ? {
    ...(startDate ? { checkIn: startDate } : {}),
    ...(endDate ? { checkOut: endDate } : {}),
    adults: Math.max(1, Number(adults) || 1),
    children: Math.max(0, Number(children) || 0),
    roomsCount: Math.max(1, Number(roomsCount) || 1),
    ...(search ? { search } : {}), ...(city ? { city } : {}),
    ...(country ? { country } : {}), ...(minPrice ? { minPrice } : {}),
    ...(maxPrice ? { maxPrice } : {}), ...(stars ? { stars } : {}),
    ...(hotelType ? { hotelType } : {}), ...(bedType ? { bedType } : {}),
    ...(mealPlan ? { mealPlan } : {}), ...(facilities ? { facilities } : {}),
    ...(sort ? { sort } : {}), ...(page ? { page } : {}), ...(limit ? { limit } : {}),
  } : {}),
});

export default function useAvailableProducts() {
  const [availableProducts, setAvailableProducts] = useState(emptyProducts);
  const [productsPagination, setProductsPagination] = useState({
    page: 1, limit: 10, total: 0, totalPages: 0,
  });
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
    scheduledQueryKeyRef.current = "";
  }, []);

  const fetchProductsByDate = useCallback(
    (input) => {
      const query = buildAvailabilityQuery(input);
      const queryKey = JSON.stringify(query);

      if (query.mode !== "browse" && (!query.startDate || !query.endDate)) {
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
          const request = query.category === "roomTypes"
            ? apiSearchPublicAccommodations
            : apiGetAvailablePackageProducts;
          const res = await request(query, {
            signal: controller.signal,
          });

          if (requestSequence !== requestSequenceRef.current) return;

          const responseData = res.data?.data || {};
          const data = query.category === "roomTypes"
            ? { roomTypes: Array.isArray(responseData) ? responseData : [] }
            : responseData;
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
          if (query.category === "roomTypes") {
            const pagination = res.data?.pagination || {};
            setProductsPagination({
              page: Number(pagination.page || 1),
              limit: Number(pagination.limit || 10),
              total: Number(pagination.total || 0),
              totalPages: Number(pagination.totalPages ?? pagination.pages ?? 0),
            });
          }
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
    productsPagination,
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
