// خريطة ميدانية
// utils/form/fieldMap.js
// هذه الدالة تأخذ تكوين النموذج وتبني خريطة تربط أسماء الحقول بأنواعها

export const buildFieldMap = (config) => {
  const map = {};

  const allFields = [
    ...(config?.commonFields || []),
    ...Object.values(config?.conditionalFields || {}).flat(),
  ];

  allFields.forEach((field) => {
    map[field.name] = field.type;
  });

  return map;
};