import StatusBadge from "../common/StatusBadge";

export default function BookingStatusBadge({ status, isArabic = true }) {
  return <StatusBadge value={status} type="booking" isArabic={isArabic} />;
}