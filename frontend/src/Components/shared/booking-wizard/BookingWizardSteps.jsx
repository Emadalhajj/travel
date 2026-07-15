/*
وظيفته عرض شريط الخطوات فقط.
*/
export default function BookingWizardSteps({
  steps = [],
  currentStepIndex = 0,
  onStepClick,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onStepClick?.(index)}
              className={[
                "text-right rounded-lg border p-3 transition",
                isActive
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : isCompleted
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold",
                    isActive
                      ? "bg-blue-600 text-white"
                      : isCompleted
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600",
                  ].join(" ")}
                >
                  {isCompleted ? "✓" : index + 1}
                </span>

                <div>
                  <div className="font-semibold text-sm">{step.title}</div>
                  <div className="text-xs opacity-80">{step.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}