/*
Domain Helpers

تفهم شكل البيانات
تطبيع البيانات (Normalization)
*/
import { normalizeString } from "../generic/normalizeString.js";

export const normalizeContact = (contact = {}) => {
  return {
    tel: normalizeString(contact.tel),
    
    phone: normalizeString(contact.phone),

    phone2: normalizeString(contact.phone2),

    email: normalizeString(contact.email),

    website: normalizeString(contact.website),

    whatsapp: normalizeString(contact.whatsapp),

    telegram: normalizeString(contact.telegram),
  };
};
