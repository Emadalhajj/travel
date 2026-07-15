/*

*/
import { normalizeString } from '../generic/normalizeString.js'
import { normalizeArray } from '../generic/normalizeArray.js'
import { roundPrice } from '../../utils/roundPrice.js'
/**
 * تطبيع التسعير الأساسي
 */

export const normalizePricing = (pricing = {}) => {
  // إذا كان التسعير بالشكل القديم (adult, child, infant)
  if (pricing.adult !== undefined || pricing.child !== undefined) {
    return {
      adult: Number(pricing.adult) || 0,
      child: Number(pricing.child) || 0,
      infant: Number(pricing.infant) || 0,
    };
  }

  // ✅ الشكل الجديد (basePrice + pricingPeriods)
  return {
    basePrice: Math.max(0, Number(pricing.basePrice) || 0),
    currency: ['SAR', 'USD', 'EUR', 'GBP', 'AED', 'EGP', 'TRY'].includes(pricing.currency)
      ? pricing.currency
      : 'SAR',
    
    // ✅ تطبيع فترات التسعير
    pricingPeriods: normalizeArray(pricing.pricingPeriods).map(period => ({
      nameAr: normalizeString(period.nameAr),
      nameEn: normalizeString(period.nameEn),
      periodType: ['weekend', 'seasonal', 'holiday', 'custom'].includes(period.periodType)
        ? period.periodType
        : 'custom',
      days: normalizeArray(period.days),
      startDate: period.startDate ? new Date(period.startDate) : undefined,
      endDate: period.endDate ? new Date(period.endDate) : undefined,
      price: Math.max(0, Number(period.price) || 0),
      isActive: period.isActive !== false,
      priority: Number(period.priority) || 0,
    })),
    
    discountPercent: Math.min(100, Math.max(0, Number(pricing.discountPercent) || 0)),
  };
};
