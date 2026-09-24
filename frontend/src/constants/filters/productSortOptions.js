export const createProductSortOptions = (priceField = "pricing.basePrice") => [
  {
    value: "createdAt_desc",
    labelAr: "الأحدث أولاً",
    labelEn: "Newest First",
  },
  {
    value: "createdAt_asc",
    labelAr: "الأقدم أولاً",
    labelEn: "Oldest First",
  },
  {
    value: `${priceField}_asc`,
    labelAr: "السعر من الأقل للأعلى",
    labelEn: "Price Low to High",
  },
  {
    value: `${priceField}_desc`,
    labelAr: "السعر من الأعلى للأقل",
    labelEn: "Price High to Low",
  },
];

export const PRODUCT_SORT_OPTIONS = createProductSortOptions();
export const VISA_SORT_OPTIONS = createProductSortOptions("price");
