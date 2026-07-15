/*
وظيفته تعريف ترتيب الخطوات فقط.
*/
export const BOOKING_WIZARD_STEPS = [
  {
    key: "choose_package",
    title: "اختيار البرنامج",
    description: "اختر برنامج العمرة المناسب",
  },
  {
    key: "customer_info",
    title: "بيانات العميل",
    description: "أدخل بيانات صاحب الحجز",
  },
  {
    key: "pilgrims",
    title: "المعتمرين",
    description: "أضف بيانات المعتمرين",
  },
  {
    key: "services",
    title: "الخدمات",
    description: "اختر الخدمات الإضافية",
  },
  {
  key: "documents",
  title: "المستندات",
  description: "رفع مستندات الحجز",
},
  {
    key: "review",
    title: "المراجعة",
    description: "راجع تفاصيل الحجز",
  },
  {
    key: "payment",
    title: "الدفع",
    description: "أدخل بيانات الدفع",
  },
  {
    key: "success",
    title: "تم الحجز",
    description: "تم إنشاء الحجز بنجاح",
  },
  
];