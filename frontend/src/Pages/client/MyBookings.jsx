import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchPublicMyBookings } from "../../redux/public/bookingSlice";

export default function MyBookings() {
  const dispatch = useDispatch();
  const { myBookings, loading, error } = useSelector(
    (state) => state.publicBooking || {},
  );
  const bookings = Array.isArray(myBookings) ? myBookings : [];

  useEffect(() => {
    dispatch(fetchPublicMyBookings({ page: 1, limit: 10 }));
  }, [dispatch]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-emerald-700">حجوزاتي</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            عرض حجوزاتي
          </h1>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-100 bg-white p-5 text-slate-600">
            جاري تحميل الحجوزات...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="rounded-xl border border-slate-100 bg-white p-5 text-slate-600">
            لا توجد حجوزات حتى الآن.
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <article
                key={booking._id}
                className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">رقم الحجز</p>
                    <h2 className="mt-1 font-bold text-slate-900">
                      {booking.bookingNumber || booking.bookingId || booking._id}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                      {booking.bookingStatus || booking.status || "-"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      {booking.paymentStatus || "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  <InfoItem
                    label="البرنامج"
                    value={booking.program?.nameAr || booking.program?.nameEn}
                  />
                  <InfoItem
                    label="عدد المعتمرين"
                    value={booking.pilgrims?.length || booking.travelers?.length || 0}
                  />
                  <InfoItem
                    label="الإجمالي"
                    value={`${booking.pricing?.totalPrice || booking.pricing?.total || 0} ${
                      booking.pricing?.currency || "SAR"
                    }`}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}
