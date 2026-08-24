import api from "../api";

export const apiGetDocumentBranding = () => api.get("/document-branding");
export const apiUpdateDocumentBranding = (data) => api.patch("/document-branding", data);
