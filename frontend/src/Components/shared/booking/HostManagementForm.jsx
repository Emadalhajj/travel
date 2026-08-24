import { useEffect, useState } from "react";
import CalendarField from "../../common/CalendarField";
import FileAttachmentUploader from "../../common/FileAttachmentUploader";
import ActionButton from "../../common/buttons/ActionButton";
import PhoneNumberField from "../../common/PhoneNumberField";
import PublicButton from "../buttons/PublicButton";

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export const createEmptyHost = () => ({
  hostId: window.crypto?.randomUUID?.() || `host-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  name: "",
  nationalId: "",
  phone: "",
  birthDate: "",
  nationalAddress: "",
  idImage: "",
  nationalAddressImage: "",
  idFiles: [],
  nationalAddressFiles: [],
});

export default function HostManagementForm({ hosts, travelers, onHostsChange, onTravelerHostChange, errors = {}, isArabic = true }) {
  const [openHosts, setOpenHosts] = useState({ 0: true });
  const assignmentCount = (hostId) => travelers.filter((traveler) => traveler.hostId === hostId).length;

  useEffect(() => {
    const hostIndexesWithErrors = Object.keys(errors)
      .filter((key) => errors[key])
      .map((key) => key.match(/^hosts\.(\d+)\./)?.[1])
      .filter((index) => index !== undefined);

    if (!hostIndexesWithErrors.length) return;
    setOpenHosts((previous) => ({
      ...previous,
      ...Object.fromEntries(hostIndexesWithErrors.map((index) => [Number(index), true])),
    }));
  }, [errors]);

  const updateHost = (index, name, value) => {
    onHostsChange(hosts.map((host, hostIndex) => hostIndex === index ? { ...host, [name]: value } : host));
  };
  const updateHostFields = (index, values) => {
    onHostsChange(hosts.map((host, hostIndex) => hostIndex === index ? { ...host, ...values } : host));
  };

  const removeHost = (hostId) => {
    onHostsChange(hosts.filter((host) => host.hostId !== hostId));
    travelers.forEach((traveler, index) => {
      if (traveler.hostId === hostId) onTravelerHostChange(index, "");
    });
  };

  return (
    <section className="mt-8 border-t border-slate-200 pt-8">
      <h2 className="text-xl font-extrabold text-slate-900">{isArabic ? "بيانات المستضيفين" : "Hosts Information"}</h2>
      <p className="mb-5 mt-1 text-sm text-slate-500">{isArabic ? "إضافة المستضيف اختيارية، ويمكن ربط خمسة معتمرين كحد أقصى بكل مستضيف." : "Adding a host is optional. Each host may be assigned to up to five travelers."}</p>

      <div className="space-y-5">
        {hosts.map((host, index) => (
          <article key={host.hostId} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
            <div className={`${openHosts[index] ? "mb-5" : ""} flex items-center justify-between`}>
              <h3 className="font-extrabold text-slate-900">{isArabic ? `المستضيف ${index + 1}` : `Host ${index + 1}`} <span className="text-sm text-emerald-700">({assignmentCount(host.hostId)} / 5)</span></h3>
              <div className="flex items-center gap-2"><ActionButton action="toggle" expanded={Boolean(openHosts[index])} onClick={() => setOpenHosts((previous) => ({ ...previous, [index]: !previous[index] }))} /><ActionButton action="delete" onClick={() => removeHost(host.hostId)} /></div>
            </div>
            {openHosts[index] && <div className="grid gap-4 md:grid-cols-2">
              <Field label={isArabic ? "اسم المستضيف" : "Host name"} value={host.name} error={errors[`hosts.${index}.name`]} onChange={(value) => updateHost(index, "name", value)} />
              <Field label={isArabic ? "رقم الهوية" : "National ID"} value={host.nationalId} error={errors[`hosts.${index}.nationalId`]} onChange={(value) => updateHost(index, "nationalId", value)} />
              <PhoneNumberField label={isArabic ? "رقم الجوال" : "Phone number"} value={host.phone} required isArabic={isArabic} error={errors[`hosts.${index}.phone`]} onChange={(value) => updateHost(index, "phone", value)} />
              <label className="block"><Label text={isArabic ? "تاريخ الميلاد" : "Birth date"} /><CalendarField value={host.birthDate} max={new Date().toISOString().slice(0, 10)} required isArabic={isArabic} error={errors[`hosts.${index}.birthDate`]} onChange={(value) => updateHost(index, "birthDate", value)} /></label>
              <div className="md:col-span-2"><Field label={isArabic ? "العنوان الوطني" : "National address"} value={host.nationalAddress} error={errors[`hosts.${index}.nationalAddress`]} onChange={(value) => updateHost(index, "nationalAddress", value)} /></div>
              <div><FileAttachmentUploader labelAr="صورة الهوية أو الإقامة *" labelEn="National ID or residence copy *" multiple={false} maxFiles={1} maxSizeMB={10} acceptedTypes=".pdf,.jpg,.jpeg,.png" initialFiles={resolveHostFiles(host.idFiles, host.idImage)} onChange={(files) => updateHostFields(index, { idFiles: files, ...(!files.length ? { idImage: "" } : {}) })} />{errors[`hosts.${index}.idFiles`] && <p className="mt-1 text-xs font-semibold text-red-600">{errors[`hosts.${index}.idFiles`]}</p>}</div>
              <div><FileAttachmentUploader labelAr="صورة العنوان الوطني *" labelEn="National address copy *" multiple={false} maxFiles={1} maxSizeMB={10} acceptedTypes=".pdf,.jpg,.jpeg,.png" initialFiles={resolveHostFiles(host.nationalAddressFiles, host.nationalAddressImage)} onChange={(files) => updateHostFields(index, { nationalAddressFiles: files, ...(!files.length ? { nationalAddressImage: "" } : {}) })} />{errors[`hosts.${index}.nationalAddressFiles`] && <p className="mt-1 text-xs font-semibold text-red-600">{errors[`hosts.${index}.nationalAddressFiles`]}</p>}</div>
            </div>}
          </article>
        ))}
      </div>

      <PublicButton variant="successOutline" size="sm" className="mt-5" onClick={() => { setOpenHosts((previous) => ({ ...previous, [hosts.length]: true })); onHostsChange([...hosts, createEmptyHost()]); }}>+ {isArabic ? "إضافة مستضيف" : "Add host"}</PublicButton>

      {hosts.length > 0 && <div className="mt-6 space-y-3"><h3 className="font-extrabold text-slate-900">{isArabic ? "ربط المعتمرين بالمستضيفين" : "Assign travelers to hosts"}</h3>{travelers.map((traveler, index) => <label key={traveler._id || index} className="grid items-center gap-3 md:grid-cols-2"><span className="text-sm font-semibold text-slate-700">{traveler.fullName || (isArabic ? `المعتمر ${index + 1}` : `Traveler ${index + 1}`)}</span><select className={inputClass} value={traveler.hostId || ""} onChange={(event) => onTravelerHostChange(index, event.target.value)}><option value="">{isArabic ? "بدون مستضيف" : "No host"}</option>{hosts.map((host) => { const count = assignmentCount(host.hostId); const selected = traveler.hostId === host.hostId; return <option key={host.hostId} value={host.hostId} disabled={!selected && count >= 5}>{host.name || (isArabic ? "مستضيف جديد" : "New host")} — {count}/5</option>; })}</select></label>)}</div>}
    </section>
  );
}

function Label({ text }) { return <span className="mb-2 block text-sm font-semibold text-slate-700">{text}<span className="text-red-500"> *</span></span>; }
function Field({ label, value, error, onChange }) { return <label className="block"><Label text={label} /><input className={`${inputClass} ${error ? "border-red-400" : ""}`} value={value || ""} onChange={(event) => onChange(event.target.value)} />{error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}</label>; }
function resolveHostFiles(files, storedValue) { return Array.isArray(files) && files.length ? files : storedValue ? [{ url: storedValue }] : []; }
