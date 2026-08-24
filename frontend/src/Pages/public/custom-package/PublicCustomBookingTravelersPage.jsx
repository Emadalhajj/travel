import { Navigate, useParams } from "react-router-dom";

/**
 * Compatibility route for bookmarks and drafts that still point to the
 * former standalone travelers page.
 */
export default function PublicCustomBookingTravelersPage() {
  const { draftId } = useParams();

  return (
    <Navigate
      to={`/booking/draft/${draftId}/details`}
      replace
    />
  );
}
