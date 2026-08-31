import { normalizeInventoryDate } from "../booking/inventory-service.js";

export const getDatesBetween = (startDate, endDate) => {
  const dates = [];
  const start = normalizeInventoryDate(startDate);
  const end = normalizeInventoryDate(endDate);

  if (!start || !end || end <= start) return dates;

  const current = new Date(start);
  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export const calculateAvailableCount = (record = {}) => {
  const total = Number(record.total || 0);
  const reserved = Number(record.reserved || 0);
  const blocked = Number(record.blocked || 0);
  return Math.max(0, total - reserved - blocked);
};

const summarizeInventoryPeriod = ({ records, expectedDays, requestedQuantity }) => {
  if (records.length < expectedDays) {
    return {
      isAvailable: false,
      minAvailable: 0,
      reason: "MISSING_INVENTORY",
      expectedDays,
      foundDays: records.length,
    };
  }

  const availableCounts = records.map((record) => {
    const storedAvailable = Number(record.available);
    return Number.isFinite(storedAvailable) && storedAvailable >= 0
      ? storedAvailable
      : calculateAvailableCount(record);
  });
  const minAvailable = Math.min(...availableCounts);
  const requested = Number(requestedQuantity || 1);

  return {
    isAvailable: minAvailable >= requested,
    minAvailable,
    reason: minAvailable >= requested ? "AVAILABLE" : "NOT_ENOUGH",
  };
};

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
    return { isAvailable: false, minAvailable: 0, reason: "INVALID_PERIOD" };
  }

  const records = await Inventory.find({
    inventoryType,
    itemId,
    date: {
      $gte: normalizeInventoryDate(startDate),
      $lt: normalizeInventoryDate(endDate),
    },
    isActive: true,
    isDeleted: { $ne: true },
  }).lean();

  return summarizeInventoryPeriod({
    records,
    expectedDays: dates.length,
    requestedQuantity,
  });
};

export const getInventoryAvailabilityByProduct = async ({
  products = [],
  Inventory,
  inventoryType,
  startDate,
  endDate,
  requestedQuantity = 1,
}) => {
  const dates = getDatesBetween(startDate, endDate);
  const productIds = products.map((product) => product?._id).filter(Boolean);
  const availabilityByProductId = new Map();

  if (!dates.length) {
    for (const productId of productIds) {
      availabilityByProductId.set(String(productId), {
        isAvailable: false,
        minAvailable: 0,
        reason: "INVALID_PERIOD",
      });
    }
    return availabilityByProductId;
  }

  if (!productIds.length) return availabilityByProductId;

  const records = await Inventory.find({
    inventoryType,
    itemId: { $in: productIds },
    date: {
      $gte: normalizeInventoryDate(startDate),
      $lt: normalizeInventoryDate(endDate),
    },
    isActive: true,
    isDeleted: { $ne: true },
  })
    .select("itemId total reserved blocked available date")
    .lean();

  const recordsByProductId = new Map();
  for (const record of records) {
    const key = String(record.itemId);
    recordsByProductId.set(key, [...(recordsByProductId.get(key) || []), record]);
  }

  for (const productId of productIds) {
    const key = String(productId);
    availabilityByProductId.set(key, summarizeInventoryPeriod({
      records: recordsByProductId.get(key) || [],
      expectedDays: dates.length,
      requestedQuantity,
    }));
  }

  return availabilityByProductId;
};

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
  const availabilityByProductId = await getInventoryAvailabilityByProduct({
    products,
    Inventory,
    inventoryType,
    startDate,
    endDate,
    requestedQuantity,
  });

  for (const product of products) {
    const availability = availabilityByProductId.get(String(product._id));

    if (!availability.isAvailable) continue;
    result.push(mapProduct({
      doc: product,
      type: inventoryType,
      availableCount: availability.minAvailable,
      extra: { isAlwaysAvailable: false, availabilityReason: availability.reason },
    }));
  }

  return result;
};

export const filterProductsByAvailabilityPolicy = async ({
  products = [],
  Inventory,
  inventoryType,
  startDate,
  endDate,
  requestedQuantity = 1,
  mapProduct,
}) => {
  const result = [];
  const limitedProducts = products.filter((product) => product.isAlwaysAvailable !== true);
  const availabilityByProductId = await getInventoryAvailabilityByProduct({
    products: limitedProducts,
    Inventory,
    inventoryType,
    startDate,
    endDate,
    requestedQuantity,
  });

  for (const product of products) {
    if (product.isAlwaysAvailable === true) {
      result.push(mapProduct({
        doc: product,
        type: inventoryType,
        availableCount: null,
        extra: { isAlwaysAvailable: true, availabilityReason: "ALWAYS_AVAILABLE" },
      }));
      continue;
    }

    const availability = availabilityByProductId.get(String(product._id));

    if (!availability.isAvailable) continue;
    result.push(mapProduct({
      doc: product,
      type: inventoryType,
      availableCount: availability.minAvailable,
      extra: { isAlwaysAvailable: false, availabilityReason: availability.reason },
    }));
  }

  return result;
};
