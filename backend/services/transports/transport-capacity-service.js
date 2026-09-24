import Transport from "../../models/transportition/transport-model.js";
import Trip from "../../models/transportition/trip-model.js";
import TripDeparture from "../../models/transportition/trip-departure-model.js";
import AppError from "../../utils/AppError.js";

const transportIdOf = (value) => String(value?._id || value || "").trim();

export const assertTransportCapacity = ({ passengersCount, transport }) => {
  if (!transport) return;
  const passengers = Number(passengersCount || 0);
  const capacity = Number(transport.capacity || 0);
  if (passengers > capacity) {
    throw new AppError("TRIP_TRANSPORT_CAPACITY_EXCEEDED", 400, "capacity.totalSeats", {
      passengersCount: passengers,
      transportCapacity: capacity,
    });
  }
};

export const assertDepartureTransportCapacity = async ({
  trip,
  departure,
  session = null,
  TransportModel = Transport,
}) => {
  if (departure.source === "API") return;
  const requiredSeats = Number(departure.capacity?.totalSeats || 0);
  const ids = new Set(
    (departure.segments || []).map((segment) => transportIdOf(segment.transportId)).filter(Boolean),
  );
  if (trip?.type === "LAND") {
    const parentTransportId = transportIdOf(trip.transportId || trip.vehicleType);
    if (parentTransportId) ids.add(parentTransportId);
  }
  if (!ids.size) return;
  const query = TransportModel.find({ _id: { $in: [...ids] } }).select("capacity nameAr nameEn");
  if (session) query.session(session);
  const transports = await query;
  const byId = new Map(transports.map((transport) => [String(transport._id), transport]));
  for (const id of ids) assertTransportCapacity({ passengersCount: requiredSeats, transport: byId.get(id) });
};

export const assertTransportCapacityCanBeReduced = async ({
  transportId,
  nextCapacity,
  now = new Date(),
  TripModel = Trip,
  TripDepartureModel = TripDeparture,
}) => {
  const capacity = Number(nextCapacity);
  const trips = await TripModel.find({
    isDeleted: false,
    $or: [{ transportId }, { vehicleType: transportId }],
  }).select("_id").lean();
  const tripIds = trips.map((trip) => trip._id);
  const departure = await TripDepartureModel.findOne({
    isDeleted: false,
    departureAt: { $gte: now },
    "capacity.totalSeats": { $gt: capacity },
    $or: [
      { "segments.transportId": transportId },
      ...(tripIds.length ? [{ tripId: { $in: tripIds } }] : []),
    ],
  }).select("capacity.totalSeats").lean();
  if (departure) {
    throw new AppError("TRANSPORT_CAPACITY_BELOW_FUTURE_TRIPS", 409, "capacity", {
      transportCapacity: capacity,
      requiredCapacity: Number(departure.capacity?.totalSeats || 0),
    });
  }
};
