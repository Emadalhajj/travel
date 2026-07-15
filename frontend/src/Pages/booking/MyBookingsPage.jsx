import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import PublicPageLayout from "../../Components/shared/public-layout/PublicPageLayout";
import PublicSection from "../../Components/shared/public-layout/PublicSection";
import PublicContent from "../../Components/shared/public-layout/PublicContent";
import PageHeader from "../../Components/shared/PageHeader";
import Loader from "../../Components/shared/Loader";
import ErrorOverlay from "../../Components/shared/ErrorOverlay";

import { fetchPublicMyBookings } from "../../redux/public/bookingSlice";
import {
  BookingCard,
  EmptyBookingState,
} from "../../Components/shared/booking-cards";

export default function MyBookingsPage() {
  const dispatch = useDispatch();

  const {
    myBookings = [],
    loading,
    error,
    pagination,
  } = useSelector((state) => state.publicBooking || {});

  useEffect(() => {
    dispatch(fetchPublicMyBookings());
  }, [dispatch]);

  return (
    <PublicPageLayout>
      <PublicSection>
        <PublicContent>
          <PageHeader
            title="حجوزاتي"
            subtitle="عرض الحجوزات النهائية الخاصة بك"
          />

          {loading && <Loader message="جاري تحميل الحجوزات..." />}

          {error && <ErrorOverlay message={error} />}

          {!loading && !error && myBookings.length === 0 && (
            <EmptyBookingState
              title="لا توجد حجوزات"
              description="لم يتم إنشاء أي حجز نهائي حتى الآن."
            />
          )}

          {!loading && !error && myBookings.length > 0 && (
            <div className="space-y-4">
              {myBookings.map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
              ))}
            </div>
          )}
        </PublicContent>
      </PublicSection>
    </PublicPageLayout>
  );
}
