export const buildSearchQuery = ({
  search, // نص البحث الذي أدخله المستخدم
  searchFields = [], // الحقول التي نريد البحث فيها (مثلاً: ["name", "description"])
}) => {
  const filter = {};
  if(!search || !searchFields.length) return filter
const cleanSearch = search.trim();

  filter.$or = searchFields.map((field)=>({
    [field] : { $regex: cleanSearch, $options: "i"}
  }))

  // if (search && searchFields.length) {
  //   filter.$or = searchFields.map((field) => ({
  //     [field]: { $regex: search, $options: "i" },
  //   }));
  // }
/*
يعني:
$regex 👉 بحث نصي جزئي (like search)
$options: "i" 👉 غير حساس لحالة الأحرف بعنى اذا كانت الحروف صغيرة او كبيرة يتم الحث عنها
*/ 
  return filter;
};
