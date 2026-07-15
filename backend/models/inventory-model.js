/*
وظيفته إدارة المخزون اليومي للغرف والرحلات والنقل والتأشيرات بدل الاعتماد فقط على totalRooms.
*/
// models/inventory-model.js

/*
=====================================================
Inventory Model
=====================================================

هذا الموديل مسؤول عن إدارة المخزون اليومي.

مثال:
-----------------------------------------------------
نوع غرفة معين في تاريخ معين:
- إجمالي الغرف
- المحجوز
- المتاح
- الموقوف يدويًا

يستخدم مع:
-----------------------------------------------------
- RoomType
- Trip
- Transport
- Visa لاحقًا إن احتجت
=====================================================
*/

import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    inventoryType: {
      type: String,
      enum: ["roomType", "trip", "transport", "visa" , "extraService", "vehicleRental"],
      required: true,
    },

    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    reserved: {
      type: Number,
      min: 0,
      default: 0,
    },

    blocked: {
      type: Number,
      min: 0,
      default: 0,
    },

    available: {
      type: Number,
      min: 0,
      default: 0,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    /*
        Soft Delete
        لا نحذف الفاوتشر نهائيًا من قاعدة البيانات.
        */
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/*
=====================================================
Pre Save
=====================================================

المتاح = الإجمالي - المحجوز - الموقوف
*/

inventorySchema.pre("save", function (next) {
  this.available = Math.max(
    0,
    Number(this.total || 0) -
      Number(this.reserved || 0) -
      Number(this.blocked || 0),
  );

  next();
});

/*
=====================================================
Indexes
=====================================================

لا نريد تكرار نفس العنصر في نفس التاريخ.
*/

inventorySchema.index(
  {
    inventoryType: 1,
    itemId: 1,
    date: 1,
  },
  {
    unique: true,
  },
);

inventorySchema.index({
  inventoryType: 1,
  date: 1,
  isActive: 1,
});

export default mongoose.model("Inventory", inventorySchema);
