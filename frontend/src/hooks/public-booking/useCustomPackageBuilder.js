import { useMemo, useState, useCallback } from "react";

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

const initialCustomer = {
  name: "",
  email: "",
  phone: "",
  nationality: "",
};

const createEmptyTraveler = (nationality = "") => ({
  fullName: "",
  passportNumber: "",
  nationality,
  birthDate: "",
  gender: "male",
});

export default function useCustomPackageBuilder() {
  const [formData, setFormData] = useState(initialFormData);

  const [customer, setCustomer] = useState(initialCustomer);

  const [travelers, setTravelers] = useState([
    createEmptyTraveler(initialFormData.nationality),
  ]);

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

      /*
      إذا تغير عدد المعتمرين، نحدث travelers تلقائيًا.
      */
      if (name === "travelersCount") {
        const count = Math.max(1, Number(value) || 1);

        setTravelers((prevTravelers) =>
          Array.from({ length: count }, (_, index) => {
            return (
              prevTravelers[index] || createEmptyTraveler(next.nationality)
            );
          }),
        );

        next.travelersCount = count;
      }

      /*
      إذا تغيرت الجنسية العامة، نحدث جنسية العميل والمعتمرين
      في حال لم تكن معبأة مسبقًا.
      */
      if (name === "nationality") {
        setCustomer((prevCustomer) => ({
          ...prevCustomer,
          nationality: prevCustomer.nationality || value,
        }));

        setTravelers((prevTravelers) =>
          prevTravelers.map((traveler) => ({
            ...traveler,
            nationality: traveler.nationality || value,
          })),
        );
      }

      return next;
    });
  };

  /*
  =====================================================
  handleCustomerChange
  =====================================================
  تعديل بيانات العميل المسؤول عن الحجز.
  */
  const handleCustomerChange = (name, value) => {
    setCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
  =====================================================
  handleTravelerChange
  =====================================================
  تعديل بيانات معتمر واحد.
  */
  const handleTravelerChange = (index, name, value) => {
    setTravelers((prev) =>
      prev.map((traveler, travelerIndex) =>
        travelerIndex === index
          ? {
              ...traveler,
              [name]: value,
            }
          : traveler,
      ),
    );
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
      const currentCategoryProducts = prev[category] || [];

      const productId =
        product._id || product.id || product.refId || product.itemId;

      const alreadyExists = currentCategoryProducts.some((item) => {
        const itemId = item._id || item.id || item.refId || item.itemId;

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
          const itemId = item._id || item.id || item.refId || item.itemId;

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

  /*
  =====================================================
  buildDraftCreatePayload
  =====================================================
  إنشاء المسودة أولًا.

  حسب service الحالي:
  createDraftBooking يحفظ:
  - customer
  - currentStep
  - status
  - expiresAt
  */
  const buildDraftCreatePayload = () => ({
    customer,
    currentStep: "customer_info",
  });

  /*
  =====================================================
  buildDraftUpdatePayload
  =====================================================
  بعد إنشاء المسودة نحدثها بكامل تفاصيل البرنامج المخصص.
  */
  const buildDraftUpdatePayload = () => ({
    customer,
    travelers,
    program: buildProgramSnapshot(),
    hotel: buildHotelSnapshot(),
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

  /*
  =====================================================
  resetBuilder
  =====================================================
  إعادة كل شيء للوضع الافتراضي.
  */
  const resetBuilder = useCallback(() => {
    setFormData(initialFormData);
    setCustomer(initialCustomer);
    setTravelers([createEmptyTraveler(initialFormData.nationality)]);
    setSelectedProducts({});
  }, []);

  return {
    formData,
    customer,
    travelers,

    selectedProducts,
    selectedProductsList,

    pricing,

    handleFormChange,
    handleCustomerChange,
    handleTravelerChange,

    addProduct,
    removeProduct,
    clearCategory,
    clearSelectedProducts,

    buildDraftCreatePayload,
    buildDraftUpdatePayload,

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
