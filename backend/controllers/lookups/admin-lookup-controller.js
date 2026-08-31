import {
  getAdminLookupService,
  getHotelLookupByIdService,
} from "../../services/lookups/admin-lookup-service.js";

export const getAdminLookup = async (req, res, next) => {
  try {
    const data = await getAdminLookupService({
      type: req.params.type,
      search: req.query.search,
      limit: req.query.limit,
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const getHotelLookupById = async (req, res, next) => {
  try {
    const data = await getHotelLookupByIdService(req.params.hotelId);
    if (!data) return res.status(404).json({ message: "Hotel not found" });
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
