// controllers/inventory/inventory-controller.js

/*
=====================================================
Inventory Controller
=====================================================
مسؤول عن إدارة المخزون يدويًا من لوحة الإدارة:
إنشاء مخزون
تعديل مخزون
حذف مخزون
عرض المخزون
-----------
هذا الملف مسؤول عن APIs الخاصة بالمخزون.

يستخدم في لوحة الإدارة من أجل:
-----------------------------------------------------
1- عرض المخزون.
2- تعديل عدد المتاح.
3- إيقاف عدد معين من المخزون.
4- إنشاء مخزون يدوي.
=====================================================
*/

 
import asyncHandler from "express-async-handler";
import Inventory from "../../models/inventory-model.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";
import AppError from "../../utils/AppError.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import {
  getDatesBetween,
  normalizeInventoryDate,
} from "../../services/booking/inventory-service.js";
import { createRoomTypeInventoryForPeriod } from "../../services/booking/inventory-service.js";

/*
=====================================================
GET ALL INVENTORY
=====================================================
*/

export const getAllInventory = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.inventoryType) {
    filter.inventoryType = req.query.inventoryType;
  }

  if (req.query.itemId) {
    filter.itemId = req.query.itemId;
  }

  if (req.query.date) {
    filter.date = normalizeInventoryDate(req.query.date);
  }

  if (req.query.startDate || req.query.endDate) {
    filter.date = {};

    if (req.query.startDate) {
      filter.date.$gte = normalizeInventoryDate(req.query.startDate);
    }

    if (req.query.endDate) {
      filter.date.$lte = normalizeInventoryDate(req.query.endDate);
    }
  }

  filter.isDeleted = { $ne: true };

  const { skip, limit } = buildPagination(req.query);

  const [items, total] = await Promise.all([
    Inventory.find(filter)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "firstName lastName username email")
      .populate("updatedBy", "firstName lastName username email"),

    Inventory.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    data: items,
  });
});

/*
=====================================================
CREATE INVENTORY
=====================================================
*/

export const createInventory = asyncHandler(async (req, res) => {
  console.log("CREATE INVENTORY BODY:", req.body);
  const isArabic = isArabicRequest(req);

  const {
    inventoryType,
    itemId,
    date,
    startDate,
    endDate,
    total,
    reserved,
    blocked,
    notes,
  } = req.body || {};

  const inventoryDates =
    startDate || endDate
      ? getDatesBetween({ startDate, endDate })
      : [normalizeInventoryDate(date)].filter(Boolean);

  if (!inventoryDates.length) {
    throw new AppError(
      isArabic ? "التاريخ أو الفترة غير صحيحة" : "Invalid date or period",
      400,
      "dates",
    );
  }

  const existingItems = await Inventory.find({
    inventoryType,
    itemId,
    date: { $in: inventoryDates },
    isDeleted: { $ne: true },
  }).lean();

  if (existingItems.length) {
    throw new AppError(
      isArabic
        ? "يوجد مخزون مسبقًا لبعض تواريخ هذه الفترة"
        : "Inventory already exists for one or more dates in this period",
      400,
      "dates",
    );
  }

  const items = await Inventory.insertMany(
    inventoryDates.map((inventoryDate) => ({
      inventoryType,
      itemId,
      date: inventoryDate,
      total,
      reserved,
      blocked,
      notes,
      available: Math.max(
        0,
        Number(total || 0) -
          Number(reserved || 0) -
          Number(blocked || 0),
      ),
      isActive: true,
    isDeleted: false,
      createdBy: req.user?._id,
    })),
  );

  res.status(201).json({
    success: true,
    message: isArabic
      ? "تم إنشاء المخزون بنجاح"
      : "Inventory created successfully",
    data: items.length === 1 ? items[0] : items,
  });
});

/*
=====================================================
UPSERT INVENTORY PERIOD
=====================================================
*/

