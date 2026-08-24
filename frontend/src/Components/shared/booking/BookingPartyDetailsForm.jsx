import { useEffect, useState } from "react";
import FileAttachmentUploader from "../../common/FileAttachmentUploader";
import NationalitySelect from "../../common/NationalitySelect";
import CalendarField from "../../common/CalendarField";
import HostManagementForm from "./HostManagementForm";
import ActionButton from "../../common/buttons/ActionButton";
import PhoneNumberField from "../../common/PhoneNumberField";
import PublicButton from "../buttons/PublicButton";

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
  onHostsChange,
  canAddTraveler = true,
  errors = {},
  isArabic = true,
}) {
  const [customerOpen, setCustomerOpen] = useState(true);
  const [openTravelers, setOpenTravelers] = useState({ 0: true });
  const toggleTraveler = (index) =>
    setOpenTravelers((previous) => ({ ...previous, [index]: !previous[index] }));

  useEffect(() => {
    const errorKeys = Object.keys(errors).filter((key) => errors[key]);
    if (!errorKeys.length) return;

    if (errorKeys.some((key) => key.startsWith("customer."))) {
      setCustomerOpen(true);
    }

    setOpenTravelers((previous) => {
      const next = { ...previous };
      errorKeys.forEach((key) => {
        const match = key.match(/^travelers\.(\d+)\./);
        if (match) next[Number(match[1])] = true;
      });
      return next;
    });

    const scrollTimer = window.setTimeout(() => {
      document.querySelector("[data-booking-party-form] .text-red-600")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);

    return () => window.clearTimeout(scrollTimer);
  }, [errors]);

  return (
    <div className="container mx-auto space-y-8" data-booking-party-form>
      <FormSection
        title={isArabic ? "بيانات العميل" : "Customer Information"}
        subtitle={
          isArabic
            ? "بيانات الشخص المسؤول عن الحجز والتواصل"
            : "Booking owner and contact details"
        }
        action={<ActionButton action="toggle" expanded={customerOpen} onClick={() => setCustomerOpen((value) => !value)} />}
      >
        {customerOpen && <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label={isArabic ? "اسم العميل" : "Customer name"}
            value={customer.name}
            required
            error={errors["customer.name"]}
            onChange={(value) => onCustomerChange("name", value)}
          />
          <PhoneNumberField
            label={isArabic ? "رقم الجوال" : "Phone number"}
            value={customer.phone}
            required
            isArabic={isArabic}
            error={errors["customer.phone"]}
            onChange={(value) => onCustomerChange("phone", value)}
          />
          <TextField
            type="email"
            label={isArabic ? "البريد الإلكتروني" : "Email"}
            value={customer.email}
            required
            error={errors["customer.email"]}
            onChange={(value) => onCustomerChange("email", value)}
          />
          <Labeled label={isArabic ? "الجنسية" : "Nationality"} required>
            <NationalitySelect
              value={customer.nationality}
              required
              isArabic={isArabic}
              error={errors["customer.nationality"]}
              onChange={(value) => onCustomerChange("nationality", value)}
            />
          </Labeled>
        </div>}
      </FormSection>

      <FormSection
        title={isArabic ? "بيانات المعتمرين" : "Travelers Information"}
        subtitle={
          isArabic
            ? "أدخل بيانات كل معتمر وأرفق نسخة واضحة من جوازه"
            : "Enter every traveler and attach a clear passport copy"
        }
      >
        <div className="space-y-5">
          {travelers.map((traveler, index) => (
            <article
              key={traveler._id || index}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className={`${openTravelers[index] ? "mb-5" : ""} flex items-center justify-between`}>
                <h3 className="font-extrabold text-slate-900">
                  {isArabic ? `المعتمر ${index + 1}` : `Traveler ${index + 1}`}
                </h3>
                <div className="flex items-center gap-2">
                  <ActionButton action="toggle" expanded={Boolean(openTravelers[index])} onClick={() => toggleTraveler(index)} />
                  {travelers.length > 1 && <ActionButton action="delete" onClick={() => onRemoveTraveler(index)} />}
                </div>
              </div>
              {openTravelers[index] && <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label={isArabic ? "الاسم الكامل" : "Full name"}
                  value={traveler.fullName}
                  required
                  error={errors[`travelers.${index}.fullName`]}
                  onChange={(value) =>
                    onTravelerChange(index, "fullName", value)
                  }
                />
                <TextField
                  label={isArabic ? "رقم الجواز" : "Passport number"}
                  value={traveler.passportNumber}
                  required
                  error={errors[`travelers.${index}.passportNumber`]}
                  onChange={(value) =>
                    onTravelerChange(index, "passportNumber", value)
                  }
                />
                <Labeled label={isArabic ? "الجنسية" : "Nationality"} required>
                  <NationalitySelect
                    value={traveler.nationality}
                    required
                    isArabic={isArabic}
                    error={errors[`travelers.${index}.nationality`]}
                    onChange={(value) =>
                      onTravelerChange(index, "nationality", value)
                    }
                  />
                </Labeled>
                <Labeled
                  label={isArabic ? "تاريخ الميلاد" : "Birth date"}
                  required
                >
                  <CalendarField
                    value={traveler.birthDate}
                    max={new Date().toISOString().slice(0, 10)}
                    required
                    isArabic={isArabic}
                    error={errors[`travelers.${index}.birthDate`]}
                    onChange={(value) =>
                      onTravelerChange(index, "birthDate", value)
                    }
                  />
                </Labeled>
                <Labeled label={isArabic ? "الجنس" : "Gender"} required>
                  <select
                    className={inputClass}
                    value={traveler.gender || "male"}
                    onChange={(event) =>
                      onTravelerChange(index, "gender", event.target.value)
                    }
                  >
                    <option value="male">{isArabic ? "ذكر" : "Male"}</option>
                    <option value="female">
                      {isArabic ? "أنثى" : "Female"}
                    </option>
                  </select>
                </Labeled>
                <PhoneNumberField
                  label={
                    isArabic
                      ? "رقم التواصل (واتساب)"
                      : "Contact number (WhatsApp)"
                  }
                  value={traveler.whatsapp}
                  isArabic={isArabic}
                  error={errors[`travelers.${index}.whatsapp`]}
                  onChange={(value) => onTravelerChange(index, "whatsapp", value)}
                />
                <div className="md:col-span-2 rounded-xl border border-dashed border-emerald-200 bg-white p-4">
                  <FileAttachmentUploader
                    labelAr="صورة جواز المعتمر"
                    labelEn="Traveler passport copy"
                    multiple={false}
                    maxFiles={1}
                    maxSizeMB={10}
                    acceptedTypes=".pdf,.jpg,.jpeg,.png"
                    initialFiles={resolveAttachmentFiles(traveler.passportFiles, traveler.passportImage)}
                    onChange={(files) => {
                      onTravelerChange(index, "passportFiles", files);
                      if (!files.length) onTravelerChange(index, "passportImage", "");
                    }}
                  />
                  {errors[`travelers.${index}.passportFiles`] && (
                    <p className="text-xs font-semibold text-red-600">
                      {errors[`travelers.${index}.passportFiles`]}
                    </p>
                  )}
                  <p className="text-xs leading-6 text-amber-700">
                    {isArabic
                      ? "تنبيه: يجب أن تكون صورة الجواز كاملة وواضحة وغير منتهية الصلاحية."
                      : "Note: The passport copy must be complete, clear, and valid."}
                  </p>
                </div>
                <AttachmentField
                  labelAr="الصورة الشخصية (اختياري)"
                  labelEn="Personal photo (optional)"
                  value={traveler.personalPhoto}
                  files={traveler.personalPhotoFiles}
                  onChange={(files) =>
                    onTravelerChange(index, "personalPhotoFiles", files)
                  }
                  onRemoveStored={() => onTravelerChange(index, "personalPhoto", "")}
                />
                <AttachmentField
                  labelAr="شهادة التطعيم (اختياري)"
                  labelEn="Vaccination certificate (optional)"
                  value={traveler.vaccinationCertificate}
                  files={traveler.vaccinationCertificateFiles}
                  onChange={(files) =>
                    onTravelerChange(
                      index,
                      "vaccinationCertificateFiles",
                      files,
                    )
                  }
                  onRemoveStored={() => onTravelerChange(index, "vaccinationCertificate", "")}
                />
                <div className="md:col-span-2">
                  <AttachmentField
                    labelAr="التأشيرة الحالية إن وجدت (اختياري)"
                    labelEn="Current valid visa, if available (optional)"
                    value={traveler.visaAttachment}
                    files={traveler.visaAttachmentFiles}
                    onChange={(files) =>
                      onTravelerChange(index, "visaAttachmentFiles", files)
                    }
                    onRemoveStored={() => onTravelerChange(index, "visaAttachment", "")}
                  />
                  <p className="-mt-1 p-2 text-xm leading-6 text-emerald-700">
                    {isArabic
                      ? "في حال كان لديك تأشيرة سارية أرفقها هنا؛ سيتم ربطها في البرنامج الجديد دون الحاجة لإعادة إصدار تأشيرة جديدة خلال مدة سريان التأشيرة ."
                      : "If you have a valid visa, attach it here. It will be linked to the new program without issuing another visa while it remains valid."}
                  </p>
                </div>
              </div>}
            </article>
          ))}
        </div>
        <PublicButton
          variant="successOutline"
          size="sm"
          disabled={!canAddTraveler}
          onClick={() => {
            setOpenTravelers((previous) => ({ ...previous, [travelers.length]: true }));
            onAddTraveler();
          }}
          className="mt-5"
        >
          + {isArabic ? "إضافة معتمر" : "Add traveler"}
        </PublicButton>
      </FormSection>

      {onHostsChange && (
        <HostManagementForm
          hosts={hosts}
          travelers={travelers}
          onHostsChange={onHostsChange}
          onTravelerHostChange={(index, hostId) =>
            onTravelerChange(index, "hostId", hostId)
          }
          errors={errors}
          isArabic={isArabic}
        />
      )}
    </div>
  );
}

function FormSection({ title, subtitle, action, children }) {
  return (
    <section>
      <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-extrabold text-slate-900">{title}</h2><p className="mb-5 mt-1 text-sm text-slate-500">{subtitle}</p></div>{action}</div>
      {children}
    </section>
  );
}

function Labeled({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  required,
  error,
}) {
  return (
    <Labeled label={label} required={required}>
      <input
        type={type}
        inputMode={inputMode}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} ${error ? "border-red-400" : ""}`}
      />
      {error && (
        <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>
      )}
    </Labeled>
  );
}

function AttachmentField({ labelAr, labelEn, value, files, onChange, onRemoveStored }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4">
      <FileAttachmentUploader
        labelAr={labelAr}
        labelEn={labelEn}
        multiple={false}
        maxFiles={1}
        maxSizeMB={10}
        acceptedTypes=".pdf,.jpg,.jpeg,.png"
        initialFiles={resolveAttachmentFiles(files, value)}
        onChange={(nextFiles) => {
          onChange(nextFiles);
          if (!nextFiles.length) onRemoveStored?.();
        }}
      />
    </div>
  );
}

function resolveAttachmentFiles(files, storedValue) {
  if (Array.isArray(files) && files.length) return files;
  return storedValue ? [{ url: storedValue }] : [];
}
