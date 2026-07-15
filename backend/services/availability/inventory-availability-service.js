/*
التحقق من التوفر المنتج من عدمه 
2) إنشاء Helper عام للتوافر
*/

import { normalizeDate } from "../booking/availability.js";

/*
=====================================================
Date Helpers
=====================================================
*/

export const getDatesBetween = (startDate, endDate) => {
  const dates = [];

  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (!start || !end || end <= start) return dates;

  const current = new Date(start);

  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/*
=====================================================
Inventory Calculations
=====================================================
*/

export const calculateAvailableCount = (record = {}) => {
  const total = Number(record.total || 0);
  const reserved = Number(record.reserved || 0);
  const blocked = Number(record.blocked || 0);

  return Math.max(0, total - reserved - blocked);
};

/*
=====================================================
Check One Product Availability
=====================================================
*/

export const checkInventoryForWholePeriod = async ({
  Inventory,
  inventoryType,
  itemId,
  startDate,
  endDate,
  requestedQuantity = 1,
}) => {
  const dates = getDatesBetween(startDate, endDate);

  if (!dates.length) {
    return {
      isAvailable: false,
      minAvailable: 0,
      reason: "INVALID_PERIOD",
    };
  }
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  const records = await Inventory.find({
    inventoryType,
    itemId,
    date: {
      $gte: start,
      $lt: end,
    },
    isActive: true,
    isDeleted: { $ne: true },
  }).lean();

  if (records.length < dates.length) {
    return {
      isAvailable: false,
      minAvailable: 0,
      reason: "MISSING_INVENTORY",
       expectedDays: dates.length,
      foundDays: records.length,
    };
  }

  // const availableCounts = records.map(calculateAvailableCount);
   const availableCounts = records.map((record) => {
    const total = Number(record.total || 0);
    const reserved = Number(record.reserved || 0);
    const blocked = Number(record.blocked || 0);
    const available = record.available !== undefined
      ? Number(record.available || 0)
      : Math.max(0, total - reserved - blocked);

    return available;
  });
  
  const minAvailable = Math.min(...availableCounts);


  return {
    isAvailable: minAvailable >= Number(requestedQuantity || 1),
    minAvailable,
    reason:
      minAvailable >= Number(requestedQuantity || 1)
        ? "AVAILABLE"
        : "NOT_ENOUGH",
  };
};

/*
=====================================================
Filter Products By Inventory
=====================================================
*/

export const filterProductsByInventory = async ({
  products = [],
  Inventory,
  inventoryType,
  startDate,
  endDate,
  requestedQuantity = 1,
  mapProduct,
}) => {
  const result = [];

  for (const product of products) {
    const availability = await checkInventoryForWholePeriod({
      Inventory,
      inventoryType,
      itemId: product._id,
      startDate,
      endDate,
      requestedQuantity,
    });

    if (!availability.isAvailable) continue;

    result.push(
      mapProduct({
        doc: product,
        type: inventoryType,
        availableCount: availability.minAvailable,
        extra: {
          availabilityReason: availability.reason,
          isAlwaysAvailable: false,
        },
      }),
    );
  }

  return result;
};

/*
=====================================================
Filter Products With Availability Policy
=====================================================

يستخدم مع الخدمات التي يمكن أن تكون:
- دائمة التوفر
- أو حسب المخزون
=====================================================
*/

export const filterProductsByAvailabilityPolicy = async ({
  products = [],
  Inventory,
  inventoryType,
  startDate,
  endDate,
  requestedQuantity = 1,
  mapProduct,
  forceAlwaysAvailable = false,
}) => {
  const result = [];

  for (const product of products) {
    if (forceAlwaysAvailable || product.isAlwaysAvailable === true) {
      result.push(
        mapProduct({
          doc: product,
          type: inventoryType,
          availableCount: null,
          extra: {
            isAlwaysAvailable: true,
            availabilityReason: "ALWAYS_AVAILABLE",
          },
        }),
      );

      continue;
    }

    const availability = await checkInventoryForWholePeriod({
      Inventory,
      inventoryType,
      itemId: product._id,
      startDate,
      endDate,
      requestedQuantity,
    });

    if (!availability.isAvailable) continue;

    result.push(
      mapProduct({
        doc: product,
        type: inventoryType,
        availableCount: availability.minAvailable,
        extra: {
          isAlwaysAvailable: false,
          availabilityReason: availability.reason,
        },
      }),
    );
  }

  return result;
};

//-----------------------

// export const getDatesBetween = (startDate, endDate) => {
//   const dates = [];

//   const start = normalizeDate(startDate);
//   const end = normalizeDate(endDate);

//   if (!start || !end) return dates;

//   const current = new Date(start);

//   while (current < end) {
//     dates.push(new Date(current));
//     current.setDate(current.getDate() + 1);
//   }

//   return dates;
// };
// /*
// =====================================================
// Inventory Calculations
// =====================================================
// */
// export const calculateAvailableCount = (record = {}) => {
//   const total = Number(record.total || 0);
//   const reserved = Number(record.reserved || 0);
//   const blocked = Number(record.blocked || 0);

//   return Math.max(0, total - reserved - blocked);
// };
// /*
// =====================================================
// Check One Product Availability
// =====================================================
// */

// export const checkInventoryForWholePeriod = async ({
//   Inventory,
//   inventoryType,
//   itemId,
//   startDate,
//   endDate,
//   requestedQuantity = 1,
// }) => {
//   const dates = getDatesBetween(startDate, endDate);

//   if (!dates.length) {
//     return {
//       isAvailable: false,
//       minAvailable: 0,
//       reason: "INVALID_PERIOD",
//     };
//   }

//   const records = await Inventory.find({
//     inventoryType,
//     itemId,
//     date: { $in: dates },
//     isActive: true,
//   }).lean();

//   if (records.length < dates.length) {
//     return {
//       isAvailable: false,
//       minAvailable: 0,
//       reason: "MISSING_INVENTORY",
//     };
//   }

//   const availableCounts = records.map(calculateAvailableCount);
//   const minAvailable = Math.min(...availableCounts);

//   return {
//     isAvailable: minAvailable >= Number(requestedQuantity || 1),
//     minAvailable,
//     reason:
//       minAvailable >= Number(requestedQuantity || 1)
//         ? "AVAILABLE"
//         : "NOT_ENOUGH",
//   };
// };

// export const hasInventoryForWholePeriod = async ({
//   Inventory,
//   inventoryType,
//   itemId,
//   startDate,
//   endDate,
//   requestedQuantity = 1,
// }) => {
//   const dates = getDatesBetween(startDate, endDate);

//   if (!dates.length) {
//     return {
//       isAvailable: false,
//       minAvailable: 0,
//       reason: "INVALID_DATES",
//     };
//   }

//   const records = await Inventory.find({
//     inventoryType,
//     itemId,
//     date: { $in: dates },
//     isActive: true,
//   }).lean();

//   if (records.length < dates.length) {
//     return {
//       isAvailable: false,
//       minAvailable: 0,
//       reason: "MISSING_INVENTORY_DAYS",
//     };
//   }

//   const availableCounts = records.map(calculateAvailableCount);

//   const minAvailable = Math.min(...availableCounts);

//   return {
//     isAvailable: minAvailable >= requestedQuantity,
//     minAvailable,
//     reason:
//       minAvailable >= requestedQuantity
//         ? "AVAILABLE"
//         : "NOT_ENOUGH_INVENTORY",
//   };
// };
// /*
// =====================================================
// Filter Products By Inventory
// =====================================================
// */
// export const filterAvailableProductsByInventory = async ({
//   products = [],
//   Inventory,
//   inventoryType,
//   startDate,
//   endDate,
//   requestedQuantity = 1,
//   mapProduct,
// }) => {
//   const result = [];

//   for (const product of products) {
//     if (product.isAlwaysAvailable) {
//       result.push(
//         mapProduct({
//           doc: product,
//           type: inventoryType,
//           availableCount: null,
//           extra: {
//             isAlwaysAvailable: true,
//           },
//         }),
//       );

//       continue;
//     }

//     const availability = await hasInventoryForWholePeriod({
//       Inventory,
//       inventoryType,
//       itemId: product._id,
//       startDate,
//       endDate,
//       requestedQuantity,
//     });

//     if (availability.isAvailable) {
//       result.push(
//         mapProduct({
//           doc: product,
//           type: inventoryType,
//           availableCount: availability.minAvailable,
//           extra: {
//             isAlwaysAvailable: false,
//           },
//         }),
//       );
//     }
//   }

//   return result;
// };
