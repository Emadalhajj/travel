import { serializeForApi } from "./serialize";

export const buildFormData = (data = {}, config = {}) => {
  const formState = data?.formState || data;
  const imageState = data?.imageState || {};

  // ✅ التحويل قبل الإرسال
  const payload = serializeForApi(formState, config);
  const fd = new FormData();

  if (
    payload &&
    typeof payload === "object" &&
    Object.keys(payload).length > 0
  ) {
    fd.append("data", JSON.stringify(payload));
  }

  const appendFiles = (fieldName, files) => {
    if (!Array.isArray(files)) return;
    files.forEach((file) => {
      if (file instanceof File) {
        fd.append(fieldName, file);
      }
    });
  };

  // ✅ الصور
  Object.entries(imageState).forEach(([fieldName, data]) => {
    data?.newImages?.forEach((file) => {
      fd.append(fieldName, file);
    });

    data?.deletedOldImages?.forEach((img) => {
      fd.append(`${fieldName}Deleted[]`, img);
    });
  });

  // ✅ المرفقات الجديدة
  appendFiles("attachments", formState.attachments);

  // ✅ المرفقات المحذوفة
  if (
    formState.deleteAttachments &&
    Array.isArray(formState.deleteAttachments)
  ) {
    formState.deleteAttachments.forEach((url) => {
      fd.append("deleteAttachments[]", url);
    });
  }

  return fd;
};
