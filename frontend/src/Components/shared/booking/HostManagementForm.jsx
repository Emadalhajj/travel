import CalendarField from "../../common/CalendarField";
import FileAttachmentUploader from "../../common/FileAttachmentUploader";

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
  const assignmentCount = (hostId) => travelers.filter((traveler) => traveler.hostId === hostId).length;

  const updateHost = (index, name, value) => {
    onHostsChange(hosts.map((host, hostIndex) => hostIndex === index ? { ...host, [name]: value } : host));
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
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900">{isArabic ? `المستضيف ${index + 1}` : `Host ${index + 1}`} <span className="text-sm text-emerald-700">({assignmentCount(host.hostId)} / 5)</span></h3>
              <button type="button" onClick={() => removeHost(host.hostId)} className="text-sm font-bold text-red-600">{isArabic ? "حذف" : "Remove"}</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={isArabic ? "اسم المستضيف" : "Host name"} value={host.name} error={errors[`hosts.${index}.name`]} onChange={(value) => updateHost(index, "name", value)} />
              <Field label={isArabic ? "رقم الهوية" : "National ID"} value={host.nationalId} error={errors[`hosts.${index}.nationalId`]} onChange={(value) => updateHost(index, "nationalId", value)} />
              <Field label={isArabic ? "رقم الجوال" : "Phone number"} value={host.phone} error={errors[`hosts.${index}.phone`]} onChange={(value) => updateHost(index, "phone", value.replace(/[^+\d]/g, "").slice(0, 16))} />
              <label className="block"><Label text={isArabic ? "تاريخ الميلاد" : "Birth date"} /><CalendarField value={host.birthDate} max={new Date().toISOString().slice(0, 10)} required isArabic={isArabic} error={errors[`hosts.${index}.birthDate`]} onChange={(value) => updateHost(index, "birthDate", value)} /></label>
              <div className="md:col-span-2"><Field label={isArabic ? "العنوان الوطني" : "National address"} value={host.nationalAddress} error={errors[`hosts.${index}.nationalAddress`]} onChange={(value) => updateHost(index, "nationalAddress", value)} /></div>
              <FileAttachmentUploader labelAr="صورة الهوية" labelEn="National ID copy" multiple={false} maxFiles={1} maxSizeMB={10} acceptedTypes=".pdf,.jpg,.jpeg,.png" initialFiles={host.idFiles || (host.idImage ? [{ url: host.idImage }] : [])} onChange={(files) => updateHost(index, "idFiles", files)} />
              <FileAttachmentUploader labelAr="صورة العنوان الوطني" labelEn="National address copy" multiple={false} maxFiles={1} maxSizeMB={10} acceptedTypes=".pdf,.jpg,.jpeg,.png" initialFiles={host.nationalAddressFiles || (host.nationalAddressImage ? [{ url: host.nationalAddressImage }] : [])} onChange={(files) => updateHost(index, "nationalAddressFiles", files)} />
            </div>
          </article>
        ))}
      </div>

      <button type="button" onClick={() => onHostsChange([...hosts, createEmptyHost()])} className="mt-5 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-700">+ {isArabic ? "إضافة مستضيف" : "Add host"}</button>

      {hosts.length > 0 && <div className="mt-6 space-y-3"><h3 className="font-extrabold text-slate-900">{isArabic ? "ربط المعتمرين بالمستضيفين" : "Assign travelers to hosts"}</h3>{travelers.map((traveler, index) => <label key={traveler._id || index} className="grid items-center gap-3 md:grid-cols-2"><span className="text-sm font-semibold text-slate-700">{traveler.fullName || (isArabic ? `المعتمر ${index + 1}` : `Traveler ${index + 1}`)}</span><select className={inputClass} value={traveler.hostId || ""} onChange={(event) => onTravelerHostChange(index, event.target.value)}><option value="">{isArabic ? "بدون مستضيف" : "No host"}</option>{hosts.map((host) => { const count = assignmentCount(host.hostId); const selected = traveler.hostId === host.hostId; return <option key={host.hostId} value={host.hostId} disabled={!selected && count >= 5}>{host.name || (isArabic ? "مستضيف جديد" : "New host")} — {count}/5</option>; })}</select></label>)}</div>}
    </section>
  );
}

function Label({ text }) { return <span className="mb-2 block text-sm font-semibold text-slate-700">{text}<span className="text-red-500"> *</span></span>; }
function Field({ label, value, error, onChange }) { return <label className="block"><Label text={label} /><input className={`${inputClass} ${error ? "border-red-400" : ""}`} value={value || ""} onChange={(event) => onChange(event.target.value)} />{error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}</label>; }
