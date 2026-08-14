import FileAttachmentUploader from "../../common/FileAttachmentUploader";
import NationalitySelect from "../../common/NationalitySelect";
import CalendarField from "../../common/CalendarField";
import HostManagementForm from "./HostManagementForm";

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export default function BookingPartyDetailsForm({
  customer,
  travelers,
  hosts = [],
  onCustomerChange,
  onTravelerChange,
  onAddTraveler,
  onRemoveTraveler,
  onHostsChange = () => {},
  canAddTraveler = true,
  errors = {},
  isArabic = true,
}) {
  return (
    <div className="space-y-8">
      <FormSection
        title={isArabic ? "بيانات العميل" : "Customer Information"}
        subtitle={isArabic ? "بيانات الشخص المسؤول عن الحجز والتواصل" : "Booking owner and contact details"}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label={isArabic ? "اسم العميل" : "Customer name"} value={customer.name} required error={errors["customer.name"]} onChange={(value) => onCustomerChange("name", value)} />
          <TextField
            type="tel"
            inputMode="numeric"
            label={isArabic ? "رقم الجوال" : "Phone number"}
            value={customer.phone}
            required
            error={errors["customer.phone"]}
            onChange={(value) =>
              onCustomerChange("phone", normalizePhoneInput(value))
            }
          />
          <TextField type="email" label={isArabic ? "البريد الإلكتروني" : "Email"} value={customer.email} required error={errors["customer.email"]} onChange={(value) => onCustomerChange("email", value)} />
          <Labeled label={isArabic ? "الجنسية" : "Nationality"} required>
            <NationalitySelect value={customer.nationality} required isArabic={isArabic} error={errors["customer.nationality"]} onChange={(value) => onCustomerChange("nationality", value)} />
          </Labeled>
        </div>
      </FormSection>

      <FormSection
        title={isArabic ? "بيانات المعتمرين" : "Travelers Information"}
        subtitle={isArabic ? "أدخل بيانات كل معتمر وأرفق نسخة واضحة من جوازه" : "Enter every traveler and attach a clear passport copy"}
      >
        <div className="space-y-5">
          {travelers.map((traveler, index) => (
            <article key={traveler._id || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900">
                  {isArabic ? `المعتمر ${index + 1}` : `Traveler ${index + 1}`}
                </h3>
                {travelers.length > 1 && (
                  <button type="button" onClick={() => onRemoveTraveler(index)} className="text-sm font-bold text-red-600">
                    {isArabic ? "حذف" : "Remove"}
                  </button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label={isArabic ? "الاسم الكامل" : "Full name"} value={traveler.fullName} required error={errors[`travelers.${index}.fullName`]} onChange={(value) => onTravelerChange(index, "fullName", value)} />
                <TextField label={isArabic ? "رقم الجواز" : "Passport number"} value={traveler.passportNumber} required error={errors[`travelers.${index}.passportNumber`]} onChange={(value) => onTravelerChange(index, "passportNumber", value)} />
                <Labeled label={isArabic ? "الجنسية" : "Nationality"} required>
                  <NationalitySelect value={traveler.nationality} required isArabic={isArabic} error={errors[`travelers.${index}.nationality`]} onChange={(value) => onTravelerChange(index, "nationality", value)} />
                </Labeled>
                <Labeled label={isArabic ? "تاريخ الميلاد" : "Birth date"} required>
                  <CalendarField value={traveler.birthDate} max={new Date().toISOString().slice(0, 10)} required isArabic={isArabic} error={errors[`travelers.${index}.birthDate`]} onChange={(value) => onTravelerChange(index, "birthDate", value)} />
                </Labeled>
                <Labeled label={isArabic ? "الجنس" : "Gender"} required>
                  <select className={inputClass} value={traveler.gender || "male"} onChange={(event) => onTravelerChange(index, "gender", event.target.value)}>
                    <option value="male">{isArabic ? "ذكر" : "Male"}</option>
                    <option value="female">{isArabic ? "أنثى" : "Female"}</option>
                  </select>
                </Labeled>
                <div className="md:col-span-2 rounded-xl border border-dashed border-emerald-200 bg-white p-4">
                  <FileAttachmentUploader
                    labelAr="صورة جواز المعتمر"
                    labelEn="Traveler passport copy"
                    multiple={false}
                    maxFiles={1}
                    maxSizeMB={10}
                    acceptedTypes=".pdf,.jpg,.jpeg,.png"
                    initialFiles={traveler.passportFiles || (traveler.passportImage ? [{ url: traveler.passportImage }] : [])}
                    onChange={(files) => onTravelerChange(index, "passportFiles", files)}
                  />
                  {errors[`travelers.${index}.passportFiles`] && (
                    <p className="text-xs font-semibold text-red-600">{errors[`travelers.${index}.passportFiles`]}</p>
                  )}
                  <p className="text-xs leading-6 text-amber-700">
                    {isArabic ? "تنبيه: يجب أن تكون صورة الجواز كاملة وواضحة وغير منتهية الصلاحية." : "Note: The passport copy must be complete, clear, and valid."}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <button type="button" disabled={!canAddTraveler} onClick={onAddTraveler} className="mt-5 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">
          + {isArabic ? "إضافة معتمر" : "Add traveler"}
        </button>
      </FormSection>

      <HostManagementForm hosts={hosts} travelers={travelers} onHostsChange={onHostsChange} onTravelerHostChange={(index, hostId) => onTravelerChange(index, "hostId", hostId)} errors={errors} isArabic={isArabic} />
    </div>
  );
}

function FormSection({ title, subtitle, children }) {
  return <section><h2 className="text-xl font-extrabold text-slate-900">{title}</h2><p className="mb-5 mt-1 text-sm text-slate-500">{subtitle}</p>{children}</section>;
}

function Labeled({ label, required, children }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</span>{children}</label>;
}

function TextField({ label, value, onChange, type = "text", inputMode, required, error }) {
  return <Labeled label={label} required={required}><input type={type} inputMode={inputMode} value={value || ""} onChange={(event) => onChange(event.target.value)} className={`${inputClass} ${error ? "border-red-400" : ""}`} />{error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}</Labeled>;
}

function normalizePhoneInput(value) {
  const normalizedDigits = String(value || "")
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit))
    .replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit));

  const hasInternationalPrefix = normalizedDigits.trim().startsWith("+");
  const digits = normalizedDigits.replace(/\D/g, "").slice(0, 15);

  return `${hasInternationalPrefix ? "+" : ""}${digits}`;
}
