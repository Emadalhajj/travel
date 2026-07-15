
//services/availbilty/service
export const isAvailable = (
  totalRooms,
  bookedRooms,
) => {
  return totalRooms > bookedRooms;
};