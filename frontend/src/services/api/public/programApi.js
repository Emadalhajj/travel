import api from "../api";

/*
=========================================================
Public Program API
=========================================================

هذا الملف مسؤول عن جلب برامج العمرة العامة للعميل.

Endpoints:
GET /api/umrah-programs/public
GET /api/umrah-programs/public/:id
=========================================================
*/

const PUBLIC_PROGRAM_BASE_URL = "/umrah-programs/public";

// جلب كل البرامج العامة
export const apiGetPublicPrograms = async (params = {}) => {
  const response = await api.get(PUBLIC_PROGRAM_BASE_URL, { params });
  return response.data;
};

// جلب تفاصيل برنامج واحد
export const apiGetPublicProgramById = async (programId) => {
  const response = await api.get(`${PUBLIC_PROGRAM_BASE_URL}/${programId}`);
  return response.data;
};
