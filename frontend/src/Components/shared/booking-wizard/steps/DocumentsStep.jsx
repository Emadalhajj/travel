import useBooking from "../context/useBooking";

const documentTypes = [
  {
    key: "passport",
    label: "صورة الجواز",
  },
  {
    key: "personal_photo",
    label: "الصورة الشخصية",
  },
  {
    key: "visa_document",
    label: "مستند التأشيرة",
  },
];

export default function DocumentsStep() {
  const {
    documents = {},
    updateDocuments,
    validationErrors,
  } = useBooking();

  const handleFileChange = (type, file) => {
    updateDocuments({
      [type]: file,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          رفع المستندات
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          ارفع المستندات المطلوبة لإكمال بيانات الحجز.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {documentTypes.map((doc) => (
          <div
            key={doc.key}
            className="border border-gray-200 rounded-xl p-4 bg-gray-50"
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {doc.label}
            </label>

            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(event) =>
                handleFileChange(doc.key, event.target.files?.[0] || null)
              }
              className="block w-full text-sm text-gray-600"
            />

            {documents?.[doc.key]?.name && (
              <p className="text-xs text-green-700 mt-2">
                تم اختيار: {documents[doc.key].name}
              </p>
            )}

            {validationErrors?.[`documents.${doc.key}`] && (
              <p className="text-xs text-red-600 mt-2">
                {validationErrors[`documents.${doc.key}`]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}