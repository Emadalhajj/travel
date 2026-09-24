import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  createPublicDraftBooking,
  updatePublicDraftBooking,
  resetPublicBooking,
  ensurePublicDraftBooking,
  selectPublicDraftBooking,
  selectPublicBookingSubmitError,
  selectPublicBookingSubmitLoading,
} from "../../../redux/public/bookingSlice";

import useAvailableProducts from "../../../hooks/products/useAvailableProducts";
import useCustomPackageBuilder from "../../../hooks/public-booking/useCustomPackageBuilder";

import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PageHeader from "../../../Components/layout/PageHeader";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";
import PublicButton from "../../../Components/shared/buttons/PublicButton";
import ConfigFieldsRenderer from "../../../Components/shared/forms/ConfigFieldsRenderer";
import ProductCategoryPanel from "../../../Components/shared/products/ProductCategoryPanel";
import AccommodationResults from "../../../Components/shared/accommodation/AccommodationResults";

import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import PaginationComponent from "../../../Components/common/Pagination";

import { getProductSelectionId } from "../../../Utils/products/productSelection";

/* =========================================================
 * SERVICE CONFIG
 * ========================================================= */

const SERVICE_CONFIG = {
  trips: {
    categoryKey: "trips",
    serviceType: "TRIP",
    titleAr: "الرحلات البرية والبحرية",
    titleEn: "Land & Sea Trips",
    subtitleAr: "استعرض الرحلات المتاحة وحدد المسار والتاريخ المناسبين.",
    subtitleEn: "Browse available trips and choose the suitable route and dates.",
    categoryLabelAr: "الرحلات",
    categoryLabelEn: "Trips",
    requiresDates: true,
    fields: [
      { name: "search", labelAr: "اسم الرحلة", labelEn: "Trip name", type: "text", col: 12 },
      { name: "pickupLocation", labelAr: "مدينة الانطلاق", labelEn: "Origin", type: "text", col: 6 },
      { name: "dropoffLocation", labelAr: "مدينة الوصول", labelEn: "Destination", type: "text", col: 6 },
      { name: "startDate", labelAr: "من تاريخ", labelEn: "From date", type: "date", col: 6, required: true },
      { name: "endDate", labelAr: "إلى تاريخ", labelEn: "To date", type: "date", col: 6, required: true },
      { name: "travelersCount", labelAr: "عدد المسافرين", labelEn: "Travelers", type: "number", min: 1, col: 6, required: true },
      { name: "sort", labelAr: "الترتيب", labelEn: "Sort", type: "select", col: 6, options: [{ value: "priceAsc", labelAr: "الأقل سعرًا", labelEn: "Lowest price" }, { value: "priceDesc", labelAr: "الأعلى سعرًا", labelEn: "Highest price" }] },
    ],
  },
  hotels: {
    categoryKey: "roomTypes",

    serviceType: "ACCOMMODATION",

    titleAr: "الفنادق والإقامة",
    titleEn: "Hotels & Accommodation",

    subtitleAr: "اختر السكن المناسب خلال فترة إقامتك.",
    subtitleEn: "Choose the right accommodation for your selected stay dates.",

    categoryLabelAr: "الفنادق والإقامة",
    categoryLabelEn: "Hotels & Accommodation",
    requiresDates: true,
    fields: [
      { name: "search", labelAr: "اسم الفندق أو الغرفة", labelEn: "Hotel or room name", type: "text", col: 12 },
      { name: "city", labelAr: "المدينة", labelEn: "City", type: "text", col: 6 },
      { name: "country", labelAr: "الدولة", labelEn: "Country", type: "text", col: 6 },
      { name: "startDate", labelAr: "تاريخ الوصول", labelEn: "Check-in", type: "date", col: 6, required: true },
      { name: "endDate", labelAr: "تاريخ المغادرة", labelEn: "Check-out", type: "date", col: 6, required: true },
      { name: "adults", labelAr: "البالغون", labelEn: "Adults", type: "number", min: 1, col: 4, required: true },
      { name: "children", labelAr: "الأطفال", labelEn: "Children", type: "number", min: 0, col: 4 },
      { name: "roomsCount", labelAr: "عدد الغرف", labelEn: "Rooms", type: "number", min: 1, col: 4, required: true },
      { name: "stars", labelAr: "النجوم", labelEn: "Stars", type: "select", col: 4, options: [1, 2, 3, 4, 5].map((value) => ({ value: String(value), labelAr: `${value} نجوم`, labelEn: `${value} stars` })) },
      { name: "hotelType", labelAr: "نوع السكن", labelEn: "Property type", type: "select", col: 4, options: ["hotel", "resort", "apartment", "hostel", "villa", "motel"].map((value) => ({ value, labelAr: value, labelEn: value })) },
      { name: "bedType", labelAr: "نوع السرير", labelEn: "Bed type", type: "select", col: 4, options: ["single", "twin", "double", "queen", "king", "triple", "quad", "family", "suite"].map((value) => ({ value, labelAr: value, labelEn: value })) },
      { name: "mealPlan", labelAr: "خطة الوجبات", labelEn: "Meal plan", type: "select", col: 6, options: ["room_only", "breakfast", "half_board", "full_board", "all_inclusive"].map((value) => ({ value, labelAr: value, labelEn: value })) },
      { name: "facilities", labelAr: "المرافق (مفصولة بفاصلة)", labelEn: "Facilities (comma separated)", type: "text", col: 6 },
      { name: "minPrice", labelAr: "أقل سعر", labelEn: "Minimum price", type: "number", min: 0, col: 4 },
      { name: "maxPrice", labelAr: "أعلى سعر", labelEn: "Maximum price", type: "number", min: 0, col: 4 },
      { name: "sort", labelAr: "الترتيب", labelEn: "Sort", type: "select", col: 6, options: [
        { value: "price_asc", labelAr: "الأقل سعرًا لليلة", labelEn: "Lowest nightly price" },
        { value: "price_desc", labelAr: "الأعلى سعرًا لليلة", labelEn: "Highest nightly price" },
        { value: "stars_desc", labelAr: "الأعلى نجومًا", labelEn: "Highest stars" },
        { value: "stars_asc", labelAr: "الأقل نجومًا", labelEn: "Lowest stars" },
        { value: "name_asc", labelAr: "الاسم تصاعديًا", labelEn: "Name ascending" },
        { value: "name_desc", labelAr: "الاسم تنازليًا", labelEn: "Name descending" },
      ] },
    ],
  },

  transports: {
    categoryKey: "transports",

    serviceType: "TRANSPORT",

    titleAr: "خدمات النقل",
    titleEn: "Transport Services",

    subtitleAr: "اختر وسيلة النقل المناسبة وحدد مسار الخدمة.",
    subtitleEn: "Choose the suitable transport and specify the service route.",

    categoryLabelAr: "النقل",
    categoryLabelEn: "Transport",
    requiresDates: false,
    fields: [
      { name: "pickupLocation", labelAr: "مكان الانطلاق", labelEn: "Pickup location", type: "text", col: 6 },
      { name: "dropoffLocation", labelAr: "مكان الوصول", labelEn: "Drop-off location", type: "text", col: 6 },
      { name: "travelersCount", labelAr: "عدد الركاب", labelEn: "Passengers", type: "number", min: 1, col: 6, required: true },
    ],
  },

  visas: {
    categoryKey: "visas",

    serviceType: "VISA",

    titleAr: "التأشيرات",
    titleEn: "Visas",

    subtitleAr: "استعرض واختر خدمات التأشيرات المتاحة.",
    subtitleEn: "Browse and select from available visa services.",

    categoryLabelAr: "التأشيرات",
    categoryLabelEn: "Visas",
    requiresDates: false,
    fields: [
      { name: "search", labelAr: "ابحث عن التأشيرة", labelEn: "Search visas", type: "text", col: 6 },
      { name: "nationality", labelAr: "الجنسية", labelEn: "Nationality", type: "text", col: 6 },
      { name: "travelersCount", labelAr: "عدد المتقدمين", labelEn: "Applicants", type: "number", min: 1, col: 6, required: true },
    ],
  },

  ziyarats: {
    categoryKey: "ziyarats",

    serviceType: "ZIYARAT",

    titleAr: "الزيارات",
    titleEn: "Ziyarats",

    subtitleAr: "اختر برامج الزيارات المناسبة خلال رحلتك.",
    subtitleEn: "Choose the ziyarat services that suit your trip.",

    categoryLabelAr: "الزيارات",
    categoryLabelEn: "Ziyarats",
    requiresDates: true,
    fields: [
      { name: "search", labelAr: "ابحث عن الزيارة", labelEn: "Search visits", type: "text", col: 12 },
      { name: "startDate", labelAr: "تاريخ البداية", labelEn: "Start date", type: "date", col: 6, required: true },
      { name: "endDate", labelAr: "تاريخ النهاية", labelEn: "End date", type: "date", col: 6, required: true },
      { name: "travelersCount", labelAr: "عدد الزوار", labelEn: "Visitors", type: "number", min: 1, col: 6, required: true },
    ],
  },

  extras: {
    categoryKey: "extraServices",

    serviceType: "EXTRA_SERVICE",

    titleAr: "الخدمات الإضافية",
    titleEn: "Extra Services",

    subtitleAr: "اختر الخدمات الإضافية المناسبة لرحلتك.",
    subtitleEn: "Choose additional services for your trip.",

    categoryLabelAr: "الخدمات الإضافية",
    categoryLabelEn: "Extra Services",
    requiresDates: false,
    fields: [
      { name: "search", labelAr: "ابحث عن خدمة", labelEn: "Search services", type: "text", col: 8 },
      { name: "travelersCount", labelAr: "الكمية / عدد المستفيدين", labelEn: "Quantity / beneficiaries", type: "number", min: 1, col: 4, required: true },
      { name: "sort", labelAr: "الترتيب", labelEn: "Sort", type: "select", col: 6, options: [{ value: "priceAsc", labelAr: "الأقل سعرًا", labelEn: "Lowest price" }, { value: "priceDesc", labelAr: "الأعلى سعرًا", labelEn: "Highest price" }] },
    ],
  },
};

