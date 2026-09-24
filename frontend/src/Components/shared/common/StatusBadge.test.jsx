import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

const cases = [
  ["active", "user", "نشط", "Active"],
  ["inactive", "user", "معطل", "Inactive"],
  ["draft", "booking", "مسودة", "Draft"],
  ["initiated", "payment", "بدأت العملية", "Initiated"],
  ["pending", "booking", "قيد الانتظار", "Pending"],
  ["pending_proof", "payment", "بانتظار إثبات الدفع", "Pending Proof"],
  ["pending_approval", "payment", "بانتظار الموافقة", "Pending Approval"],
  ["pending_review", "payment", "بانتظار المراجعة", "Pending Review"],
  ["pending_verification", "payment", "بانتظار التحقق", "Pending Verification"],
  ["processing", "payment", "قيد المعالجة", "Processing"],
  ["authorized", "payment", "مصرح بها", "Authorized"],
  ["confirmed", "booking", "مؤكد", "Confirmed"],
  ["completed", "booking", "مكتمل", "Completed"],
  ["cancelled", "booking", "ملغي", "Cancelled"],
  ["paid", "payment", "مدفوع", "Paid"],
  ["success", "payment", "ناجحة", "Success"],
  ["captured", "payment", "تم التحصيل", "Captured"],
  ["paid_pending_booking", "payment", "مدفوع بانتظار الحجز", "Paid, pending booking"],
  ["failed", "payment", "فشل الدفع", "Failed"],
  ["rejected", "payment", "مرفوضة", "Rejected"],
  ["refunded", "payment", "مسترد", "Refunded"],
  ["partially_refunded", "payment", "مسترد جزئيًا", "Partially Refunded"],
  ["cancelled", "payment", "ملغاة", "Cancelled"],
  ["expired", "payment", "منتهية", "Expired"],
];

describe("StatusBadge", () => {
  test.each(cases)("renders %s in Arabic and English", (value, type, arabic, english) => {
    const { rerender } = render(
      <StatusBadge value={value} type={type} isArabic />,
    );

    expect(screen.getByText(arabic)).toBeTruthy();

    rerender(<StatusBadge value={value} type={type} isArabic={false} />);

    expect(screen.getByText(english)).toBeTruthy();
  });

  test("keeps unknown statuses neutral and preserves their value", () => {
    render(<StatusBadge value="provider_review" type="payment" isArabic />);

    const badge = screen.getByText("provider_review");

    expect(badge.className).toContain("border-slate-200");
    expect(badge.className).toContain("bg-slate-50");
    expect(badge.className).toContain("max-w-full");
    expect(badge.className).toContain("overflow-hidden");
    expect(badge.className).toContain("text-ellipsis");
    expect(badge.className).toContain("whitespace-nowrap");
  });
});