/*
هذا مجرد مكون (Component).

وظيفته فقط عرض حقول الدفع.

طريقة الدفع
المبلغ المدفوع
رقم العملية
*/
import ConfigFieldsRenderer from "../../forms/ConfigFieldsRenderer";

const paymentFields = [
  {
    name: "paymentMethod",
    label: "طريقة الدفع",
    type: "select",
    required: true,
    options: [
      { label: "نقدي", value: "cash" },
      { label: "تحويل بنكي", value: "bank_transfer" },
      { label: "بطاقة ائتمانية", value: "card" },
    ],
  },
  {
    name: "paidAmount",
    label: "المبلغ المدفوع",
    type: "number",
    required: true,
  },
  {
    name: "transactionId",
    label: "رقم العملية",
    type: "text",
  },
];

export default function PaymentStep({
  payment,
  updatePayment,
  validationErrors = {},
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-6">
        بيانات الدفع
      </h2>

      <ConfigFieldsRenderer
        fields={paymentFields}
        values={payment}
        errors={validationErrors}
        onChange={(name, value) =>
          updatePayment({
            [name]: value,
          })
        }
      />
    </div>
  );
}