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

  let inventory = await Inventory.findOne({
    inventoryType,
    itemId,
    date: normalizedDate,
  });

  if (!inventory) {
    inventory = await Inventory.create({
      inventoryType,
      itemId,
      date: normalizedDate,
      total: Number(total) || 0,
      reserved: 0,
      blocked: 0,
      createdBy: userId,
    });
  }

  return inventory;
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
  const availability = await checkInventoryAvailability({
    Inventory,
    inventoryType,
    itemId,
    startDate,
    endDate,
    requested,
    defaultTotal,
    req,
  });

  for (const inventory of availability.dates) {
    inventory.reserved += requested;
    inventory.updatedBy = req?.user?._id;
    await inventory.save();
  }

  return {
    success: true,
    reservedDates: availability.dates.length,
  };
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

  for (const date of dates) {
    const inventory = await Inventory.findOne({
      inventoryType,
      itemId,
      date: normalizeInventoryDate(date),
    });

    if (!inventory) continue;

    inventory.reserved = Math.max(0, inventory.reserved - released);
    inventory.updatedBy = req?.user?._id;

    await inventory.save();
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
        update: {
          $setOnInsert: {
            inventoryType: "roomType",
            itemId: roomTypeId,
            date: new Date(current),
            booked: 0,
            createdBy,
          },
          $set: {
            total: Number(totalRooms),
            available: Number(totalRooms),
            isActive: true,
          },
        },
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