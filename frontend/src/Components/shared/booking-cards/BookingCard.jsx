import BookingStatusBadge from "./BookingStatusBadge";
import ActionButton from "../../common/buttons/ActionButton";
import { formatDate } from "../../../Utils/dateUtils";

export default function BookingCard({ booking, onView, isArabic = true, t }) {
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
              {t?.("bookingNumber", "رقم الحجز") || "رقم الحجز"} {bookingNumber}
            </h3>

            <BookingStatusBadge status={status} />
          </div>

          <p className="text-sm text-gray-500 mt-2">
            {t?.("customer", "العميل") || "العميل"}: {customerName}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            {t?.("createdAt", "تاريخ الإنشاء") || "تاريخ الإنشاء"}:{" "}
            {formatDate(booking?.createdAt, { isArabic })}
          </p>
        </div>

        <div className="text-right">
          <div className="font-semibold text-gray-900">
            {total} {currency}
          </div>

          {onView && (
            <ActionButton
              action="view"
              showLabel
              label={t?.("viewDetails", "عرض التفاصيل") || "عرض التفاصيل"}
              onClick={() => onView(booking)}
              className="mt-3"
            />
          )}
        </div>
      </div>
    </div>
  );
}
