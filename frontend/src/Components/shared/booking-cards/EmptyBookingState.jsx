export default function EmptyBookingState({
  title = "لا توجد بيانات",
  description = "لا توجد عناصر لعرضها حالياً.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>

      <p className="text-sm text-gray-500 mt-2">{description}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}