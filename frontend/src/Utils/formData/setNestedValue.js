// هذه الدالة تقوم بتعيين قيمة في كائن بناءً على مسار معين. تأخذ الكائن الأصلي، والمسار الذي يحدد مكان القيمة الجديدة، والقيمة التي تريد تعيينها. تقوم الدالة بإنشاء نسخة من الكائن الأصلي وتحديث القيمة في المسار المحدد دون تعديل الكائن الأصلي. هذا مفيد للحفاظ على عدم تغير البيانات الأصلية عند تحديث القيم في النماذج أو الحالات في React.
//الهدف: بناء object متداخل من path مثل location.country.ar


export const setNestedValue = (obj, path, value) => {
  const keys = path.split(".");
  const root = { ...obj };
  let current = root;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] =
      current[key] && typeof current[key] === "object"
        ? { ...current[key] }
        : {};
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return root;
};
