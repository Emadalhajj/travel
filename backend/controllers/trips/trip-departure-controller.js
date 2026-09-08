import asyncHandler from "../../middleware/asyncHandler.js";
import {
  cancelTripDepartureService,
  completeTripDepartureService,
  createTripDepartureService,
  deleteTripDepartureService,
  getAllTripDeparturesService,
  getTripDepartureByIdService,
  restoreTripDepartureService,
  scheduleTripDepartureService,
  toggleTripDepartureActiveService,
  updateTripDepartureService,
} from "../../services/trips/trip-departure-service.js";

const lifecycleController = (service, message) =>
  asyncHandler(async (req, res) => {
    const departure = await service({
      departureId: req.params.id,
      userId: req.user?._id,
      req,
    });
    res.status(200).json({ success: true, message, departure });
  });

export const scheduleTripDeparture = lifecycleController(
  scheduleTripDepartureService,
  "تمت جدولة موعد الرحلة بنجاح",
);

export const cancelTripDeparture = lifecycleController(
  cancelTripDepartureService,
  "تم إلغاء موعد الرحلة بنجاح",
);

export const completeTripDeparture = lifecycleController(
  completeTripDepartureService,
  "تم إكمال موعد الرحلة بنجاح",
);

export const getAllTripDepartures = asyncHandler(async (req, res) => {
  const result = await getAllTripDeparturesService({ query: req.query });

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const getTripDepartureById = asyncHandler(async (req, res) => {
  const departure = await getTripDepartureByIdService(req.params.id);

  res.status(200).json({
    success: true,
    departure,
  });
});

export const createTripDeparture = asyncHandler(async (req, res) => {
  const departure = await createTripDepartureService({
    data: req.body,
    userId: req.user?._id,
    req,
  });

  res.status(201).json({
    success: true,
    message: "تم إنشاء موعد الرحلة بنجاح",
    departure,
  });
});

export const updateTripDeparture = asyncHandler(async (req, res) => {
  const departure = await updateTripDepartureService({
    departureId: req.params.id,
    data: req.body,
    userId: req.user?._id,
    req,
  });

  res.status(200).json({
    success: true,
    message: "تم تحديث موعد الرحلة بنجاح",
    departure,
  });
});

export const toggleTripDepartureActive = asyncHandler(async (req, res) => {
  const departure = await toggleTripDepartureActiveService({
    departureId: req.params.id,
    userId: req.user?._id,
    req,
  });

  res.status(200).json({
    success: true,
    message: "تم تحديث حالة موعد الرحلة بنجاح",
    departure,
  });
});

export const deleteTripDeparture = asyncHandler(async (req, res) => {
  const departure = await deleteTripDepartureService({
    departureId: req.params.id,
    userId: req.user?._id,
    req,
  });

  res.status(200).json({
    success: true,
    message: "تم حذف موعد الرحلة بنجاح",
    id: departure._id,
  });
});

export const restoreTripDeparture = asyncHandler(async (req, res) => {
  const departure = await restoreTripDepartureService({
    departureId: req.params.id,
    userId: req.user?._id,
    req,
  });

  res.status(200).json({
    success: true,
    message: "تم استرجاع موعد الرحلة بنجاح",
    departure,
  });
});
