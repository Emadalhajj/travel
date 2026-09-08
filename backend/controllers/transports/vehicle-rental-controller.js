import asyncHandler from "express-async-handler";
import VehicleRental from "../../models/transportition/vehicle-rental-model.js";
import AppError from "../../utils/AppError.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";

export const getAllVehicleRentals = asyncHandler(async (req, res) => {
  const filter = {
    isDeleted: { $ne: true },
  };

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  if (req.query.rentalType) {
    filter.rentalType = req.query.rentalType;
  }

  if (req.query.transport) {
    filter.transport = req.query.transport;
  }

  if (req.query.search) {
    filter.$or = [
      { nameAr: { $regex: req.query.search, $options: "i" } },
      { nameEn: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const { page, skip, limit } = buildPagination(req.query);

  const [items, total] = await Promise.all([
    VehicleRental.find(filter)
      .populate("transport")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    VehicleRental.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page,
    limit,
    data: items,
  });
});

export const getOneVehicleRental = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const rental = await VehicleRental.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  }).populate("transport");

  if (!rental) {
    throw new AppError(
      "VEHICLE_RENTAL_NOT_FOUND",
      404,
      "vehicleRental",
    );
  }

  res.status(200).json({
    success: true,
    data: rental,
  });
});

export const createVehicleRental = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const rental = await VehicleRental.create({
    ...req.body,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: isArabic
      ? "تم إنشاء عرض التأجير بنجاح"
      : "Vehicle rental created successfully",
    data: rental,
  });
});

export const updateVehicleRental = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const rental = await VehicleRental.findById(req.params.id);

  if (!rental) {
    throw new AppError(
      "VEHICLE_RENTAL_NOT_FOUND",
      404,
      "vehicleRental",
    );
  }

  Object.assign(rental, req.body);
  rental.updatedBy = req.user?._id;

  await rental.save();

  res.status(200).json({
    success: true,
    message: isArabic
      ? "تم تحديث عرض التأجير بنجاح"
      : "Vehicle rental updated successfully",
    data: rental,
  });
});

export const deleteVehicleRental = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const rental = await VehicleRental.findById(req.params.id);

  if (!rental) {
    throw new AppError(
      "VEHICLE_RENTAL_NOT_FOUND",
      404,
      "vehicleRental",
    );
  }

  rental.isDeleted = true;
  rental.deletedAt = new Date();
  rental.deletedBy = req.user?._id;

  await rental.save();

  res.status(200).json({
    success: true,
    message: isArabic
      ? "تم حذف عرض التأجير بنجاح"
      : "Vehicle rental deleted successfully",
  });
});
export const toggleVehicleRentalActive = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);
  const rental = await VehicleRental.findById(req.params.id);

  if (!rental) {
    throw new AppError(
      "VEHICLE_RENTAL_NOT_FOUND",
      404,
      "vehicleRental",
    );
  }
  rental.isActive = !rental.isActive;
  rental.updatedBy = req.user?._id;
  await rental.save();

  res.status(200).json({
    success: true,
    message: isArabic
      ? `تم ${rental.isActive ? "تفعيل" : "إلغاء تفعيل"} عرض التأجير بنجاح`
      : `Vehicle rental ${rental.isActive ? "activated" : "deactivated"} successfully`,
    data: rental,
  });
});
