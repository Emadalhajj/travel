import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { fetchPublicMyBookings } from "../../../redux/public/bookingSlice";

import BookingCard from "../../../Components/shared/booking-cards/BookingCard";
import EmptyState from "../../../Components/shared/common/EmptyState";
import PaginationComponent from "../../../Components/common/Pagination";
import PageHeader from "../../../Components/layout/PageHeader";
import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";

export default function PublicMyBookingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const { myBookings, pagination, loading, error } = useSelector(
    (state) => state.publicBooking,
  );

  const handleLimitChange = (limit) => {
    dispatch(
      fetchPublicMyBookings({
        page: 1,
        limit,
      }),
    );
  };

  useEffect(() => {
    dispatch(fetchPublicMyBookings({ page: 1, limit: 10 }));
  }, [dispatch]);

  const handlePageChange = (page) => {
    dispatch(
      fetchPublicMyBookings({
        page,
        limit: pagination?.limit || 10,
      }),
    );
  };

  return (
  <div className="min-h-screen bg-slate-50 px-4 py-8">
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrowAr="حجوزاتي"
        eyebrowEn="My Bookings"
        titleAr="حجوزاتي"
        titleEn="My Bookings"
        subtitleAr="استعرض الحجوزات التي تم إنشاؤها من حسابك."
        subtitleEn="View bookings created from your account."
        actions={
          <button
            type="button"
            onClick={() => navigate("/programs")}
            className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
          >
            {t("browsePrograms", "تصفح البرامج")}
          </button>
        }
      />

      {loading && <Loader />}

      <ErrorOverlay show={!loading && Boolean(error)} message={error} />

      {!loading && !error && myBookings.length === 0 && (
        <EmptyState
          icon="📄"
          title={t("noBookingsFound", "لا توجد حجوزات")}
          description={t(
            "noBookingsFoundDesc",
            "لم تقم بإنشاء أي حجز حتى الآن."
          )}
          actionLabel={t("browsePrograms", "تصفح البرامج")}
          onAction={() => navigate("/programs")}
        />
      )}

      {!loading && !error && myBookings.length > 0 && (
        <>
          <div className="space-y-4">
            {myBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                isArabic={isArabic}
                t={t}
              onView={(booking) => navigate(`/booking/${booking._id}`)}
              />
            ))}
          </div>

          <div className="mt-6">
            <PaginationComponent
              total={pagination?.total || 0}
              page={pagination?.page || 1}
              limit={pagination?.limit || 10}
              totalPages={pagination?.pages || 1}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </div>
        </>
      )}
    </div>
  </div>
);
}