export const upsertInventoryPeriod = asyncHandler(async (req, res) => {
  console.log("UPSERT INVENTORY BODY:", req.body);
  const isArabic = isArabicRequest(req);

  const {
    inventoryType,
    itemId,
    startDate,
    endDate,
    total,
    reserved,
    blocked,
    notes,
  } = req.body || {};

  if (!inventoryType || !itemId || !startDate || !endDate) {
    throw new AppError(
      isArabic ? "بيانات المخزون غير مكتملة" : "Inventory data is incomplete",
      400,
      "inventory",
    );
  }

  const inventoryDates = getDatesBetween({ startDate, endDate });

  if (!inventoryDates.length) {
    throw new AppError(
      isArabic ? "فترة المخزون غير صحيحة" : "Invalid inventory period",
      400,
      "dates",
    );
  }

  const operations = inventoryDates.map((inventoryDate) => ({
    updateOne: {
      filter: {
        inventoryType,
        itemId,
        date: inventoryDate,
      },
      update: {
        $set: {
          total,
          reserved,
          blocked,
          notes,
          available: Math.max(
            0,
            Number(total || 0) -
              Number(reserved || 0) -
              Number(blocked || 0),
          ),
          isActive: true,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          updatedBy: req.user?._id,
        },
        $setOnInsert: {
          createdBy: req.user?._id,
        },
      },
      upsert: true,
    },
  }));

  await Inventory.bulkWrite(operations);

  res.status(200).json({
    success: true,
    message: isArabic
      ? "تم حفظ مخزون الفترة بنجاح"
      : "Inventory period saved successfully",
    data: {
      count: inventoryDates.length,
      startDate,
      endDate,
    },
  });
});

/*
=====================================================
UPDATE INVENTORY
=====================================================
*/

export const updateInventory = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    throw new AppError(
      isArabic ? "المخزون غير موجود" : "Inventory not found",
      404,
      "inventory",
    );
  }

  const allowedFields = ["total", "reserved", "blocked", "notes", "isActive"];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      inventory[field] = req.body[field];
    }
  });

  inventory.updatedBy = req.user?._id;

  await inventory.save();

  res.status(200).json({
    success: true,
    message: isArabic ? "تم تحديث المخزون بنجاح" : "Inventory updated successfully",
    data: inventory,
  });
});

/*
=====================================================
DELETE INVENTORY
=====================================================
*/

export const deleteInventory = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    throw new AppError(
      isArabic ? "المخزون غير موجود" : "Inventory not found",
      404,
      "inventory",
    );
  }

  await inventory.deleteOne();

  res.status(200).json({
    success: true,
    message: isArabic ? "تم حذف المخزون بنجاح" : "Inventory deleted successfully",
  });
});

// ===================================================== createRoomTypeInventory 

export const createRoomTypeInventory = async (req, res, next) => {
  try {
    const { roomTypeId, startDate, endDate, totalRooms } = req.body || {};

    const result = await createRoomTypeInventoryForPeriod({
      roomTypeId,
      startDate,
      endDate,
      totalRooms,
      createdBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: "Room type inventory created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//===================================================== getInventoryPeriods

export const getInventoryPeriods = asyncHandler(async (req, res) => {
  const filter = {
    isDeleted: { $ne: true },
  };

  if (req.query.inventoryType) {
    filter.inventoryType = req.query.inventoryType;
  }

  if (req.query.itemId) {
    filter.itemId = req.query.itemId;
  }

  if (req.query.startDate || req.query.endDate) {
    filter.date = {};

    if (req.query.startDate) {
      filter.date.$gte = normalizeInventoryDate(req.query.startDate);
    }

    if (req.query.endDate) {
      filter.date.$lte = normalizeInventoryDate(req.query.endDate);
    }
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: filter },

    {
      $group: {
        _id: {
          inventoryType: "$inventoryType",
          itemId: "$itemId",
          total: "$total",
          reserved: "$reserved",
          blocked: "$blocked",
          available: "$available",
          isActive: "$isActive",
        },
        startDate: { $min: "$date" },
        endDate: { $max: "$date" },
        daysCount: { $sum: 1 },
        totalQuantity: { $sum: "$total" },
        reservedQuantity: { $sum: "$reserved" },
        blockedQuantity: { $sum: "$blocked" },
        availableQuantity: { $sum: "$available" },
      },
    },

    {
      $project: {
        _id: {
          $concat: [
            "$_id.inventoryType",
            "-",
            { $toString: "$_id.itemId" },
            "-",
            { $toString: "$startDate" },
            "-",
            { $toString: "$endDate" },
          ],
        },
        inventoryType: "$_id.inventoryType",
        itemId: "$_id.itemId",
        total: "$_id.total",
        reserved: "$_id.reserved",
        blocked: "$_id.blocked",
        available: "$_id.available",
        isActive: "$_id.isActive",
        startDate: 1,
        endDate: 1,
        daysCount: 1,
        totalQuantity: 1,
        reservedQuantity: 1,
        blockedQuantity: 1,
        availableQuantity: 1,
      },
    },

    { $sort: { startDate: 1 } },

    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: "count" }],
      },
    },
  ];

  const result = await Inventory.aggregate(pipeline);

  const data = result[0]?.data || [];
  const total = result[0]?.total?.[0]?.count || 0;

  res.status(200).json({
    success: true,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data,
  });
});