import asyncHandler from "express-async-handler";

import { normalizeDate } from "../../services/booking/availability.js";
import { getAvailablePackageProductsService } from "../../services/availability/package-availability-service.js";
import AppError from "../../utils/AppError.js";

export const getAvailablePackageProducts = asyncHandler(async (req, res) => {
  const { startDate, endDate, pilgrimsCount = 1 } = req.query;

  if (!startDate || !endDate) {
    throw new AppError("startDate و endDate مطلوبة لجلب المنتجات المتاحة", 400);
  }

  const normalizedStartDate = normalizeDate(startDate);
  const normalizedEndDate = normalizeDate(endDate);

  if (!normalizedStartDate || !normalizedEndDate) {
    throw new AppError("صيغة التاريخ غير صحيحة", 400);
  }
  if (normalizedEndDate <= normalizedStartDate) {
    throw new AppError("تاريخ نهاية البرنامج يجب أن يكون بعد تاريخ البداية", 400);
  }

  const data = await getAvailablePackageProductsService({
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    pilgrimsCount,
  });

  res.status(200).json({
    success: true,
    message: "Available products fetched successfully",
    data,
  });
});
