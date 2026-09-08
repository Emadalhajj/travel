import { useMemo, useState, useCallback } from "react";
import {
  compactTravelProduct,
  getProductSelectionId,
  isTravelCategory,
} from "../../Utils/products/productSelection";

/*
=========================================================
useCustomPackageBuilder
=========================================================

هذا Hook مسؤول عن إدارة بناء برنامج مخصص للعميل.

المسؤوليات:
---------------------------------------------------------
1- حفظ بيانات البحث الأساسية:
   startDate
   endDate
   travelersCount
   nationality

2- حفظ المنتجات التي اختارها العميل.

3- إضافة / حذف منتج من البرنامج المخصص.

4- حساب التسعير المؤقت للـ Draft Booking.

5- تجهيز Payload مطابق لموديل DraftBooking في الباك اند.

مهم:
---------------------------------------------------------
هذا Hook لا يجلب المنتجات من API.
جلب المنتجات يبقى داخل:
useAvailableProducts

وهذا تطبيق لفصل المسؤوليات:
---------------------------------------------------------
useAvailableProducts      => جلب المنتجات المتاحة
useCustomPackageBuilder   => إدارة الاختيارات وبناء Draft Payload
=========================================================
*/

const initialFormData = {
  startDate: "",
  endDate: "",
  travelersCount: 1,
  nationality: "",
};

