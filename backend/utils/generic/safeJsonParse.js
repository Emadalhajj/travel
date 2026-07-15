/*نحقق Safe JSON Parsing
في بعض الأحيان، قد نتلقى بيانات JSON غير صالحة أو غير متوقعة من مصادر خارجية (مثل واجهات برمجة التطبيقات أو قواعد البيانات). يمكن أن يؤدي محاولة تحليل JSON غير صالح إلى حدوث أخطاء في التطبيق. لحل هذه المشكلة، يمكننا إنشاء دالة تساعدنا في تحليل JSON بأمان، بحيث تعيد قيمة افتراضية أو رسالة خطأ بدلاً من تعطيل التطبيق.
فيما يلي مثال على دالة `safeJsonParse` التي تقوم بتحليل JSON بأمان:


 */

export const safeJsonParse = (
    value , 
    fallback
)=> {
    if(!value){
        return fallback
    }
    if(
        typeof value === "object"
    ){
        return value
    }
    try {
        return JSON.parse(value)

    }
    catch (error){
        const parseError = 
        new Error(`Failed to parse JSON: ${error.message}`);
        parseError.statusCode = 400
        throw parseError
    }
}