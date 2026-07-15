import useBooking from "../context/useBooking";

import DraftBookingInfoCard from "../../draft-bookings/DraftBookingInfoCard";
import DraftBookingSummaryCard from "../../draft-bookings/DraftBookingSummaryCard";

export default function ReviewStep() {
  const {
    draftBooking,
    selectedPackage,
    selectedProducts,
    customer,
    travelers,
    pricing,
  } = useBooking();

  const currency = pricing?.currency || "SAR";
  const summaryRows = [
    {
      label: "عدد المعتمرين",
      value: travelers?.length || 0,
    },
    {
      label: "الإجمالي قبل الضريبة",
      value: formatMoney(pricing?.subtotal, currency),
    },
    {
      label: `ضريبة القيمة المضافة ${pricing?.taxRate || 15}%`,
      value: formatMoney(pricing?.tax, currency),
    },
    {
      label: "الإجمالي شامل الضريبة",
      value: formatMoney(pricing?.total, currency),
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <DraftBookingInfoCard
          draftBooking={draftBooking}
          customer={customer}
          travelers={travelers}
          selectedPackage={selectedPackage}
        />
      </div>

      <div>
        <DraftBookingSummaryCard
          title="ملخص المسودة"
          draftBooking={draftBooking}
          selectedPackage={selectedPackage}
          selectedProducts={selectedProducts}
          rows={summaryRows}
        />
      </div>
    </div>
  );
}

function formatMoney(amount, currency = "SAR") {
  return `${Number(amount || 0).toFixed(2)} ${currency}`;
}
