const taxEnabled = (state = {}) => state.pricingPolicy?.tax?.enabled === true;
const discountEnabled = (state = {}) => state.pricingPolicy?.discount?.enabled === true;

export const createPricingPolicyFields = ({ order = 50 } = {}) => [
  { name: "pricingPolicy.tax.enabled", labelAr: "تطبيق الضريبة", labelEn: "Apply Tax", type: "checkbox", col: 4, defaultValue: false, order },
  { name: "pricingPolicy.tax.rate", labelAr: "نسبة الضريبة %", labelEn: "Tax Rate %", type: "number", col: 4, min: 0, max: 100, step: 0.01, defaultValue: 0, visibleWhen: taxEnabled, order },
  { name: "pricingPolicy.tax.inclusive", labelAr: "السعر شامل الضريبة", labelEn: "Tax Included in Price", type: "checkbox", col: 4, defaultValue: false, visibleWhen: taxEnabled, order, helpTextAr: "فعّله فقط إذا كان السعر المدخل يتضمن الضريبة أصلًا؛ عندها تُستخرج الضريبة من السعر ولا تضاف فوقه.", helpTextEn: "Enable only when the entered price already includes tax; tax is extracted instead of added on top." },
  { name: "pricingPolicy.discount.enabled", labelAr: "تطبيق خصم إداري", labelEn: "Apply Admin Discount", type: "checkbox", col: 4, defaultValue: false, order: order + 1 },
  { name: "pricingPolicy.discount.type", labelAr: "نوع الخصم", labelEn: "Discount Type", type: "select", col: 4, defaultValue: "PERCENTAGE", options: [{ value: "PERCENTAGE", labelAr: "نسبة مئوية", labelEn: "Percentage" }, { value: "FIXED", labelAr: "مبلغ ثابت", labelEn: "Fixed Amount" }], visibleWhen: discountEnabled, order: order + 1 },
  { name: "pricingPolicy.discount.value", labelAr: "قيمة الخصم", labelEn: "Discount Value", type: "number", col: 4, min: 0, step: 0.01, defaultValue: 0, visibleWhen: discountEnabled, order: order + 1 },
  { name: "pricingPolicy.discount.expiresAt", labelAr: "تاريخ انتهاء الخصم", labelEn: "Discount Expiry Date", type: "date", col: 6, visibleWhen: discountEnabled, order: order + 2 },
  { name: "pricingPolicy.couponEligible", labelAr: "السماح للعملاء باستخدام كوبونات الخصم النشطة على هذا المنتج أثناء الحجز", labelEn: "Allow customers to use active discount coupons on this product during booking", type: "checkbox", col: 6, defaultValue: false, order: order + 2 },
];
