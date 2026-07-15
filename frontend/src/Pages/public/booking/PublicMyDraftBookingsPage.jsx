import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { fetchPublicMyDraftBookings } from "../../../redux/public/bookingSlice";

import EmptyState from "../../../Components/shared/common/EmptyState";
import DraftBookingCard from "../../../Components/shared/draft-bookings/DraftBookingCard";
import PaginationComponent from "../../../Components/common/Pagination";
import PageHeader from "../../../Components/layout/PageHeader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import Loader from "../../../Components/common/Loader";

export default function PublicMyDraftBookingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const { myDraftBookings, draftPagination, loading, error } = useSelector(
    (state) => state.publicBooking,
  );

  useEffect(() => {
    dispatch(fetchPublicMyDraftBookings({ page: 1, limit: 10 }));
  }, [dispatch]);

  const handlePageChange = (page) => {
    dispatch(
      fetchPublicMyDraftBookings({
        page,
        limit: draftPagination?.limit || 10,
      }),
    );
  };
  const handleLimitChange = (limit) => {
    dispatch(
      fetchPublicMyDraftBookings({
        page: 1,
        limit,
      }),
    );
  };
 return (
  <div className="min-h-screen bg-slate-50 px-4 py-8">
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrowAr="مسودات الحجز"
        eyebrowEn="Draft Bookings"
        titleAr="مسودات الحجز"
        titleEn="Draft Bookings"
        subtitleAr="استعرض مسودات الحجز التي لم يتم تحويلها إلى حجوزات نهائية."
        subtitleEn="View draft bookings that have not been converted to final bookings."
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

      {!loading && !error && myDraftBookings.length === 0 && (
        <EmptyState
          icon="📝"
          title={t("noDraftBookingsFound", "لا توجد مسودات حجز")}
          description={t(
            "noDraftBookingsFoundDesc",
            "لا توجد لديك مسودات حجز محفوظة حاليًا."
          )}
          actionLabel={t("browsePrograms", "تصفح البرامج")}
          onAction={() => navigate("/programs")}
        />
      )}

      {!loading && !error && myDraftBookings.length > 0 && (
        <>
          <div className="space-y-4">
            {myDraftBookings.map((draft) => (
              <DraftBookingCard
                key={draft._id}
                draft={draft}
                isArabic={isArabic}
                t={t}
                onView={() => navigate(`/draft-booking/${draft._id}`)}
              />
            ))}
          </div>

          <div className="mt-6">
            <PaginationComponent
              total={draftPagination?.total || 0}
              page={draftPagination?.page || 1}
              limit={draftPagination?.limit || 10}
              totalPages={draftPagination?.pages || 1}
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

