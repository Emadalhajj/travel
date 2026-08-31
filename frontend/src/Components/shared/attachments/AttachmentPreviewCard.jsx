import { useEffect, useState } from "react";
import { FileText, Image as ImageIcon } from "lucide-react";
import { formatImagePath } from "../../../Utils/imageUtils";
import api from "../../../services/api/api";

export default function AttachmentPreviewCard({ label, value, isArabic = true }) {
  const attachment = getAttachmentValue(value);
  const legacyMatch = String(attachment).match(/^\/uploads\/(draft-bookings|payment-proofs)\/([^/]+)$/);
  const privatePath = legacyMatch
    ? `/api/private-files/legacy/${legacyMatch[1]}/${legacyMatch[2]}`
    : String(attachment);
  const isPrivate = privatePath.startsWith("/api/private-files/");
  const url = attachment ? (isPrivate ? privatePath : formatImagePath(attachment)) : "";
  const isImage = /\.(jpe?g|png|gif|webp)(?:\?.*)?$/i.test(url);
  const [authorizedUrl, setAuthorizedUrl] = useState("");

  useEffect(() => {
    if (!isPrivate || !isImage) return undefined;
    let active = true;
    let objectUrl = "";
    api.get(url.replace(/^\/api/, ""), { responseType: "blob" }).then((response) => {
      objectUrl = URL.createObjectURL(response.data);
      if (active) setAuthorizedUrl(objectUrl);
    }).catch(() => {});
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isImage, isPrivate, url]);

  const openAttachment = async (event) => {
    if (!isPrivate) return;
    event.preventDefault();
    const response = await api.get(url.replace(/^\/api/, ""), { responseType: "blob" });
    const objectUrl = URL.createObjectURL(response.data);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {url ? (
        <a href={url} onClick={openAttachment} target="_blank" rel="noreferrer" className="group block">
          <div className="flex h-32 items-center justify-center bg-slate-50">
            {isImage && (!isPrivate || authorizedUrl) ? <img src={isPrivate ? authorizedUrl : url} alt={label} loading="lazy" decoding="async" className="h-full w-full object-cover transition group-hover:scale-[1.02]" /> : <FileText size={42} className="text-red-500" />}
          </div>
          <div className="p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-emerald-700">{isArabic ? "عرض ومعاينة المرفق" : "View attachment"}</p></div>
        </a>
      ) : (
        <div className="flex min-h-32 flex-col items-center justify-center p-4 text-center"><ImageIcon size={30} className="text-slate-300" /><p className="mt-2 text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-sm text-slate-400">{isArabic ? "غير مرفق" : "Not attached"}</p></div>
      )}
    </div>
  );
}

function getAttachmentValue(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.url || value.path || value.fileUrl || value.secureUrl || "";
  return "";
}
