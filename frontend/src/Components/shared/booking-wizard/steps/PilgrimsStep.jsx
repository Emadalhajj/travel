import FieldRenderer from "../../forms/FieldRenderer";
import useBooking from "../context/useBooking";

const emptyPilgrim = {
  fullName: "",
  passportNumber: "",
  nationality: "",
  birthDate: "",
  gender: "",
};

export default function PilgrimsStep({ errors = {} }) {
const {
  travelers,
  setTravelers,
  addTraveler,
  removeTraveler,
  validationErrors,
  canAddTraveler,
  travelerCapacityMessage,
} = useBooking();

  const handlePilgrimChange = (index, field, value) => {
    const updated = [...travelers];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setTravelers(updated);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          بيانات المعتمرين
        </h2>

        <button
          type="button"
          onClick={() => addTraveler(emptyPilgrim)}
          disabled={!canAddTraveler}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          إضافة معتمر
        </button>
      </div>

      {(travelerCapacityMessage || validationErrors.travelersCapacity) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {travelerCapacityMessage || validationErrors.travelersCapacity}
        </div>
      )}

      {travelers.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
          لم يتم إضافة أي معتمر بعد.
        </div>
      )}

      {travelers.map((pilgrim, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">
              المعتمر رقم {index + 1}
            </h3>

            <button
              type="button"
              onClick={() => removeTraveler(index)}
              className="text-red-600 hover:text-red-800"
            >
              حذف
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRenderer
              field={{ name: "fullName", label: "الاسم الكامل", type: "text" }}
              value={pilgrim.fullName}
              error={validationErrors[`travelers.${index}.fullName`]}
              onChange={(value) => handlePilgrimChange(index, "fullName", value)}
            />

            <FieldRenderer
              field={{ name: "passportNumber", label: "رقم الجواز", type: "text" }}
              value={pilgrim.passportNumber}
              error={validationErrors[`travelers.${index}.passportNumber`]}
              onChange={(value) =>
                handlePilgrimChange(index, "passportNumber", value)
              }
            />

            <FieldRenderer
              field={{ name: "nationality", label: "الجنسية", type: "text" }}
              value={pilgrim.nationality}
              error={validationErrors[`travelers.${index}.nationality`]}
              onChange={(value) =>
                handlePilgrimChange(index, "nationality", value)
              }
            />

            <FieldRenderer
              field={{ name: "birthDate", label: "تاريخ الميلاد", type: "date" }}
              value={pilgrim.birthDate}
              error={validationErrors[`travelers.${index}.birthDate`]}
              onChange={(value) =>
                handlePilgrimChange(index, "birthDate", value)
              }
            />

            <FieldRenderer
              field={{
                name: "gender",
                label: "الجنس",
                type: "select",
                options: [
                  { label: "ذكر", value: "male" },
                  { label: "أنثى", value: "female" },
                ],
              }}
              value={pilgrim.gender}
              error={validationErrors[`travelers.${index}.gender`]}
              onChange={(value) => handlePilgrimChange(index, "gender", value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
