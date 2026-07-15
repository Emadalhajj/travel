/*
وظيفته أزرار التنقل فقط.
*/
export default function BookingWizardNavigation({
  isFirstStep = false,
  isLastStep = false,
  disabled = false,
  onBack,
  onNext,
  nextLabel = "التالي",
  backLabel = "السابق",
}) {
  if (isLastStep) return null;

  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirstStep || disabled}
        className={[
          "px-5 py-2 rounded-lg border",
          isFirstStep || disabled
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-300 text-gray-700 hover:bg-gray-50",
        ].join(" ")}
      >
        {backLabel}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className={[
          "px-5 py-2 rounded-lg text-white",
          disabled
            ? "bg-blue-300 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700",
        ].join(" ")}
      >
        {nextLabel}
      </button>
    </div>
  );
}