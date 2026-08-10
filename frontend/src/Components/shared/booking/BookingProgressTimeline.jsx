import { Check, CreditCard, FileText, PackageCheck, User, Users, CalendarDays } from "lucide-react";

export const bookingSteps = [
  { key: "customer_info", labelAr: "بيانات العميل", labelEn: "Customer", icon: User },
  { key: "travelers", labelAr: "المعتمرون", labelEn: "Travelers", icon: Users },
  { key: "services", labelAr: "الخدمات", labelEn: "Services", icon: PackageCheck },
  { key: "review", labelAr: "المراجعة", labelEn: "Review", icon: FileText },
  { key: "payment", labelAr: "الدفع", labelEn: "Payment", icon: CreditCard },
  { key: "success", labelAr: "التأكيد", labelEn: "Confirmed", icon: Check },
];

export const customPackageSteps = [
  { key: "dates", labelAr: "تحديد التواريخ", labelEn: "Dates", icon: CalendarDays },
  { key: "services", labelAr: "اختيار الخدمات", labelEn: "Services", icon: PackageCheck },
  { key: "review", labelAr: "المراجعة", labelEn: "Review", icon: FileText },
  { key: "payment", labelAr: "الدفع", labelEn: "Payment", icon: CreditCard },
  { key: "success", labelAr: "التأكيد", labelEn: "Confirmed", icon: Check },
];

export default function BookingProgressTimeline({
  currentStep = "customer_info",
  isArabic = true,
  steps = bookingSteps,
}) {
  const stepOrder = steps.map((step) => step.key);
  const stepAliases = {
    pilgrims: "travelers",
    customer: "customer_info",
    customerInfo: "customer_info",
  };
  const normalizedCurrentStep =
    stepAliases[currentStep] || currentStep;
  const resolvedIndex = stepOrder.indexOf(
    normalizedCurrentStep,
  );
  const currentIndex = resolvedIndex >= 0 ? resolvedIndex : 0;

  return (
    <section className="mb-8 rounded-3xl border border-slate-200 bg-white px-4 py-6 shadow-sm">
      <div className="flex items-center justify-between gap-2 overflow-x-auto">
        {steps.map((step, index) => {
          const Icon = step.icon || FileText;
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <div key={step.key} className="flex min-w-[120px] flex-1 items-center">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : isActive
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  <Icon size={20} />
                </div>

                <p
                  className={`mt-2 text-xs font-bold ${
                    isActive || isCompleted ? "text-emerald-700" : "text-slate-400"
                  }`}
                >
                  {isArabic ? step.labelAr : step.labelEn}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-[2px] flex-1 ${
                    index < currentIndex ? "bg-emerald-600" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
