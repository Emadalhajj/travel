/*
=====================================================
Payment Configuration API
=====================================================

مسؤول عن جميع طلبات إدارة إعدادات الدفع.

Endpoints:
-----------------------------------------------------
GET    /payments/configurations
GET    /payments/configurations/:id
POST   /payments/configurations
PATCH  /payments/configurations/:id
PATCH  /payments/configurations/:id/status
DELETE /payments/configurations/:id
=====================================================
*/

import api from "../api";

/*
=====================================================
Base URL
=====================================================

إذا كان axios instance يحتوي مسبقًا على /api،
تبقى القيمة كما هي.

مثال:
baseURL = /api

ويكون المسار النهائي:
/api/payments/configurations
=====================================================
*/

const BASE_URL = "/payments/configurations";

/*
=====================================================
Build Query String
=====================================================

يحذف القيم الفارغة حتى لا يتم إرسال:

?search=&sectionCode=&isActive=
=====================================================
*/

const buildQueryParams = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    query.append(key, String(value));
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
};

/*
=====================================================
Get Payment Configurations
=====================================================
*/

export const apiGetPaymentConfigurations = async (params = {}) => {
  const response = await api.get(`${BASE_URL}${buildQueryParams(params)}`);

  return response.data;
};

/*
=====================================================
Get Payment Configuration By ID
=====================================================
*/

export const apiGetPaymentConfigurationById = async (configurationId) => {
  if (!configurationId) {
    throw new Error("Payment configuration ID is required");
  }

  const response = await api.get(`${BASE_URL}/${configurationId}`);

  return response.data;
};

/*
=====================================================
Create Payment Configuration
=====================================================
*/

export const apiCreatePaymentConfiguration = async (payload) => {
  const response = await api.post(BASE_URL, payload);

  return response.data;
};

/*
=====================================================
Update Payment Configuration
=====================================================
*/

export const apiUpdatePaymentConfiguration = async ({
  configurationId,
  payload,
}) => {
  if (!configurationId) {
    throw new Error("Payment configuration ID is required");
  }

  const response = await api.patch(`${BASE_URL}/${configurationId}`, payload);

  return response.data;
};

/*
=====================================================
Update Payment Configuration Status
=====================================================
*/

export const apiUpdatePaymentConfigurationStatus = async ({
  configurationId,
  isActive,
}) => {
  if (!configurationId) {
    throw new Error("Payment configuration ID is required");
  }

  const response = await api.patch(`${BASE_URL}/${configurationId}/status`, {
    isActive,
  });

  return response.data;
};

/*
=====================================================
Delete Payment Configuration
=====================================================
*/

export const apiDeletePaymentConfiguration = async (configurationId) => {
  if (!configurationId) {
    throw new Error("Payment configuration ID is required");
  }

  const response = await api.delete(`${BASE_URL}/${configurationId}`);

  return response.data;
};
