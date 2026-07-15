import BookingStatusBadge from "./BookingStatusBadge";

export default function BookingCard({ booking, onView }) {
  const bookingNumber =
    booking?.bookingNumber || booking?.code || booking?._id || "-";

  const status = booking?.bookingStatus || booking?.status;

  const customerName =
    booking?.customer?.name ||
    booking?.customerName ||
    booking?.pilgrims?.[0]?.fullName ||
    "-";

  const total =
    booking?.pricing?.totalAmount ||
    booking?.pricing?.total ||
    booking?.totalAmount ||
    0;

  const currency = booking?.pricing?.currency || "SAR";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-800">
              حجز رقم {bookingNumber}
            </h3>

            <BookingStatusBadge status={status} />
          </div>

          <p className="text-sm text-gray-500 mt-2">
            العميل: {customerName}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            تاريخ الإنشاء:{" "}
            {booking?.createdAt
              ? new Date(booking.createdAt).toLocaleDateString("ar-SA")
              : "-"}
          </p>
        </div>

        <div className="text-right">
          <div className="font-semibold text-gray-900">
            {total} {currency}
          </div>

          {onView && (
            <button
              type="button"
              onClick={() => onView(booking)}
              className="mt-3 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              عرض التفاصيل
            </button>
          )}
        </div>
      </div>
    </div>
  );
}