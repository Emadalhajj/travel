import { AlertTriangle, CheckCircle2, Circle, Clock3, XCircle } from "lucide-react";
import { getFulfillmentStepLabel, getFulfillmentWorkflow } from "../../../config/bookingFulfillment";

export const buildFulfillmentTimeline = ({ fulfillment, serviceType, isArabic = true }) => {
  const resolvedType = fulfillment?.serviceType || serviceType || "PACKAGE";
  const steps = getFulfillmentWorkflow(resolvedType);
  const currentIndex = Math.max(0, steps.indexOf(fulfillment?.currentStep));
  const terminal = ["failed", "cancelled"].includes(fulfillment?.status);
  return steps.map((step, index) => ({
    key: step,
    label: getFulfillmentStepLabel(step, isArabic),
    status: terminal && index === currentIndex
      ? fulfillment.status
      : index < currentIndex || fulfillment?.status === "completed"
        ? "complete"
        : index === currentIndex ? "current" : "upcoming",
  }));
};

export default function BookingFulfillmentTimeline({ fulfillment, serviceType, isArabic = true }) {
  const steps = buildFulfillmentTimeline({ fulfillment, serviceType, isArabic });
  return <div>
    {fulfillment?.status === "action_required" && (
      <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
        {isArabic ? "مطلوب إجراء: " : "Action required: "}{fulfillment.actionRequiredReason || "—"}
      </div>
    )}
    {fulfillment?.customerAction?.status === "submitted" && (
      <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
        {isArabic ? "تم استلام المطلوب، وتستمر معالجة الخدمة الآن." : "Your response was received and service processing has resumed."}
      </div>
    )}
    <ol className="grid gap-3 md:grid-cols-3 xl:grid-cols-6" dir={isArabic ? "rtl" : "ltr"}>
      {steps.map((step) => {
        const Icon = step.status === "complete" ? CheckCircle2 : step.status === "current" ? Clock3 : step.status === "failed" ? XCircle : step.status === "cancelled" ? AlertTriangle : Circle;
        return <li key={step.key} className={`rounded-xl border p-4 ${step.status === "complete" ? "border-emerald-200 bg-emerald-50" : step.status === "current" ? "border-sky-200 bg-sky-50" : ["failed", "cancelled"].includes(step.status) ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
          <Icon size={21} className={step.status === "complete" ? "text-emerald-600" : step.status === "current" ? "text-sky-600" : ["failed", "cancelled"].includes(step.status) ? "text-rose-600" : "text-slate-300"} />
          <p className="mt-2 text-sm font-bold text-slate-800">{step.label}</p>
        </li>;
      })}
    </ol>
  </div>;
}
