import { FileText, Image as ImageIcon } from "lucide-react";
import { formatImagePath } from "../../../Utils/imageUtils";

export default function AttachmentPreviewCard({ label, value, isArabic = true }) {
  const attachment = getAttachmentValue(value);
  const url = attachment ? formatImagePath(attachment) : "";
  const isImage = /\.(jpe?g|png|gif|webp)(?:\?.*)?$/i.test(url);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="group block">
          <div className="flex h-32 items-center justify-center bg-slate-50">
            {isImage ? <img src={url} alt={label} className="h-full w-full object-cover transition group-hover:scale-[1.02]" /> : <FileText size={42} className="text-red-500" />}
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
