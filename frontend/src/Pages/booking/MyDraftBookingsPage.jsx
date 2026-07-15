import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import PublicPageLayout from "../../Components/shared/public-layout/PublicPageLayout";
import PublicSection from "../../Components/shared/public-layout/PublicSection";
import PublicContent from "../../Components/shared/public-layout/PublicContent";
import PageHeader from "../../Components/shared/PageHeader";
import Loader from "../../Components/shared/Loader";
import ErrorOverlay from "../../Components/shared/ErrorOverlay";

import {
  fetchPublicMyDraftBookings,
  cancelPublicDraftBooking,
} from "../../redux/public/bookingSlice";
import { DraftBookingCard, EmptyBookingState } from "../../Components/shared/booking-cards";

export default function MyDraftBookingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    myDraftBookings = [],
    loading,
    submitLoading,
    error,
    draftPagination,
  } = useSelector((state) => state.publicBooking || {});

  useEffect(() => {
    dispatch(fetchPublicMyDraftBookings());
  }, [dispatch]);

  const handleContinue = (draft) => {
    navigate(`/booking?draftId=${draft._id}`);
  };

  const handleCancel = async (draft) => {
    await dispatch(cancelPublicDraftBooking(draft._id));
    dispatch(fetchPublicMyDraftBookings());
  };

  return (
    <PublicPageLayout>
      <PublicSection>
        <PublicContent>
          <PageHeader
            title="مسودات الحجز"
            subtitle="أكمل الحجوزات غير المكتملة أو قم بإلغائها"
          />

          {loading && <Loader message="جاري تحميل المسودات..." />}

          {error && <ErrorOverlay message={error} />}

        {!loading && !error && myDraftBookings.length === 0 && (
  <EmptyBookingState
    title="لا توجد مسودات"
    description="لا توجد حجوزات غير مكتملة حالياً."
    actionLabel="إنشاء حجز جديد"
    onAction={() => navigate("/booking")}
  />
)}

{!loading && !error && myDraftBookings.length > 0 && (
  <div className="space-y-4">
    {myDraftBookings.map((draft) => (
      <DraftBookingCard
        key={draft._id}
        draft={draft}
        disabled={submitLoading}
        onContinue={handleContinue}
        onCancel={handleCancel}
      />
    ))}
  </div>
)}
        </PublicContent>
      </PublicSection>
    </PublicPageLayout>
  );
}