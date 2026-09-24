import api from "../services/api/api";

export const isPrivateFileUrl = (value) =>
  String(value || "").startsWith("/api/private-files/");

export const fetchPrivateFileObjectUrl = async (url) => {
  const response = await api.get(String(url).replace(/^\/api/, ""), {
    responseType: "blob",
  });
  return URL.createObjectURL(response.data);
};

export const openPrivateFile = async (url) => {
  const objectUrl = await fetchPrivateFileObjectUrl(url);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
};
