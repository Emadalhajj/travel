import { useNavigate } from "react-router-dom";
import useBooking from "../context/useBooking";

export default function SuccessStep() {
  const navigate = useNavigate();

  const {
    finalBooking,
    draftBooking,
    resetBooking,
  } = useBooking();

  const bookingNumber =
    finalBooking?.bookingNumber ||
    finalBooking?.code ||
    finalBooking?._id ||
    draftBooking?.finalBooking;

  const handleGoToBookings = () => {
    navigate("/my-bookings");
  };

  const handleCreateNewBooking = () => {
    resetBooking();
    navigate("/booking");
  };

  return (
    <div className="bg-white border border-green-200 rounded-xl p-8 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <span className="text-3xl text-green-700">✓</span>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        تم إنشاء الحجز بنجاح
      </h2>

      {bookingNumber && (
        <p className="text-gray-600 mb-6">
          رقم الحجز:{" "}
          <span className="font-semibold text-gray-900">
            {bookingNumber}
          </span>
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleGoToBookings}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          عرض الحجوزات
        </button>

        <button
          type="button"
          onClick={handleCreateNewBooking}
          className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          إنشاء حجز جديد
        </button>
      </div>
    </div>
  );
}