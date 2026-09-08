import asyncHandler from "express-async-handler";

import { normalizeDate } from "../../services/booking/availability.js";
import { getAvailablePackageProductsService } from "../../services/availability/package-availability-service.js";
import AppError from "../../utils/AppError.js";

export const getAvailablePackageProducts = asyncHandler(async (req, res) => {
  const { startDate, endDate, pilgrimsCount = 1 } = req.query;

  if (!startDate || !endDate) {
    throw new AppError("AVAILABILITY_DATES_REQUIRED", 400, "dates");
  }

  const normalizedStartDate = normalizeDate(startDate);
  const normalizedEndDate = normalizeDate(endDate);

  if (!normalizedStartDate || !normalizedEndDate) {
    throw new AppError("INVALID_DATE_FORMAT", 400);
  }
  if (normalizedEndDate <= normalizedStartDate) {
    throw new AppError("PROGRAM_END_BEFORE_START", 400);
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