/* =========================================================
 * PAGE
 * ========================================================= */

export default function PublicServiceCatalogPage({ serviceType }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingDraftId = searchParams.get("draftId") || "";

  const { i18n } = useTranslation();

  const isArabic = i18n.language === "ar";
  const lang = isArabic ? "ar" : "en";

  const submitLoading = useSelector(selectPublicBookingSubmitLoading);
  const submitError = useSelector(selectPublicBookingSubmitError);
  const draftBooking = useSelector(selectPublicDraftBooking);

  const [validationError, setValidationError] = useState("");

  /* =========================================================
   * SERVICE
   * ========================================================= */

  const service = SERVICE_CONFIG[serviceType];

  /* =========================================================
   * CUSTOM PACKAGE BUILDER
   *
   * نعيد استخدام نفس الـHook الموجود بدل إنشاء state ودوال
   * add/remove/pricing/payload جديدة.
   * ========================================================= */

  const {
    formData,
    selectedProductsList,

    handleFormChange,
    addProduct,
    removeProduct,

    buildDraftCreatePayload,
    buildDraftUpdatePayload,

    resetBuilder,
    hydrateAccommodationSelection,
  } = useCustomPackageBuilder();

  /* =========================================================
   * AVAILABILITY
   * ========================================================= */

  const {
    availableProducts,
    loadingProducts,
    productsError,
    productsPagination,
    fetchProductsByDate,
  } = useAvailableProducts();

  /* =========================================================
   * FORM CONFIG
   * ========================================================= */

  const searchFields = useMemo(() => service?.fields || [], [service]);

  /* =========================================================
   * RESET
   * ========================================================= */

  useEffect(() => {
    if (editingDraftId) {
      dispatch(ensurePublicDraftBooking(editingDraftId));
    } else {
      dispatch(resetPublicBooking());
    }

    return () => {
      resetBuilder();
    };
  }, [dispatch, editingDraftId, resetBuilder]);

  useEffect(() => {
    if (
      editingDraftId &&
      service?.serviceType === "ACCOMMODATION" &&
      String(draftBooking?._id || "") === String(editingDraftId)
    ) {
      hydrateAccommodationSelection(draftBooking);
    }
  }, [draftBooking, editingDraftId, hydrateAccommodationSelection, service?.serviceType]);

  /* =========================================================
   * FETCH AVAILABLE PRODUCTS
   * ========================================================= */

  useEffect(() => {
    if (!service) return;

    // Browse all active products immediately. Supplying both dates switches
    // the same endpoint to real inventory/availability filtering.
    const hasCompleteDateFilter = Boolean(formData.startDate && formData.endDate);

    fetchProductsByDate({
      startDate: hasCompleteDateFilter ? formData.startDate : undefined,
      endDate: hasCompleteDateFilter ? formData.endDate : undefined,
      adults: formData.adults,
      children: formData.children,
      roomsCount: formData.roomsCount,
      search: formData.search,
      city: formData.city,
      country: formData.country,
      minPrice: formData.minPrice,
      maxPrice: formData.maxPrice,
      stars: formData.stars,
      hotelType: formData.hotelType,
      bedType: formData.bedType,
      mealPlan: formData.mealPlan,
      facilities: formData.facilities,
      sort: formData.sort,
      page: formData.page,
      limit: formData.limit,
      pilgrimsCount: Number(
        service.serviceType === "ACCOMMODATION"
          ? Number(formData.adults || 1) + Number(formData.children || 0)
          : formData.travelersCount || 1,
      ),
      category: service.categoryKey,
      mode: hasCompleteDateFilter ? "availability" : "browse",
    });
  }, [
    formData.startDate,
    formData.endDate,
    formData.travelersCount,
    formData.adults,
    formData.children,
    formData.roomsCount,
    formData.search,
    formData.city,
    formData.country,
    formData.minPrice,
    formData.maxPrice,
    formData.stars,
    formData.hotelType,
    formData.bedType,
    formData.mealPlan,
    formData.facilities,
    formData.sort,
    formData.page,
    formData.limit,
    fetchProductsByDate,
    service,
  ]);

  /* =========================================================
   * CATEGORY
   * ========================================================= */

  const category = {
    key: service?.categoryKey || "",
    labelAr: service?.categoryLabelAr || "",
    labelEn: service?.categoryLabelEn || "",
  };

  const getPrice = (product) => Number(
    product?.pricing?.finalPrice ?? product?.pricing?.basePrice ??
    product?.price ?? product?.basePrice ?? 0,
  );
  const products = useMemo(() => {
    const search = String(formData.search || "").trim().toLowerCase();
    const pickup = String(formData.pickupLocation || "").trim().toLowerCase();
    const dropoff = String(formData.dropoffLocation || "").trim().toLowerCase();
    const minPrice = formData.minPrice === "" || formData.minPrice == null ? null : Number(formData.minPrice);
    const maxPrice = formData.maxPrice === "" || formData.maxPrice == null ? null : Number(formData.maxPrice);
    const filtered = (availableProducts?.[service?.categoryKey] || []).filter((product) => {
      const searchable = [product.nameAr, product.nameEn, product.hotel?.nameAr, product.hotel?.nameEn, product.fromCity, product.toCity].filter(Boolean).join(" ").toLowerCase();
      const origins = [product.fromCity, product.origin, product.pickupLocation, product.route?.origin].filter(Boolean).join(" ").toLowerCase();
      const destinations = [product.toCity, product.destination, product.dropoffLocation, product.route?.destination].filter(Boolean).join(" ").toLowerCase();
      const price = getPrice(product);
      return (!search || searchable.includes(search)) &&
        (!pickup || origins.includes(pickup)) &&
        (!dropoff || destinations.includes(dropoff)) &&
        (minPrice === null || price >= minPrice) &&
        (maxPrice === null || price <= maxPrice);
    });
    if (formData.sort === "priceAsc") return [...filtered].sort((a, b) => getPrice(a) - getPrice(b));
    if (formData.sort === "priceDesc") return [...filtered].sort((a, b) => getPrice(b) - getPrice(a));
    return filtered;
  }, [availableProducts, formData.search, formData.pickupLocation, formData.dropoffLocation, formData.minPrice, formData.maxPrice, formData.sort, service?.categoryKey]);

  /* =========================================================
   * VALIDATION
   * ========================================================= */

  const travelersCount = service?.serviceType === "ACCOMMODATION"
    ? Math.max(1, Number(formData.adults || 1) + Number(formData.children || 0))
    : Math.max(1, Number(formData.travelersCount || 1));

  const hasCompleteDateFilter = Boolean(formData.startDate && formData.endDate);
  const hasValidDates = !hasCompleteDateFilter ||
    new Date(formData.endDate) > new Date(formData.startDate);

  const hasSelectedProducts = selectedProductsList.length > 0;
  const stayNights = hasCompleteDateFilter && hasValidDates
    ? Math.round((new Date(formData.endDate) - new Date(formData.startDate)) / 86400000)
    : 0;

  if (!service) {
    return (
      <PublicPageLayout>
        <ErrorOverlay
          show
          message={isArabic ? "نوع الخدمة غير معروف." : "Unknown service type."}
        />
      </PublicPageLayout>
    );
  }

  /* =========================================================
   * FIELD CHANGE
   * ========================================================= */

  const handleFieldChange = (name, value) => {
    setValidationError("");

    handleFormChange(name, value);
  };

  /* =========================================================
   * ADD PRODUCT
   * ========================================================= */

  const handleAddItem = (item) => {
    setValidationError("");

    if (service.requiresDates && !hasCompleteDateFilter) {
      setValidationError(
        isArabic
          ? "يمكنك تصفح الخدمات الآن، لكن اختر تاريخ البداية والنهاية للتحقق من التوفر قبل الإضافة."
          : "You can browse now, but select start and end dates to verify availability before adding.",
      );
      return;
    }

    if (!hasValidDates) {
      setValidationError(
        isArabic
          ? "يجب أن يكون تاريخ النهاية بعد تاريخ البداية."
          : "End date must be after the start date.",
      );
      return;
    }

    // صفحة الخدمة تملك عقد التصنيف؛ category القادمة من نتيجة العرض
    // قد تكون اسمًا عامًا لا يقرأه Draft builder.
    const categoryKey = service.categoryKey;

    addProduct(categoryKey, item);
  };

  /* =========================================================
   * REMOVE PRODUCT
   * ========================================================= */

  const handleRemoveItem = (item) => {
    setValidationError("");

    const categoryKey = service.categoryKey;

    const itemId = getProductSelectionId(item);

    if (!itemId) {
      return;
    }

    removeProduct(categoryKey, itemId);
  };

  /* =========================================================
   * VALIDATE
   * ========================================================= */

  const validateSelection = () => {
    if (service.requiresDates && !formData.startDate) {
      setValidationError(
        isArabic
          ? "يجب اختيار تاريخ بداية الخدمة."
          : "Please select a start date.",
      );

      return false;
    }

    if (service.requiresDates && !formData.endDate) {
      setValidationError(
        isArabic
          ? "يجب اختيار تاريخ نهاية الخدمة."
          : "Please select an end date.",
      );

      return false;
    }

    if (!hasValidDates) {
      setValidationError(
        isArabic
          ? "يجب أن يكون تاريخ النهاية بعد تاريخ البداية."
          : "End date must be after the start date.",
      );

      return false;
    }

    if (travelersCount <= 0) {
      setValidationError(
        isArabic
          ? "يجب أن يكون عدد المسافرين أكبر من صفر."
          : "Travelers count must be greater than zero.",
      );

      return false;
    }

    if (!hasSelectedProducts) {
      setValidationError(
        isArabic
          ? "اختر خدمة واحدة على الأقل للمتابعة."
          : "Select at least one service to continue.",
      );

      return false;
    }

    setValidationError("");

    return true;
  };

  /* =========================================================
   * CONTINUE BOOKING
   * ========================================================= */

  const handleContinue = async () => {
    if (!validateSelection()) {
      return;
    }

    try {
      /*
       * 1. إنشاء Draft فارغ بالمسار الموجود أصلًا.
       */
      const createResult = editingDraftId
        ? null
        : await dispatch(
            createPublicDraftBooking(buildDraftCreatePayload()),
          ).unwrap();

      const draftId = editingDraftId || createResult?.data?._id || createResult?._id;

      if (!draftId) {
        throw new Error(
          isArabic
            ? "لم يتم استلام رقم مسودة الحجز."
            : "Draft booking ID was not returned.",
        );
      }

      /*
       * 2. تحديث Draft بالخدمة المختارة.
       *
       * buildDraftUpdatePayload تم توسيعها لقبول options
       * بدون كسر استخدام Custom Package الحالي.
       */
      await dispatch(
        updatePublicDraftBooking({
          draftId,

          data: buildDraftUpdatePayload({
            packageType: "SERVICE",
            serviceType: service.serviceType,
          }),
        }),
      ).unwrap();

      /*
       * 3. الانتقال لمسار الحجز الحالي.
       */
      navigate(`/booking/draft/${draftId}/details`);
    } catch (error) {
      setValidationError(
        error?.message ||
          error ||
          (isArabic ? "تعذر بدء الحجز." : "Unable to start booking."),
      );
    }
  };

  /* =========================================================
   * RENDER
   * ========================================================= */

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrowAr="الخدمات"
        eyebrowEn="Services"
        titleAr={service.titleAr}
        titleEn={service.titleEn}
        subtitleAr={service.subtitleAr}
        subtitleEn={service.subtitleEn}
        actions={
          <PublicButton
            variant="secondary"
            onClick={() => navigate("/services")}
          >
            {isArabic ? "العودة للخدمات" : "Back to Services"}
          </PublicButton>
        }
      />

      {/* =========================
          ERRORS
      ========================= */}

      <ErrorOverlay show={Boolean(submitError)} message={submitError} />

      <ErrorOverlay show={Boolean(productsError)} message={productsError} />

      <ErrorOverlay show={Boolean(validationError)} message={validationError} />

      {/* =========================
          SEARCH CRITERIA
      ========================= */}

      <PublicSectionCard title={isArabic ? "بيانات الخدمة" : "Service Details"}>
        <ConfigFieldsRenderer
          fields={searchFields}
          values={formData}
          errors={{}}
          isArabic={isArabic}
          onChange={handleFieldChange}
        />
        {service.serviceType === "ACCOMMODATION" && stayNights > 0 && (
          <div className="mt-3 text-success fw-semibold" role="status">
            {stayNights} {isArabic ? (stayNights === 1 ? "ليلة" : "ليالٍ") : (stayNights === 1 ? "night" : "nights")}
          </div>
        )}
      </PublicSectionCard>

      {/* =========================
          LOADING
      ========================= */}

      <LoadingOverlay show={loadingProducts && products.length === 0} />

      {/* =========================
          PRODUCTS
      ========================= */}

      {!productsError && (
        <div className="mt-4">
          {service.serviceType === "ACCOMMODATION" ? <AccommodationResults
            rooms={products}
            selectedItems={selectedProductsList}
            onSelect={handleAddItem}
            onRemove={handleRemoveItem}
            isArabic={isArabic}
          /> : <ProductCategoryPanel
            category={category}
            products={products}
            selectedItems={selectedProductsList}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            lang={lang}
            mode="public"
            travelersCount={travelersCount}
          />}
          {service.serviceType === "ACCOMMODATION" && (
            <div className="mt-4">
              <PaginationComponent
                {...productsPagination}
                onPageChange={(page) => handleFieldChange("page", page)}
                onLimitChange={(limit) => handleFieldChange("limit", limit)}
              />
            </div>
          )}
        </div>
      )}

      {/* =========================
          CONTINUE
      ========================= */}

      {(
        <div className="d-flex justify-content-end mt-4">
          <PublicButton
            variant="primary"
            onClick={handleContinue}
            disabled={submitLoading || loadingProducts || !hasSelectedProducts}
          >
            {submitLoading
              ? isArabic
                ? "جاري إنشاء الحجز..."
                : "Creating booking..."
              : isArabic
                ? "متابعة الحجز"
                : "Continue Booking"}
          </PublicButton>
        </div>
      )}
    </PublicPageLayout>
  );
}
