import asyncHandler from "express-async-handler";

import { normalizeDate } from "../../services/booking/availability.js";
import { getAvailablePackageProductsService } from "../../services/availability/package-availability-service.js";
import { searchPublicAccommodations } from "../../services/availability/accommodation-availability-service.js";
import AppError from "../../utils/AppError.js";

export const getAvailablePackageProducts = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    pilgrimsCount = 1,
    category = "",
    mode = "availability",
  } = req.query;

  const isBrowseMode = mode === "browse";

  if (!isBrowseMode && (!startDate || !endDate)) {
    throw new AppError("AVAILABILITY_DATES_REQUIRED", 400, "dates");
  }

  const normalizedStartDate = isBrowseMode ? null : normalizeDate(startDate);
  const normalizedEndDate = isBrowseMode ? null : normalizeDate(endDate);

  if (!isBrowseMode && (!normalizedStartDate || !normalizedEndDate)) {
    throw new AppError("INVALID_DATE_FORMAT", 400);
  }
  if (!isBrowseMode && normalizedEndDate <= normalizedStartDate) {
    throw new AppError("PROGRAM_END_BEFORE_START", 400);
  }

  const data = await getAvailablePackageProductsService({
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    pilgrimsCount,
    category,
    mode,
  });

  res.status(200).json({
    success: true,
    message: "Available products fetched successfully",
    data,
  });
});

export const searchPublicAccommodationsController = asyncHandler(async (req, res) => {
  const result = await searchPublicAccommodations(req.query);
  res.status(200).json({ success: true, ...result });
});
