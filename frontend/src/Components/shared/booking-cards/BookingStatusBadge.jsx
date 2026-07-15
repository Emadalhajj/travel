export default function BookingStatusBadge({ status }) {
  const label = status || "-";

  const statusClasses = {
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    confirmed: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    completed: "bg-blue-100 text-blue-700 border-blue-200",
    expired: "bg-orange-100 text-orange-700 border-orange-200",
  };

  const className =
    statusClasses[String(status || "").toLowerCase()] ||
    "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}