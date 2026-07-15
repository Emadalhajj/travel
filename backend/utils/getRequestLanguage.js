/*
لتعريب النصوص الملاحظات وغيرها في هذا الملف، يمكنك اتباع الخطوات التالية:
*/

export  const isArabicRequest = (req)=>{
    return req.headers["accept-language"]?.startsWith("ar");
}