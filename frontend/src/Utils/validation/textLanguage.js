const ARABIC_LETTER = /[\u0600-\u06FF]/;
const LATIN_LETTER = /[A-Za-z]/;
const LATIN_TOKEN = /[A-Za-z]+/g;

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
