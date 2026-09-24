const selectedScope = (state = {}) => state.applicableTo?.scope === "SELECTED";

export const couponFormConfig = ({ productOptions = [] } = {}) => ({
  commonFields: [
    { name: "code", labelAr: "رمز الكوبون", labelEn: "Coupon Code", type: "text", required: true, col: 4, order: 1 },
    { name: "discountType", labelAr: "نوع الخصم", labelEn: "Discount Type", type: "select", required: true, defaultValue: "PERCENTAGE", options: [{ value: "PERCENTAGE", labelAr: "نسبة", labelEn: "Percentage" }, { value: "FIXED", labelAr: "مبلغ ثابت", labelEn: "Fixed" }], col: 4, order: 1 },
    { name: "value", labelAr: "القيمة", labelEn: "Value", type: "number", required: true, min: 0, step: 0.01, col: 4, order: 1 },
    { name: "startsAt", labelAr: "يبدأ في", labelEn: "Starts At", type: "datetime-local", col: 4, order: 2 },
    { name: "expiresAt", labelAr: "ينتهي في", labelEn: "Expires At", type: "datetime-local", col: 4, order: 2 },
    { name: "minimumAmount", labelAr: "الحد الأدنى", labelEn: "Minimum Amount", type: "number", min: 0, defaultValue: 0, col: 4, order: 2 },
    { name: "usageLimit", labelAr: "حد الاستخدام العام", labelEn: "Usage Limit", type: "number", min: 1, col: 4, order: 3 },
    { name: "perCustomerLimit", labelAr: "حد العميل", labelEn: "Per Customer Limit", type: "number", min: 1, defaultValue: 1, col: 4, order: 3 },
    { name: "applicableTo.scope", labelAr: "نطاق التطبيق", labelEn: "Scope", type: "select", defaultValue: "ALL", options: [{ value: "ALL", labelAr: "الكل", labelEn: "All" }, { value: "SELECTED", labelAr: "محدد", labelEn: "Selected" }], col: 4, order: 3 },
    { name: "applicableTo.serviceTypes", labelAr: "أنواع الخدمات", labelEn: "Service Types", type: "checkbox-group", valueMode: "array", options: ["PROGRAM", "ACCOMMODATION", "VISA", "FLIGHT", "TRIP", "TRANSPORT", "VEHICLE_RENTAL", "EXTRA_SERVICE"].map((value) => ({ value, labelAr: value, labelEn: value })), col: 12, order: 4, visibleWhen: selectedScope },
    { name: "applicableTo.productIds", labelAr: "المنتجات المسموح لها بالكوبون", labelEn: "Coupon eligible products", type: "checkbox-group", valueMode: "array", options: productOptions, helpTextAr: "تظهر هنا فقط المنتجات التي فُعّل لها خيار السماح بالكوبونات.", helpTextEn: "Only products with Allow Coupons enabled are listed.", col: 12, order: 4, visibleWhen: selectedScope },
    { name: "isActive", labelAr: "نشط", labelEn: "Active", type: "checkbox", defaultValue: true, col: 4, order: 5 },
  ],
});
