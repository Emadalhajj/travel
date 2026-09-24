import { memo, useCallback, useEffect, useMemo, useState } from "react";
import FileAttachmentUploader from "../../common/FileAttachmentUploader";
import NationalitySelect from "../../common/NationalitySelect";
import CalendarField from "../../common/CalendarField";
import HostManagementForm from "./HostManagementForm";
import ActionButton from "../../common/buttons/ActionButton";
import PhoneNumberField from "../../common/PhoneNumberField";
import PublicButton from "../buttons/PublicButton";
import {
  BOOKING_REQUIREMENTS,
  isRequirementRequired,
  isRequirementVisible,
} from "../../../config/public-booking/bookingRequirements";

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
  isExternalFlight = false,
  partyMode = "UMRAH",
  requirements,
}) {
  const activeRequirements =
    requirements ||
    (partyMode === "BASIC"
      ? BOOKING_REQUIREMENTS.TRANSPORT
      : BOOKING_REQUIREMENTS[partyMode]) ||
    BOOKING_REQUIREMENTS.UMRAH;
  const travelerFields = activeRequirements.travelerFields || {};
  const documents = activeRequirements.documents || {};
  const isUmrah = isRequirementVisible(activeRequirements.hosts);
  const fixedTravelerCount = Boolean(activeRequirements.travelers?.fixedCount);
  const [customerOpen, setCustomerOpen] = useState(true);
  const [openTravelers, setOpenTravelers] = useState({ 0: true });
  const adultTravelers = useMemo(
    () => travelers.filter((item) => item.passengerCategory === "adult"),
    [travelers],
  );
  const toggleTraveler = useCallback(
    (index) =>
      setOpenTravelers((previous) => ({
        ...previous,
        [index]: !previous[index],
      })),
    [],
  );
  const handleTravelerHostChange = useCallback(
    (index, hostId) => onTravelerChange(index, "hostId", hostId),
    [onTravelerChange],
  );

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
      document
        .querySelector("[data-booking-party-form] .text-red-600")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 120);

    return () => window.clearTimeout(scrollTimer);
  }, [errors]);

  return (
    <div className="container mx-auto space-y-8" data-booking-party-form>
      {isRequirementVisible(activeRequirements.customer) && (
        <FormSection
          title={isArabic ? "بيانات العميل" : "Customer Information"}
          subtitle={
            isArabic
              ? "بيانات الشخص المسؤول عن الحجز والتواصل"
              : "Booking owner and contact details"
          }
          action={
            <ActionButton
              action="toggle"
              expanded={customerOpen}
              onClick={() => setCustomerOpen((value) => !value)}
            />
          }
        >
          {customerOpen && (
            <div className="grid gap-4 md:grid-cols-2">
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
                  isExternalFlight={isExternalFlight}
                  adultTravelers={adultTravelers}
                  allTravelers={travelers}
                  error={errors["customer.nationality"]}
                  onChange={(value) => onCustomerChange("nationality", value)}
                />
              </Labeled>
            </div>
          )}
        </FormSection>
      )}

      {isRequirementVisible(activeRequirements.travelers) && (
        <FormSection
          title={
            isArabic
              ? isUmrah
                ? "بيانات المعتمرين"
                : "بيانات المسافرين"
              : "Travelers Information"
          }
          subtitle={
            isArabic
              ? isUmrah
                ? "أدخل بيانات كل معتمر وأرفق نسخة واضحة من جوازه"
                : "أدخل البيانات المطلوبة لكل مسافر"
              : "Enter the required details for every traveler"
          }
        >
          <div className="space-y-5">
            {travelers.map((traveler, index) => (
              <TravelerFormSection
                key={traveler._id || index}
                traveler={traveler}
                index={index}
                isOpen={Boolean(openTravelers[index])}
                canRemove={travelers.length > 1}
                fixedCount={fixedTravelerCount}
                errors={errors}
                isArabic={isArabic}
                travelerFields={travelerFields}
                documents={documents}
                isUmrah={isUmrah}
                adultTravelers={adultTravelers}
                onChange={onTravelerChange}
                onRemove={onRemoveTraveler}
                onToggle={toggleTraveler}
              />
            ))}
          </div>
          {!fixedTravelerCount && (
            <PublicButton
              variant="successOutline"
              size="sm"
              disabled={!canAddTraveler}
              onClick={() => {
                setOpenTravelers((previous) => ({
                  ...previous,
                  [travelers.length]: true,
                }));
                onAddTraveler();
              }}
              className="mt-5"
            >
              +{" "}
              {isArabic
                ? isUmrah
                  ? "إضافة معتمر"
                  : "إضافة مسافر"
                : "Add traveler"}
            </PublicButton>
          )}
        </FormSection>
      )}

      {onHostsChange && isRequirementVisible(activeRequirements.hosts) && (
        <HostManagementForm
          hosts={hosts}
          travelers={travelers}
          onHostsChange={onHostsChange}
          onTravelerHostChange={handleTravelerHostChange}
          errors={errors}
          isArabic={isArabic}
        />
      )}
    </div>
  );
}

