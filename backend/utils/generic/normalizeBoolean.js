/*
تحويل:
"true"
الى 
true
و
"false"
الى 
false
يستخدم مع:

isActive
isFeatured
isDeleted
*/
export const normalizeBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "true") return true;
    if (typeof value === "false") return false;
    return false; // القيمة الافتراضية إذا لم تكن صحيحة أو خاطئة

}