import { Navigate, useParams } from "react-router-dom";

export default function PublicCustomBookingCustomerPage() {
  const { draftId } = useParams();

  return <Navigate to={`/booking/draft/${draftId}/details`} replace />;
}