export const TravelerFormSection = memo(function TravelerFormSection({
  traveler,
  index,
  isOpen,
  canRemove,
  fixedCount = false,
  errors,
  isArabic,
  travelerFields = BOOKING_REQUIREMENTS.UMRAH.travelerFields,
  documents = BOOKING_REQUIREMENTS.UMRAH.documents,
  isUmrah = true,
  adultTravelers = [],
  allTravelers = [],
  onChange,
  onRemove,
  onToggle,
}) {
  const isChildPassenger = ["child", "infant_without_seat"].includes(
    traveler.passengerCategory,
  );
  const travelerSequence = travelersTypeSequence({
    traveler,
    index,
    allTravelers,
  });
  const visible = (name) => isRequirementVisible(travelerFields[name]);
  const required = (name) => isRequirementRequired(travelerFields[name]);
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div
        className={`${isOpen ? "mb-5" : ""} flex items-center justify-between`}
      >
        <h3 className="font-extrabold text-slate-900">
          {isUmrah
            ? `${isArabic ? "المعتمر" : "Traveler"} ${index + 1}`
            : getTravelerTypeLabel({
                passengerType: traveler.passengerCategory,
                sequence: travelerSequence,
                isArabic,
              })}
        </h3>
        <div className="flex items-center gap-2">
          <ActionButton
            action="toggle"
            expanded={isOpen}
            onClick={() => onToggle(index)}
          />
          {!fixedCount && canRemove && (
            <ActionButton action="delete" onClick={() => onRemove(index)} />
          )}
        </div>
      </div>
      {isOpen && (
        <div className="grid gap-4 md:grid-cols-2">
          {visible("title") && (
            <Labeled
              label={isArabic ? "اللقب" : "Title"}
              required={required("title")}
            >
              <select
                className={inputClass}
                value={isChildPassenger ? "CHILD" : traveler.title || ""}
                disabled={isChildPassenger}
                onChange={(event) =>
                  onChange(index, "title", event.target.value)
                }
              >
                <option value="">
                  {isArabic ? "اختر اللقب" : "Choose title"}
                </option>
                {!isChildPassenger && (
                  <option value="MR">{isArabic ? "السيد" : "Mr"}</option>
                )}
                {!isChildPassenger && (
                  <option value="MRS">{isArabic ? "السيدة" : "Mrs"}</option>
                )}
                {!isChildPassenger && (
                  <option value="MS">{isArabic ? "الآنسة" : "Ms"}</option>
                )}
                {isChildPassenger && (
                  <option value="CHILD">{isArabic ? "الطفل" : "Child"}</option>
                )}
                {!isChildPassenger && (
                  <option value="OTHER">
                    {isArabic ? "غير ذلك" : "Other"}
                  </option>
                )}
              </select>
              {errors[`travelers.${index}.title`] && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {errors[`travelers.${index}.title`]}
                </p>
              )}
            </Labeled>
          )}
          {visible("firstName") && (
            <TextField
              label={isArabic ? "الاسم الأول" : "First name"}
              value={traveler.firstName}
              required={required("firstName")}
              error={errors[`travelers.${index}.firstName`]}
              onChange={(value) => onChange(index, "firstName", value)}
            />
          )}
          {visible("middleName") && (
            <TextField
              label={isArabic ? "الاسم الثاني" : "Middle name"}
              value={traveler.middleName}
              required={required("middleName")}
              error={errors[`travelers.${index}.middleName`]}
              onChange={(value) => onChange(index, "middleName", value)}
            />
          )}
          {visible("responsibleAdultTravelerId") &&
            traveler.passengerCategory === "infant_without_seat" && (
              <Labeled
                label={
                  isArabic ? "البالغ المسؤول عن الرضيع" : "Responsible adult"
                }
                required
              >
                <select
                  className={inputClass}
                  value={traveler.responsibleAdultTravelerId || ""}
                  onChange={(event) =>
                    onChange(
                      index,
                      "responsibleAdultTravelerId",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    {isArabic ? "اختر البالغ" : "Choose adult"}
                  </option>
                  {adultTravelers.map((adult, adultIndex) => (
                    <option
                      key={adult._id || adult.id || adultIndex}
                      value={adult._id || adult.id || ""}
                    >
                      {adult.givenName ||
                        adult.fullName ||
                        `${isArabic ? "بالغ" : "Adult"} ${adultIndex + 1}`}
                    </option>
                  ))}
                </select>
                {errors[`travelers.${index}.responsibleAdultTravelerId`] && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    {errors[`travelers.${index}.responsibleAdultTravelerId`]}
                  </p>
                )}
              </Labeled>
            )}
          {visible("lastName") && (
            <TextField
              label={isArabic ? "اسم العائلة" : "Last name"}
              value={traveler.lastName}
              required={required("lastName")}
              error={errors[`travelers.${index}.lastName`]}
              onChange={(value) => onChange(index, "lastName", value)}
            />
          )}
          {visible("email") && (
            <TextField
              type="email"
              label={isArabic ? "بريد المسافر" : "Traveler email"}
              value={traveler.email}
              required
              error={errors[`travelers.${index}.email`]}
              onChange={(value) => onChange(index, "email", value)}
            />
          )}
          {visible("phoneNumber") && (
            <PhoneNumberField
              label={isArabic ? "هاتف المسافر" : "Traveler phone"}
              value={traveler.phoneNumber}
              required
              isArabic={isArabic}
              error={errors[`travelers.${index}.phoneNumber`]}
              onChange={(value) => onChange(index, "phoneNumber", value)}
            />
          )}
          {visible("passportExpiryDate") && (
            <Labeled
              label={isArabic ? "تاريخ انتهاء الوثيقة" : "Document expiry date"}
              required={required("passportExpiryDate")}
            >
              <CalendarField
                value={traveler.passportExpiryDate}
                min={new Date().toISOString().slice(0, 10)}
                required
                isArabic={isArabic}
                error={errors[`travelers.${index}.passportExpiryDate`]}
                onChange={(value) =>
                  onChange(index, "passportExpiryDate", value)
                }
              />
            </Labeled>
          )}
          {/* {visible("documentIssuingCountry") && (
            <Labeled
              label={
                isArabic ? "بلد إصدار الوثيقة" : "Document issuing country"
              }
              required={required("documentIssuingCountry")}
            >
              <NationalitySelect
                value={traveler.documentIssuingCountry}
                required={required("documentIssuingCountry")}
                isArabic={isArabic}
                error={errors[`travelers.${index}.documentIssuingCountry`]}
                onChange={(value) =>
                  onChange(index, "documentIssuingCountry", value)
                }
              />
            </Labeled>
          )} */}
          {visible("fullName") && (
            <TextField
              label={isArabic ? "الاسم الكامل" : "Full name"}
              value={traveler.fullName}
              required
              error={errors[`travelers.${index}.fullName`]}
              onChange={(value) => onChange(index, "fullName", value)}
            />
          )}
          {visible("documentType") && (
            <Labeled
              label={isArabic ? "نوع الوثيقة" : "Document type"}
              required={required("documentType")}
            >
              <select
                className={inputClass}
                value={traveler.documentType || "PASSPORT"}
                onChange={(event) =>
                  onChange(index, "documentType", event.target.value)
                }
              >
                <option value="PASSPORT">
                  {isArabic ? "جواز سفر" : "Passport"}
                </option>
                <option value="NATIONAL_ID">
                  {isArabic ? "هوية وطنية" : "National ID"}
                </option>
                <option value="RESIDENCY_ID">
                  {isArabic ? "إقامة" : "Residency ID"}
                </option>
                <option value="GCC_ID">
                  {isArabic ? "هوية خليجية" : "GCC ID"}
                </option>
              </select>
            </Labeled>
          )}
          {visible("documentNumber") && (
            <TextField
              label={isArabic ? "رقم الوثيقة" : "Document number"}
              value={traveler.documentNumber}
              required={required("documentNumber")}
              error={errors[`travelers.${index}.documentNumber`]}
              onChange={(value) => onChange(index, "documentNumber", value)}
            />
          )}
          {visible("passportNumber") && (
            <TextField
              label={isArabic ? "رقم الجواز" : "Passport number"}
              value={traveler.passportNumber}
              required
              error={errors[`travelers.${index}.passportNumber`]}
              onChange={(value) => onChange(index, "passportNumber", value)}
            />
          )}
          {visible("nationality") && (
            <Labeled
              label={isArabic ? "الجنسية" : "Nationality"}
              required={required("nationality")}
            >
              <NationalitySelect
                value={traveler.nationality}
                required
                isArabic={isArabic}
                error={errors[`travelers.${index}.nationality`]}
                onChange={(value) => onChange(index, "nationality", value)}
              />
            </Labeled>
          )}
          {visible("birthDate") && (
            <Labeled label={isArabic ? "تاريخ الميلاد" : "Birth date"} required>
              <CalendarField
                value={traveler.birthDate}
                max={new Date().toISOString().slice(0, 10)}
                required
                isArabic={isArabic}
                error={errors[`travelers.${index}.birthDate`]}
                onChange={(value) => onChange(index, "birthDate", value)}
              />
            </Labeled>
          )}
          {visible("gender") && (
            <Labeled
              label={isArabic ? "الجنس" : "Gender"}
              required={required("gender")}
            >
              <select
                className={inputClass}
                value={traveler.gender || "male"}
                onChange={(event) =>
                  onChange(index, "gender", event.target.value)
                }
              >
                <option value="male">{isArabic ? "ذكر" : "Male"}</option>
                <option value="female">{isArabic ? "أنثى" : "Female"}</option>
              </select>
            </Labeled>
          )}
          {visible("whatsapp") && (
            <PhoneNumberField
              label={
                isArabic ? "رقم التواصل (واتساب)" : "Contact number (WhatsApp)"
              }
              value={traveler.whatsapp}
              isArabic={isArabic}
              error={errors[`travelers.${index}.whatsapp`]}
              onChange={(value) => onChange(index, "whatsapp", value)}
            />
          )}
          {(documents.passport?.visible ||
            documents.travelDocument?.visible) && (
            <>
              <div className="md:col-span-2 rounded-xl border border-dashed border-emerald-200 bg-white p-4">
                <FileAttachmentUploader
                  labelAr={`${isUmrah ? "صورة جواز المعتمر" : "إرفاق نسخة من الوثيقة"}${documents.passport?.required ? " *" : " (اختياري)"}`}
                  labelEn={`Travel document copy${documents.passport?.required ? " *" : " (optional)"}`}
                  multiple={false}
                  maxFiles={1}
                  maxSizeMB={10}
                  acceptedTypes=".pdf,.jpg,.jpeg,.png"
                  initialFiles={resolveAttachmentFiles(
                    traveler.passportFiles,
                    traveler.passportImage,
                  )}
                  onChange={(files) => {
                    onChange(index, "passportFiles", files);
                    if (!files.length) onChange(index, "passportImage", "");
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
            </>
          )}
          {documents.personalPhoto?.visible && (
            <AttachmentField
              labelAr={`الصورة الشخصية${documents.personalPhoto.required ? "" : " (اختياري)"}`}
              labelEn={`Personal photo${documents.personalPhoto.required ? "" : " (optional)"}`}
              value={traveler.personalPhoto}
              files={traveler.personalPhotoFiles}
              required={documents.personalPhoto.required}
              error={errors[`travelers.${index}.personalPhotoFiles`]}
              onChange={(files) => onChange(index, "personalPhotoFiles", files)}
              onRemoveStored={() => onChange(index, "personalPhoto", "")}
            />
          )}
          {documents.vaccinationCertificate?.visible && (
            <AttachmentField
              labelAr={`شهادة التطعيم${documents.vaccinationCertificate.required ? "" : " (اختياري)"}`}
              labelEn={`Vaccination certificate${documents.vaccinationCertificate.required ? "" : " (optional)"}`}
              value={traveler.vaccinationCertificate}
              files={traveler.vaccinationCertificateFiles}
              required={documents.vaccinationCertificate.required}
              error={errors[`travelers.${index}.vaccinationCertificateFiles`]}
              onChange={(files) =>
                onChange(index, "vaccinationCertificateFiles", files)
              }
              onRemoveStored={() =>
                onChange(index, "vaccinationCertificate", "")
              }
            />
          )}
          {documents.visaAttachment?.visible && (
            <div className="md:col-span-2">
              <AttachmentField
                labelAr={`التأشيرة الحالية${documents.visaAttachment.required ? "" : " إن وجدت (اختياري)"}`}
                labelEn={`Current visa${documents.visaAttachment.required ? "" : ", if available (optional)"}`}
                value={traveler.visaAttachment}
                files={traveler.visaAttachmentFiles}
                required={documents.visaAttachment.required}
                error={errors[`travelers.${index}.visaAttachmentFiles`]}
                onChange={(files) =>
                  onChange(index, "visaAttachmentFiles", files)
                }
                onRemoveStored={() => onChange(index, "visaAttachment", "")}
              />
              <p className="-mt-1 p-2 text-xm leading-6 text-emerald-700">
                {isArabic
                  ? "في حال كان لديك تأشيرة سارية أرفقها هنا؛ سيتم ربطها في البرنامج الجديد دون الحاجة لإعادة إصدار تأشيرة جديدة خلال مدة سريان التأشيرة ."
                  : "If you have a valid visa, attach it here. It will be linked to the new program without issuing another visa while it remains valid."}
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}, areTravelerPropsEqual);

function areTravelerPropsEqual(previous, next) {
  if (
    previous.traveler !== next.traveler ||
    previous.index !== next.index ||
    previous.isOpen !== next.isOpen ||
    previous.canRemove !== next.canRemove ||
    previous.isArabic !== next.isArabic ||
    previous.travelerFields !== next.travelerFields ||
    previous.documents !== next.documents ||
    previous.isUmrah !== next.isUmrah ||
    previous.adultTravelers !== next.adultTravelers ||
    previous.allTravelers !== next.allTravelers ||
    previous.onChange !== next.onChange ||
    previous.onRemove !== next.onRemove ||
    previous.onToggle !== next.onToggle
  )
    return false;

  const prefix = `travelers.${next.index}.`;
  const keys = new Set([
    ...Object.keys(previous.errors).filter((key) => key.startsWith(prefix)),
    ...Object.keys(next.errors).filter((key) => key.startsWith(prefix)),
  ]);
  return [...keys].every((key) => previous.errors[key] === next.errors[key]);
}

function travelersTypeSequence({ traveler, index, allTravelers }) {
  const category = traveler.passengerCategory || "adult";
  return allTravelers
    .slice(0, index + 1)
    .filter((item) => (item.passengerCategory || "adult") === category).length;
}

export function getTravelerTypeLabel({ passengerType, sequence, isArabic }) {
  const labels = {
    adult: { ar: "البالغ", en: "Adult" },
    child: { ar: "الطفل", en: "Child" },
    infant_without_seat: { ar: "الرضيع", en: "Infant" },
  };
  const label = labels[passengerType] || { ar: "المسافر", en: "Traveler" };
  return `${isArabic ? label.ar : label.en} ${sequence}`;
}

function FormSection({ title, subtitle, action, children }) {
  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
          <p className="mb-5 mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {action}
      </div>
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
  disabled = false,
}) {
  return (
    <Labeled label={label} required={required}>
      <input
        type={type}
        inputMode={inputMode}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`${inputClass} ${error ? "border-red-400" : ""}`}
      />
      {error && (
        <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>
      )}
    </Labeled>
  );
}

function AttachmentField({
  labelAr,
  labelEn,
  value,
  files,
  required = false,
  error,
  onChange,
  onRemoveStored,
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4">
      <FileAttachmentUploader
        labelAr={`${labelAr}${required ? " *" : ""}`}
        labelEn={`${labelEn}${required ? " *" : ""}`}
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
      {error && (
        <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>
      )}
    </div>
  );
}

function resolveAttachmentFiles(files, storedValue) {
  if (Array.isArray(files) && files.length) return files;
  return storedValue ? [{ url: storedValue }] : [];
}
