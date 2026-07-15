import ConfigFieldsRenderer from "../../forms/ConfigFieldsRenderer";
import useBooking from "../context/useBooking";

const customerFields = [
  {
    name: "name",
    label: "اسم العميل",
    type: "text",
    required: true,
  },
  {
    name: "email",
    label: "البريد الإلكتروني",
    type: "email",
  },
  {
    name: "phone",
    label: "رقم الجوال",
    type: "text",
    required: true,
  },
  {
    name: "nationality",
    label: "الجنسية",
    type: "text",
  },
];

export default function CustomerInfoStep() {
  const { customer, updateCustomer, validationErrors } = useBooking();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        بيانات العميل
      </h2>

      <ConfigFieldsRenderer
        fields={customerFields}
        values={customer}
        errors={validationErrors}
        onChange={(name, value) => updateCustomer({ [name]: value })}
      />
    </div>
  );
}