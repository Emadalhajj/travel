// services/booking/inventory-service.js

/*
=====================================================
Inventory Service
=====================================================

هذا الملف يحتوي منطق المخزون.

المسؤوليات:
-----------------------------------------------------
1- توحيد التاريخ.
2- إنشاء مخزون تلقائي إذا لم يكن موجودًا.
3- التحقق من توفر المخزون.
4- حجز المخزون.
5- تحرير المخزون عند الإلغاء.
=====================================================
*/

import AppError from "../../utils/AppError.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import Inventory from "../../models/inventory-model.js";

/*
=====================================================
Helpers
=====================================================
*/

export const normalizeInventoryDate = (value) => {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const getDatesBetween = ({ startDate, endDate }) => {
  const start = normalizeInventoryDate(startDate);
  const end = normalizeInventoryDate(endDate);

  const dates = [];

  if (!start || !end || end <= start) return dates;

  const current = new Date(start);

  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const getLanguage = (req) => {
  return req ? isArabicRequest(req) : true;
};

/*
=====================================================
Get Or Create Inventory
=====================================================

إذا لم يوجد مخزون لهذا اليوم، يتم إنشاؤه تلقائيًا.
*/

export const getOrCreateInventory = async ({
  Inventory,
  inventoryType,
  itemId,
  date,
  total,
  userId,
}) => {
  const normalizedDate = normalizeInventoryDate(date);
  const initialTotal = Number(total) || 0;

  return Inventory.findOneAndUpdate(
    { inventoryType, itemId, date: normalizedDate },
    {
      $setOnInsert: {
        inventoryType,
        itemId,
        date: normalizedDate,
        total: initialTotal,
        reserved: 0,
        blocked: 0,
        available: initialTotal,
        isActive: true,
        isDeleted: false,
        createdBy: userId,
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
};

const reserveInventoryDateAtomic = async ({
  Inventory,
  inventoryType,
  itemId,
  date,
  requested,
  defaultTotal,
  userId,
}) => {
  const normalizedDate = normalizeInventoryDate(date);

  await getOrCreateInventory({
    Inventory,
    inventoryType,
    itemId,
    date: normalizedDate,
    total: defaultTotal,
    userId,
  });

  return Inventory.findOneAndUpdate(
    {
      inventoryType,
      itemId,
      date: normalizedDate,
      isActive: true,
      isDeleted: { $ne: true },
      available: { $gte: requested },
    },
    {
      $inc: { reserved: requested, available: -requested },
      ...(userId ? { $set: { updatedBy: userId } } : {}),
    },
    { new: true, runValidators: true },
  );
};

const rollbackReservedInventoryDates = async ({
  Inventory,
  inventoryType,
  itemId,
  dates,
  quantity,
  userId,
}) => {
  for (const date of dates) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const normalizedDate = normalizeInventoryDate(date);
      const before = await Inventory.findOne({
        inventoryType,
        itemId,
        date: normalizedDate,
      }).lean();

      if (!before || Number(before.reserved || 0) < quantity) {
        throw new AppError(
          "تعذر التراجع عن حجز المخزون بالكامل",
          409,
          "inventory",
        );
      }

      const total = Number(before.total || 0);
      const reserved = Number(before.reserved || 0);
      const blocked = Number(before.blocked || 0);
      const available = Number(before.available || 0);
      const updated = await Inventory.findOneAndUpdate(
        {
          _id: before._id,
          total,
          reserved,
          blocked,
          available,
        },
        {
          $set: {
            reserved: reserved - quantity,
            available: Math.min(
              available + quantity,
              Math.max(total - blocked, 0),
            ),
            ...(userId ? { updatedBy: userId } : {}),
          },
        },
        { new: true, runValidators: true },
      );

      if (updated) break;
      if (attempt === 4) {
        throw new AppError(
          "تعذر التراجع عن حجز المخزون بسبب تغيره أثناء العملية",
          409,
          "inventory",
        );
      }
    }
  }
};

/*
=====================================================
Check Inventory Availability
=====================================================

يتحقق من توفر كمية معينة في فترة معينة.
*/

export const checkInventoryAvailability = async ({
  Inventory,
  inventoryType,
  itemId,
  startDate,
  endDate,
  requested = 1,
  defaultTotal = 0,
  req = null,
}) => {
  const isArabic = getLanguage(req);

  const dates = getDatesBetween({
    startDate,
    endDate,
  });

  if (!dates.length) {
    throw new AppError(
      isArabic ? "تواريخ المخزون غير صحيحة" : "Invalid inventory dates",
      400,
      "dates",
    );
  }

  const result = [];

  for (const date of dates) {
    const inventory = await getOrCreateInventory({
      Inventory,
      inventoryType,
      itemId,
      date,
      total: defaultTotal,
      userId: req?.user?._id,
    });

    if (inventory.available < requested) {
      throw new AppError(
        isArabic
          ? `لا يوجد توفر كافي بتاريخ ${date.toISOString().split("T")[0]}`
          : `Not enough availability on ${date.toISOString().split("T")[0]}`,
        400,
        "inventory",
      );
    }

    result.push(inventory);
  }

  return {
    canBook: true,
    dates: result,
    requested,
  };
};

/*
=====================================================
Reserve Inventory
=====================================================

يزيد reserved وينقص available تلقائيًا عبر save.
*/

export const reserveInventory = async ({
  Inventory,
  inventoryType,
  itemId,
  startDate,
  endDate,
  requested = 1,
  defaultTotal = 0,
  req = null,
}) => {
  const isArabic = getLanguage(req);
  const dates = getDatesBetween({ startDate, endDate });
  const quantity = Number(requested);

  if (!dates.length) {
    throw new AppError(
      isArabic ? "تواريخ المخزون غير صحيحة" : "Invalid inventory dates",
      400,
      "dates",
    );
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new AppError(
      isArabic ? "الكمية المطلوبة غير صحيحة" : "Invalid requested quantity",
      400,
      "requested",
    );
  }

  const reservedDates = [];

  try {
    for (const date of dates) {
      const inventory = await reserveInventoryDateAtomic({
        Inventory,
        inventoryType,
        itemId,
        date,
        requested: quantity,
        defaultTotal,
        userId: req?.user?._id,
      });

      if (!inventory) {
        const dateLabel = date.toISOString().split("T")[0];
        throw new AppError(
          isArabic
            ? `لا يوجد توفر كافي بتاريخ ${dateLabel}`
            : `Not enough availability on ${dateLabel}`,
          400,
          "inventory",
        );
      }

      reservedDates.push(date);
    }

    return { success: true, reservedDates: reservedDates.length, dates: reservedDates };
  } catch (error) {
    if (reservedDates.length) {
      await rollbackReservedInventoryDates({
        Inventory,
        inventoryType,
        itemId,
        dates: reservedDates,
        quantity,
        userId: req?.user?._id,
      });
    }
    throw error;
  }
};

/*
=====================================================
Release Inventory
=====================================================

تستخدم عند إلغاء الحجز.
*/

export const releaseInventory = async ({
  Inventory,
  inventoryType,
  itemId,
  startDate,
  endDate,
  released = 1,
  req = null,
}) => {
  const dates = getDatesBetween({
    startDate,
    endDate,
  });
  const quantity = Number(released);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new AppError(
      getLanguage(req) ? "الكمية المطلوب إرجاعها غير صحيحة" : "Invalid released quantity",
      400,
      "released",
    );
  }

  for (const date of dates) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const before = await Inventory.findOne({
        inventoryType,
        itemId,
        date: normalizeInventoryDate(date),
      }).lean();

      if (!before) break;

      const total = Number(before.total || 0);
      const reserved = Number(before.reserved || 0);
      const blocked = Number(before.blocked || 0);
      const available = Number(before.available || 0);
      const actualReleased = Math.min(quantity, reserved);

      if (actualReleased <= 0) break;

      const nextAvailable = Math.min(
        available + actualReleased,
        Math.max(total - blocked, 0),
      );
      const updated = await Inventory.findOneAndUpdate(
        {
          _id: before._id,
          total,
          reserved,
          blocked,
          available,
        },
        {
          $set: {
            reserved: reserved - actualReleased,
            available: nextAvailable,
            ...(req?.user?._id ? { updatedBy: req.user._id } : {}),
          },
        },
        { new: true, runValidators: true },
      );

      if (updated) break;
      if (attempt === 4) {
        throw new AppError(
          getLanguage(req)
            ? "تعذر إرجاع المخزون بسبب تغيره أثناء العملية"
            : "Unable to release inventory because it changed concurrently",
          409,
          "inventory",
        );
      }
    }
  }

  return {
    success: true,
    releasedDates: dates.length,
  };
};
/*
=====================================================
createRoomTypeInventoryForPeriod 

*/  
export const createRoomTypeInventoryForPeriod = async ({
  roomTypeId,
  startDate,
  endDate,
  totalRooms,
  createdBy,
}) => {
  const start = normalizeInventoryDate(startDate);
  const end = normalizeInventoryDate(endDate);

  if (!roomTypeId) {
    throw new Error("roomTypeId is required");
  }

  if (!startDate || !endDate) {
    throw new Error("startDate and endDate are required");
  }

  if (!totalRooms || Number(totalRooms) <= 0) {
    throw new Error("totalRooms must be greater than 0");
  }

  const operations = [];

  const current = new Date(start);

  while (current <= end) {
    operations.push({
      updateOne: {
        filter: {
          inventoryType: "roomType",
          itemId: roomTypeId,
          date: new Date(current),
        },
        update: [{
          $set: {
            inventoryType: { $ifNull: ["$inventoryType", "roomType"] },
            itemId: { $ifNull: ["$itemId", roomTypeId] },
            date: { $ifNull: ["$date", new Date(current)] },
            total: Number(totalRooms),
            reserved: { $ifNull: ["$reserved", 0] },
            blocked: { $ifNull: ["$blocked", 0] },
            available: {
              $max: [
                {
                  $subtract: [
                    Number(totalRooms),
                    {
                      $add: [
                        { $ifNull: ["$reserved", 0] },
                        { $ifNull: ["$blocked", 0] },
                      ],
                    },
                  ],
                },
                0,
              ],
            },
            isActive: true,
            isDeleted: { $ifNull: ["$isDeleted", false] },
            createdBy: { $ifNull: ["$createdBy", createdBy] },
          },
        }],
        upsert: true,
      },
    });

    current.setDate(current.getDate() + 1);
  }

  if (!operations.length) {
    return {
      created: 0,
      message: "No inventory dates generated",
    };
  }

  const result = await Inventory.bulkWrite(operations);

  return {
    success: true,
    matched: result.matchedCount,
    modified: result.modifiedCount,
    upserted: result.upsertedCount,
  };
};
