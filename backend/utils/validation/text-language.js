import Joi from "joi";

const ARABIC_LETTER = /[\u0600-\u06FF]/;
const LATIN_LETTER = /[A-Za-z]/;
const LATIN_TOKEN = /[A-Za-z]+/g;

// يسمح داخل النص العربي بالاختصارات التجارية المكتوبة بأحرف كبيرة مثل VIP وSUV.
export const isArabicText = (value = "") => {
  const text = String(value).trim();
  if (!text) return true;
  const withoutAcronyms = text.replace(LATIN_TOKEN, (token) =>
    token === token.toUpperCase() ? "" : token,
  );
  return ARABIC_LETTER.test(text) && !LATIN_LETTER.test(withoutAcronyms);
};

export const isEnglishText = (value = "") => {
  const text = String(value).trim();
  return !text || (LATIN_LETTER.test(text) && !ARABIC_LETTER.test(text));
};

const languageTextSchema = (validator, code) =>
  Joi.string().custom((value, helpers) =>
    validator(value) ? value : helpers.error(code),
  );

export const arabicTextSchema = () =>
  languageTextSchema(isArabicText, "string.arabicText").messages({
    "string.arabicText": "ARABIC_TEXT_REQUIRED",
  });

export const englishTextSchema = () =>
  languageTextSchema(isEnglishText, "string.englishText").messages({
    "string.englishText": "ENGLISH_TEXT_REQUIRED",
  });