export default function useCustomPackageBuilder() {
  const [formData, setFormData] = useState(initialFormData);

  /*
  selectedProducts شكلها:
  {
    visas: [],
    hotels: [],
    trips: [],
    transports: [],
    visits: [],
    extras: []
  }
  */
  const [selectedProducts, setSelectedProducts] = useState({});

  /*
  =====================================================
  handleFormChange
  =====================================================
  تعديل بيانات البرنامج المخصص.
  */
  const handleFormChange = (name, value) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === "travelersCount") {
        const count = Math.max(1, Number(value) || 1);
        next.travelersCount = count;
      }

      return next;
    });

    if (["startDate", "endDate", "travelersCount"].includes(name)) {
      setSelectedProducts((prev) => ({ ...prev, flights: [], trips: [] }));
    }
  };

  /*
  =====================================================
  addProduct
  =====================================================
  إضافة منتج إلى تصنيف معين.

  category مثال:
  visas
  hotels
  trips
  transports
  visits
  extras
  */
  const addProduct = (category, product) => {
    if (!category || !product) return;

    setSelectedProducts((prev) => {
      if (isTravelCategory(category)) {
        const travelProduct = compactTravelProduct({ ...product, category });
        return {
          ...prev,
          flights: category === "flights" ? [travelProduct] : [],
          trips: category === "trips" ? [travelProduct] : [],
        };
      }

      const currentCategoryProducts = prev[category] || [];
      const productId = getProductSelectionId(product);

      const alreadyExists = currentCategoryProducts.some((item) => {
        const itemId = getProductSelectionId(item);

        return String(itemId) === String(productId);
      });

      if (alreadyExists) {
        return prev;
      }

      return {
        ...prev,
        [category]: [...currentCategoryProducts, product],
      };
    });
  };

  /*
  =====================================================
  removeProduct
  =====================================================
  حذف منتج من تصنيف معين.
  */
  const removeProduct = (category, productId) => {
    if (!category || !productId) return;

    setSelectedProducts((prev) => {
      const currentCategoryProducts = prev[category] || [];

      return {
        ...prev,
        [category]: currentCategoryProducts.filter((item) => {
          const itemId = getProductSelectionId(item);

          return String(itemId) !== String(productId);
        }),
      };
    });
  };

  /*
  =====================================================
  clearCategory
  =====================================================
  حذف كل المنتجات من تصنيف معين.
  */
  const clearCategory = (category) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [category]: [],
    }));
  };

  /*
  =====================================================
  clearSelectedProducts
  =====================================================
  حذف كل المنتجات المختارة.
  */
  const clearSelectedProducts = () => {
    setSelectedProducts({});
  };

  /*
  =====================================================
  selectedProductsList
  =====================================================
  تحويل object التصنيفات إلى array واحدة.
  مفيد للحساب أو العرض.
  */
  const selectedProductsList = useMemo(() => {
    return Object.entries(selectedProducts).flatMap(([category, items]) =>
      (items || []).map((item) => ({
        ...item,
        category,
      })),
    );
  }, [selectedProducts]);

  /*
  =====================================================
  pricing
  =====================================================
  حساب السعر المؤقت للبرنامج المخصص.

  ملاحظة:
  هذا حساب واجهة فقط.
  السعر النهائي يجب أن يحسب أو يعتمد في الباك اند لاحقًا.
  */
  const pricing = useMemo(() => {
    const travelersCount = Number(formData.travelersCount) || 1;

    const subtotal = selectedProductsList.reduce((sum, item) => {
      const raw = item.raw || item;
      const price =
        Number(item.priceAtTime) ||
        Number(raw.price) ||
        Number(raw.basePrice) ||
        Number(raw.pricing?.totalPrice) ||
        Number(raw.pricing?.basePrice) ||
        Number(raw.pricing?.price) ||
        0;

      const quantityBased =
        item.category === "visas" ||
        item.category === "flights" ||
        item.category === "trips" ||
        item.category === "visits" ||
        item.category === "extras";

      const lineTotal = quantityBased ? price * travelersCount : price;

      return sum + lineTotal;
    }, 0);

    const tax = 0;
    const discount = 0;
    const total = Math.max(0, subtotal + tax - discount);

    return {
      subtotal,
      tax,
      discount,
      total,
      currency: "SAR",
    };
  }, [selectedProductsList, formData.travelersCount]);

  /*
  =====================================================
  buildProgramSnapshot
  =====================================================
  لأن البرنامج مخصص وليس برنامج جاهز من UmrahProgram،
  لا يوجد programId.

  لذلك نحفظ nameAr/nameEn وصفًا واضحًا.
  */
  const buildProgramSnapshot = () => {
    return {
      programId: null,
      nameAr: "برنامج عمرة مخصص",
      nameEn: "Custom Umrah Package",
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    };
  };

  /*
  =====================================================
  buildHotelSnapshot
  =====================================================
  DraftBooking model يحتوي hotel object واحد.
  لذلك نأخذ أول فندق / غرفة مختارة.
  */
  const buildHotelSnapshot = () => {
    const selectedHotel =
      selectedProducts.roomTypes?.[0] ||
      selectedProducts.hotels?.[0] ||
      selectedProducts.hotel?.[0] ||
      null;

    if (!selectedHotel) {
      return {};
    }

    const raw = selectedHotel.raw || selectedHotel;

    return {
      hotelId:
        raw.hotelId ||
        raw.hotel?._id ||
        raw.hotel ||
        selectedHotel.hotelId ||
        selectedHotel.hotel?._id ||
        selectedHotel._id ||
        selectedHotel.productId ||
        null,

      nameAr:
        raw.hotelNameAr ||
        raw.hotel?.nameAr ||
        raw.nameAr ||
        selectedHotel.hotelNameAr ||
        selectedHotel.nameAr ||
        "",

      nameEn:
        raw.hotelNameEn ||
        raw.hotel?.nameEn ||
        raw.nameEn ||
        selectedHotel.hotelNameEn ||
        selectedHotel.nameEn ||
        "",

      roomType:
        raw.roomType ||
        raw.roomTypeName ||
        raw.nameAr ||
        raw.nameEn ||
        selectedHotel.nameAr ||
        selectedHotel.nameEn ||
        "",

      nights: calculateNights(formData.startDate, formData.endDate),
    };
  };

  /*
  =====================================================
  buildTransportSnapshot
  =====================================================
  DraftBooking model يحتوي transport object واحد.
  لذلك نأخذ أول نقل مختار.
  */
  const buildTransportSnapshot = () => {
    const selectedTransport =
      selectedProducts.transports?.[0] ||
      selectedProducts.transport?.[0] ||
      selectedProducts.vehicleRentals?.[0] ||
      null;

    if (!selectedTransport) {
      return null;
    }

    const raw = selectedTransport.raw || selectedTransport;
    const linkedTransport = raw.transport || selectedTransport.transport;

    return {
      transportId:
        raw.transportId ||
        linkedTransport?._id ||
        raw._id ||
        selectedTransport.transportId ||
        selectedTransport._id ||
        selectedTransport.productId ||
        null,

      type:
        linkedTransport?.vehicleType ||
        raw.vehicleType ||
        raw.transportType ||
        raw.type ||
        raw.nameAr ||
        raw.nameEn ||
        selectedTransport.nameAr ||
        selectedTransport.nameEn ||
        "",

      pickupLocation:
        raw.pickupLocation ||
        raw.fromLocation ||
        raw.fromCity ||
        selectedTransport.pickupLocation ||
        "",

      dropoffLocation:
        raw.dropoffLocation ||
        raw.toLocation ||
        raw.toCity ||
        selectedTransport.dropoffLocation ||
        "",
    };
  };

  const buildTripSnapshot = () => {
    const selectedTrip =
      selectedProducts.flights?.[0] ||
      selectedProducts.trips?.[0] ||
      selectedProducts.trip?.[0] ||
      null;

    if (!selectedTrip) return null;

    const raw = selectedTrip.raw || selectedTrip;
    const departureId =
      raw.departureId || selectedTrip.departureId || raw._id || selectedTrip._id;
    const tripId = raw.tripId || selectedTrip.tripId || null;

    if (!departureId || !tripId) return null;

    return {
      tripId,
      departureId,
      nameAr: raw.nameAr || selectedTrip.nameAr || "",
      nameEn: raw.nameEn || selectedTrip.nameEn || "",
      tripType: raw.tripType || selectedTrip.tripType || "",
      scope: raw.scope || selectedTrip.scope || "",
      subtype: raw.subtype || selectedTrip.subtype || "",
      source: raw.source || selectedTrip.source || "",
      fromCity: raw.fromCity || selectedTrip.fromCity || "",
      toCity: raw.toCity || selectedTrip.toCity || "",
      departureAt: raw.departureAt || selectedTrip.departureAt || null,
      arrivalAt: raw.arrivalAt || selectedTrip.arrivalAt || null,
      quantity: selectedTrip.quantity || raw.quantity || 1,
      chargeType: selectedTrip.chargeType || raw.chargeType || "PER_TRAVELER",
      unitPrice: Number(
        raw.pricing?.finalPrice ??
        raw.pricing?.unitPrice ??
        selectedTrip.priceAtTime ??
        raw.price ??
        0,
      ),
      currency: raw.pricing?.currency || raw.currency || selectedTrip.currency || "SAR",
    };
  };

  /*
  =====================================================
  buildDraftCreatePayload
  =====================================================
  إنشاء المسودة أولًا.

  ننشئ المسودة بالخطوة التالية فقط؛ بيانات العميل والمعتمرين
  تُجمع لاحقًا في صفحة Booking Party الموحدة.
  */
  const buildDraftCreatePayload = () => ({
    currentStep: "customer_info",
  });

  /*
  =====================================================
  buildDraftUpdatePayload
  =====================================================
  بعد إنشاء المسودة نحدثها بكامل تفاصيل البرنامج المخصص.
  */
  const buildDraftUpdatePayload = () => ({
    program: buildProgramSnapshot(),
    hotel: buildHotelSnapshot(),
    trip: buildTripSnapshot(),
    transport: buildTransportSnapshot(),
    pricing,
    currentStep: "customer_info",

    data: {
      packageType: "CUSTOM_PACKAGE",
      selectedProducts: selectedProductsList,
      selectedProductsByCategory: selectedProducts,
      searchCriteria: formData,
    },
  });

  const hasValidTravelSelection = () => {
    const selected = selectedProducts.flights?.[0] || selectedProducts.trips?.[0];
    if (!selected) return true;
    return Boolean(selected.tripId && selected.departureId && selected.departureAt);
  };

  /*
  =====================================================
  resetBuilder
  =====================================================
  إعادة كل شيء للوضع الافتراضي.
  */
  const resetBuilder = useCallback(() => {
    setFormData(initialFormData);
    setSelectedProducts({});
  }, []);

  return {
    formData,
    selectedProducts,
    selectedProductsList,

    pricing,

    handleFormChange,
    addProduct,
    removeProduct,
    clearCategory,
    clearSelectedProducts,

    buildDraftCreatePayload,
    buildDraftUpdatePayload,
    hasValidTravelSelection,

    resetBuilder,
  };
}

/*
=========================================================
Helpers
=========================================================
*/

function calculateNights(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diff = end.getTime() - start.getTime();

  if (diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
