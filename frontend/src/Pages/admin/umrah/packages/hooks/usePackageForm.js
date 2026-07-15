import { useCallback, useMemo, useState } from "react";

export default function usePackageForm() {
  const [basicInfo, setBasicInfo] = useState({
    nameAr: "",
    nameEn: "",
    shortDescriptionAr: "",
    shortDescriptionEn: "",
    descriptionAr: "",
    descriptionEn: "",
    startDate: "",
    endDate: "",
    maxCapacity: 1,
    serviceLevel: "economy",
    status: "draft",
    images: [],
  });

  const [discount, setDiscount] = useState({
    discountType: "none",
    discountPercentage: 0,
    discountAmount: 0,
    discountExpiresAt: "",
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [loadingSave, setLoadingSave] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const canLoadProducts = Boolean(
    basicInfo?.startDate && basicInfo?.endDate
  );

  // addition 
  const addItem = (product, category) => {
    const categoryKey = category?.key || product?.category || product?.type;
    const categoryLabel =
      category?.labelAr ||
      product?.categoryLabel ||
      product?.category ||
      categoryKey ||
      "";
    const productId =
      product?.productId ||
      product?._id ||
      product?.id ||
      product?.refId ||
      product?.itemId;

    if (!productId || !categoryKey) return;

    const image = product.images?.[0] || product.image || product.mainImage || null;

    setSelectedItems((prev) => {
      const exists = prev.some(
        (item) =>
          String(item.productId) === String(productId) &&
          item.category === categoryKey
      );

      if (exists) return prev;

      return [
        ...prev,
        {
          productId,
          category: categoryKey,
          categoryLabel,
          nameAr: product.nameAr || product.name?.ar || product.name,
          nameEn: product.nameEn || product.name?.en || product.name,
          descriptionAr: product.descriptionAr || product.description || "",
          descriptionEn: product.descriptionEn || product.description || "",
          image,
          priceAtTime:
            product.priceAtTime ||
            product.price ||
            product.basePrice ||
            product.pricing?.basePrice ||
            0,
          currency: product.currency || product.pricing?.currency || "SAR",
          quantity: Number(basicInfo.maxCapacity || 1),
          productSnapshot: product,
        },
      ];
    });
  };

  // edit and upload info

const loadPackageForEdit = useCallback((program) => {
  setBasicInfo({
    nameAr: program.nameAr || "",
    nameEn: program.nameEn || "",
    shortDescriptionAr: program.shortDescriptionAr || "",
    shortDescriptionEn: program.shortDescriptionEn || "",
    descriptionAr: program.descriptionAr || "",
    descriptionEn: program.descriptionEn || "",
    startDate: program.startDate?.slice(0, 10) || "",
    endDate: program.endDate?.slice(0, 10) || "",
    maxCapacity: program.capacity?.totalSeats || 1,
    serviceLevel: program.serviceLevel || "economy",
    status: program.status || "draft",
    images: program.images || [],
  });

  setDiscount({
    discountType: program.pricing?.discountType || "none",
    discountPercentage: program.pricing?.discountPercentage || 0,
    discountAmount: program.pricing?.discountAmount || 0,
    discountExpiresAt: program.pricing?.discountExpiresAt?.slice(0, 10) || "",
  });

  setSelectedItems(program.items || []);
}, []);


  const removeItem = (item) => {
    setSelectedItems((prev) =>
      prev.filter(
        (x) =>
          !(
            String(x.productId) === String(item.productId) &&
            x.category === item.category
          )
      )
    );
  };

  const totals = useMemo(() => {
    const totalBeforeDiscount = selectedItems.reduce((sum, item) => {
      return sum + Number(item.priceAtTime || 0) * Number(item.quantity || 1);
    }, 0);

    let discountValue = 0;

    if (discount.discountType === "percentage") {
      discountValue =
        totalBeforeDiscount *
        (Number(discount.discountPercentage || 0) / 100);
    }

    if (discount.discountType === "fixed") {
      discountValue = Number(discount.discountAmount || 0);
    }

    const finalPrice = Math.max(totalBeforeDiscount - discountValue, 0);

    return {
      currency: "SAR",
      totalBeforeDiscount,
      discountValue,
      finalPrice,
    };
  }, [selectedItems, discount]);

  //
  const calculateDurationDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 1;
};

  const buildPayload = (basicInfoOverride = {}) => {
  const currentBasicInfo = {
    ...basicInfo,
    ...basicInfoOverride,
  };

  const durationDays = calculateDurationDays(
    currentBasicInfo.startDate,
    currentBasicInfo.endDate
  );

  const maxCapacity = Number(currentBasicInfo.maxCapacity || 1);

  return {
    nameAr: currentBasicInfo.nameAr,
    nameEn: currentBasicInfo.nameEn,

    shortDescriptionAr: currentBasicInfo.shortDescriptionAr,
    shortDescriptionEn: currentBasicInfo.shortDescriptionEn,

    descriptionAr: currentBasicInfo.descriptionAr,
    descriptionEn: currentBasicInfo.descriptionEn,

    images: currentBasicInfo.images || [],

    startDate: currentBasicInfo.startDate,
    endDate: currentBasicInfo.endDate,
    durationDays,

    serviceLevel: currentBasicInfo.serviceLevel,
    status: currentBasicInfo.status,

    capacity: {
      totalSeats: maxCapacity,
      availableSeats: maxCapacity,
    },

    pricing: {
      basePrice: totals.totalBeforeDiscount,
      totalPrice: totals.totalBeforeDiscount,
      discountType: discount.discountType,
      discountPercentage: Number(discount.discountPercentage || 0),
      discountAmount: Number(discount.discountAmount || 0),
      discountExpiresAt: discount.discountExpiresAt || null,
      finalPrice: totals.finalPrice,
      currency: totals.currency || "SAR",
    },

    items: selectedItems.map((item) => ({
      productId: item.productId,
      category: item.category,
      categoryLabel: item.categoryLabel,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      descriptionAr: item.descriptionAr,
      descriptionEn: item.descriptionEn,
      image: item.image,
      priceAtTime: Number(item.priceAtTime || 0),
      quantity: Number(item.quantity || 1),
      currency: item.currency || "SAR",
      productSnapshot: item.productSnapshot || null,
    })),

    availabilityPeriod: {
      startDate: currentBasicInfo.startDate,
      endDate: currentBasicInfo.endDate,
    },
  };
};

  return {
 basicInfo,
  setBasicInfo,
  selectedItems,
  setSelectedItems,
  discount,
  setDiscount,
  totals,
  loadingSave,
  setLoadingSave,
  formErrors,
  setFormErrors,
  addItem,
  removeItem,
  buildPayload,
  canLoadProducts,
  loadPackageForEdit,
  };
}
