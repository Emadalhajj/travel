import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  fetchPublicMyBookings,
  fetchPublicPendingBookingReviews,
  selectPublicBookingsListError,
  selectPublicBookingsListLoading,
  selectPublicMyBookings,
  selectPublicPendingBookingReviews,
  selectPublicPendingReviewsError,
  selectPublicPendingReviewsLoading,
} from "../../redux/public/bookingSlice";
import BookingFulfillmentTimeline from "../../Components/shared/booking/BookingFulfillmentTimeline";
import ActionButton from "../../Components/common/buttons/ActionButton";

export default function MyBookings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const myBookings = useSelector(selectPublicMyBookings);
  const loading = useSelector(selectPublicBookingsListLoading);
  const error = useSelector(selectPublicBookingsListError);
  const pendingReviews = useSelector(selectPublicPendingBookingReviews);
  const pendingLoading = useSelector(selectPublicPendingReviewsLoading);
  const pendingError = useSelector(selectPublicPendingReviewsError);
  const bookings = Array.isArray(myBookings) ? myBookings : [];
  const pendingBookings = Array.isArray(pendingReviews) ? pendingReviews : [];

  useEffect(() => {
    dispatch(fetchPublicMyBookings({ page: 1, limit: 10 }));
    dispatch(fetchPublicPendingBookingReviews({ page: 1, limit: 10 }));
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

        {(loading || pendingLoading) && (
          <div className="rounded-xl border border-slate-100 bg-white p-5 text-slate-600">
            جاري تحميل الحجوزات...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!pendingLoading && pendingError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {pendingError}
          </div>
        )}

        {!pendingLoading && !pendingError && pendingBookings.length > 0 && (
          <section className="mb-6 space-y-4" aria-labelledby="pending-transfer-title">
            <div>
              <h2 id="pending-transfer-title" className="text-lg font-bold text-slate-900">
                طلبات بانتظار مراجعة الحوالة
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                تم استلام إثبات التحويل، وسيظهر الحجز النهائي بعد اعتماد الإدارة.
              </p>
            </div>
            {pendingBookings.map((draft) => (
              <article
                key={draft._id}
                className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-amber-700">رقم طلب الحجز</p>
                    <h3 className="mt-1 font-bold text-slate-900">{draft._id}</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
                        بانتظار مراجعة الحوالة
                      </span>
                      {draft.paymentReference && (
                        <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                          المرجع: {draft.paymentReference}
                        </span>
                      )}
                      <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                        {draft.pricing?.total || 0} {draft.pricing?.currency || "SAR"}
                      </span>
                    </div>
                  </div>
                  <ActionButton
                    action="view"
                    showLabel
                    label="عرض الطلب"
                    onClick={() => navigate(`/draft-booking/${draft._id}`)}
                  />
                </div>
              </article>
            ))}
          </section>
        )}

        {!loading && !pendingLoading && !error && !pendingError &&
          bookings.length === 0 && pendingBookings.length === 0 && (
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
                    value={booking.pilgrimsCount ?? booking.totalPilgrims ?? 0}
                  />
                  <InfoItem
                    label="الإجمالي"
                    value={`${booking.pricing?.totalPrice || booking.pricing?.total || 0} ${
                      booking.pricing?.currency || "SAR"
                    }`}
                  />
                </div>

                <section className="mt-5 border-t border-slate-100 pt-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-800">
                      حالة تنفيذ الخدمة
                    </h3>
                    <ActionButton
                      action="view"
                      showLabel
                      label="عرض التفاصيل"
                      onClick={() => navigate(`/booking/${booking._id}`)}
                    />
                  </div>
                  <BookingFulfillmentTimeline
                    fulfillment={booking.fulfillment}
                    serviceType={booking.serviceType}
                    isArabic
                  />
                </section>
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
