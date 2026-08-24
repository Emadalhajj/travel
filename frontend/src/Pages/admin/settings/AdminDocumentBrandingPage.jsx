import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { QrCode } from "lucide-react";

import PageHeader from "../../../Components/layout/PageHeader";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import { apiGetDocumentBranding, apiUpdateDocumentBranding } from "../../../services/api/admin/documentBranding";
import { clearDocumentBrandingCache } from "../../../Utils/documentPdfBranding";

const initialState = {
  companyNameAr: "", companyNameEn: "", addressAr: "", addressEn: "",
  phone: "", whatsapp: "", email: "", website: "", logoDataUrl: "", qrValue: "",
  showLogo: true, showQr: true,
};

export default function AdminDocumentBrandingPage() {
  const { i18n } = useTranslation();
  const isArabic = (i18n.language || "ar") === "ar";
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiGetDocumentBranding()
      .then((response) => setForm({ ...initialState, ...(response.data?.data || {}) }))
      .catch((requestError) => setError(requestError.response?.data?.message || requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const setField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  const readLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/image\/(png|jpeg)/.test(file.type) || file.size > 2 * 1024 * 1024) {
      setError(isArabic ? "الشعار يجب أن يكون PNG أو JPEG وألا يتجاوز 2 MB" : "Logo must be PNG or JPEG and no larger than 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField("logoDataUrl", reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event?.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await apiUpdateDocumentBranding(form);
      setForm({ ...initialState, ...(response.data?.data || {}) });
      clearDocumentBrandingCache();
      setMessage(isArabic ? "تم حفظ هوية ملفات PDF" : "PDF branding saved");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="relative" dir={isArabic ? "rtl" : "ltr"}>
      <PageHeader eyebrowAr="إعدادات المستندات" eyebrowEn="Document settings" titleAr="هوية ملفات PDF" titleEn="PDF Branding" subtitleAr="إعداد موحد يطبق تلقائيًا على جميع ملفات PDF." subtitleEn="One reusable identity applied automatically to every PDF." />
      <LoadingOverlay show={loading || saving} text={saving ? (isArabic ? "جاري الحفظ..." : "Saving...") : undefined} />
      <ErrorOverlay show={Boolean(error)} message={error} />
      {!loading && <form onSubmit={submit} className="grid gap-6 xl:grid-cols-2">
        <PublicSectionCard title={isArabic ? "هوية الشركة" : "Company identity"} subtitle={isArabic ? "الاسم والشعار الظاهران أعلى المستند." : "Name and logo displayed in the document header."}>
          <div className="space-y-4">
            <Form.Group><Form.Label>{isArabic ? "اسم الشركة بالعربية" : "Arabic company name"}</Form.Label><Form.Control value={form.companyNameAr} maxLength={120} onChange={(event) => setField("companyNameAr", event.target.value)} /></Form.Group>
            <Form.Group><Form.Label>{isArabic ? "اسم الشركة بالإنجليزية" : "English company name"}</Form.Label><Form.Control value={form.companyNameEn} maxLength={120} onChange={(event) => setField("companyNameEn", event.target.value)} /></Form.Group>
            <Form.Group><Form.Label>{isArabic ? "الشعار" : "Logo"}</Form.Label><Form.Control type="file" accept="image/png,image/jpeg" onChange={readLogo} /></Form.Group>
            {form.logoDataUrl && <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4"><img src={form.logoDataUrl} alt="Company logo" className="h-20 w-28 object-contain" /><ActionButton action="delete" label={isArabic ? "إزالة الشعار" : "Remove logo"} onClick={() => setField("logoDataUrl", "")} /></div>}
            <Form.Check type="switch" label={isArabic ? "إظهار الشعار في PDF" : "Show logo in PDF"} checked={form.showLogo} onChange={(event) => setField("showLogo", event.target.checked)} />
          </div>
        </PublicSectionCard>
        <PublicSectionCard title={isArabic ? "العنوان ووسائل التواصل" : "Address & contact"} subtitle={isArabic ? "تظهر هذه البيانات تلقائيًا أسفل كل ملف PDF." : "These details appear automatically in every PDF footer."}>
          <div className="space-y-4">
            <Form.Group><Form.Label>{isArabic ? "العنوان بالعربية" : "Arabic address"}</Form.Label><Form.Control as="textarea" rows={2} maxLength={300} value={form.addressAr} onChange={(event) => setField("addressAr", event.target.value)} /></Form.Group>
            <Form.Group><Form.Label>{isArabic ? "العنوان بالإنجليزية" : "English address"}</Form.Label><Form.Control as="textarea" rows={2} maxLength={300} value={form.addressEn} onChange={(event) => setField("addressEn", event.target.value)} /></Form.Group>
            <div className="grid gap-4 md:grid-cols-2">
              <Form.Group><Form.Label>{isArabic ? "رقم الهاتف" : "Phone"}</Form.Label><Form.Control dir="ltr" maxLength={40} value={form.phone} placeholder="+966..." onChange={(event) => setField("phone", event.target.value)} /></Form.Group>
              <Form.Group><Form.Label>{isArabic ? "رقم واتساب" : "WhatsApp"}</Form.Label><Form.Control dir="ltr" maxLength={40} value={form.whatsapp} placeholder="+966..." onChange={(event) => setField("whatsapp", event.target.value)} /></Form.Group>
              <Form.Group><Form.Label>{isArabic ? "البريد الإلكتروني" : "Email"}</Form.Label><Form.Control dir="ltr" type="email" maxLength={160} value={form.email} placeholder="info@example.com" onChange={(event) => setField("email", event.target.value)} /></Form.Group>
            </div>
            <Form.Group><Form.Label>{isArabic ? "الموقع الإلكتروني" : "Website"}</Form.Label><Form.Control dir="ltr" type="url" maxLength={300} value={form.website} placeholder="https://example.com" onChange={(event) => setField("website", event.target.value)} /></Form.Group>
          </div>
        </PublicSectionCard>
        <PublicSectionCard title={isArabic ? "رمز QR" : "QR code"} subtitle={isArabic ? "يمكن أن يحتوي رابط الموقع أو رابط التحقق من المستند." : "May contain your website or a document verification link."}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4 text-blue-800"><QrCode /><span className="text-sm">{isArabic ? "يُنشأ الرمز تلقائيًا داخل PDF." : "The code is generated automatically inside the PDF."}</span></div>
            <Form.Group><Form.Label>{isArabic ? "محتوى QR" : "QR content"}</Form.Label><Form.Control as="textarea" rows={4} maxLength={1000} value={form.qrValue} placeholder="https://example.com" onChange={(event) => setField("qrValue", event.target.value)} /></Form.Group>
            <Form.Check type="switch" label={isArabic ? "إظهار QR في PDF" : "Show QR in PDF"} checked={form.showQr} onChange={(event) => setField("showQr", event.target.checked)} />
          </div>
        </PublicSectionCard>
        <div className="xl:col-span-2 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
          <span className="text-sm font-semibold text-emerald-700">{message}</span>
          <ActionButton action="apply" size="md" disabled={saving} label={isArabic ? "حفظ إعدادات PDF" : "Save PDF settings"} onClick={submit} />
        </div>
      </form>}
    </div>
  );
}
