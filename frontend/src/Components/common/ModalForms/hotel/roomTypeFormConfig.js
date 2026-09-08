// roomTypeFormConfig.js

import { Col, Row } from "react-bootstrap";
import {
  computations,
  formatters,
  getNestedValue,
} from "../../../../Utils/formHelpers";
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "../../../../constants/currencies";

export const roomTypeFormConfig = (hotels = [] ) => ({

  commonFields: [
      // ==================== مخفي ====================
    // {
    //   name: "hotel",
    //   type: "hidden",
    //   defaultValue: hotelId,
    //   order: 0,
    // },

    // ==================== الأسماء ====================
    {
      name: "nameAr",
      labelAr: "اسم نوع الغرفة (عربي)",
      labelEn: "Room Type Name (Arabic)",
      type: "text",
      col: 6,
      required: true,
      order: 1,
    },
    {
      name: "nameEn",
      labelAr: "اسم نوع الغرفة (إنجليزي)",
      labelEn: "Room Type Name (English)",
      type: "text",
      col: 6,
      required: true,
      order: 1,
    },

    // ==================== الوصف ====================
    {
      name: "descriptionAr",
      labelAr: "الوصف (عربي)",
      labelEn: "Description (Arabic)",
      type: "textarea",
      rows: 3,
      col: 6,
      order: 2,
    },
    {
      name: "descriptionEn",
      labelAr: "الوصف (إنجليزي)",
      labelEn: "Description (English)",
      type: "textarea",
      rows: 3,
      col: 6,
      order: 2,
    },
    //============ تحديد الفندق =====================
    {
      name: "hotel",
      labelAr :"الفنادق" ,
      labelEn :"Hotel Type",
      type:"select",
      col: "6",
      required: true,
      order: 3,
      options : hotels.map((hotel)=>({
        value: hotel._id,
        labelAr:hotel.nameAr ,
        labelEn: hotel.nameEn
      }))
    },

    // ==================== السعة ====================
      {
      name: "capacity.maxAdults",
      labelAr: "البالغين (الحد الأقصى)",
      labelEn: "Max Adults",
      type: "number",
      col: 6,
      required: true,
      order: 3,
      defaultValue: 2,
      min: 1,
      max:12
    },
    {
      name: "capacity.maxChildren",
      labelAr: "الأطفال (الحد الأقصى)",
      labelEn: "Max Children",
      type: "number",
      col: 6,
      required: true,
      order: 3,
      defaultValue: 0,
      min: 0,
      max:12
    },
    {
      name: "totalOccupancy",
      labelAr: "⚡ إجمالي الأشخاص",
      labelEn: "Total Occupancy",
      type: "computed",
      col: 4,
      order: 3,
      compute: (formData) => {
        const adults = parseInt(formData.capacity?.maxAdults) || 0;
        const children = parseInt(formData.capacity?.maxChildren) || 0;
        return adults + children;
      },
      display: (value, formData) => {
        const adults = formData.capacity?.maxAdults || 0;
        const children = formData.capacity?.maxChildren || 0;
        return (
          <div className="text-center">
            <div className="fs-3 fw-bold text-primary">{value}</div>
            <small className="text-muted">{adults} بالغ + {children} طفل</small>
          </div>
        );
      },
    },


    // ==================== المساحة ونوع السرير ====================
    {
      name: "size",
      labelAr: "المساحة (م²)",
      labelEn: "Size (m²)",
      type: "number",
      col: 6,
      order: 4,
      min: 1,
    },
    {
      name: "bedType",
      labelAr: "نوع السرير",
      labelEn: "Bed Type",
      type: "select",
      col: 6,
      required: true,
      order: 4,
      defaultValue: "quad",
      options: [
        { value: "single", labelAr: "فردي", labelEn: "Single" },
        { value: "twin", labelAr: "توأم", labelEn: "Twin" },
        { value: "double", labelAr: "مزدوج", labelEn: "Double" },
        { value: "queen", labelAr: "كوين", labelEn: "Queen" },
        { value: "king", labelAr: "كينج", labelEn: "King" },
        { value: "triple", labelAr: "ثلاثي", labelEn: "Triple" },
        { value: "quad", labelAr: "رباعي", labelEn: "Quad" },
        { value: "quintuple", labelAr: "خماسي", labelEn: "Quintuple" },
        { value: "quintuple", labelAr: "خماسي", labelEn: "Quintuple" },
        { value: "Hexagonal", labelAr: "سداسية", labelEn: "Quintuple" },
        { value: "Seven", labelAr: "سباعية", labelEn: "Quintuple" },
        { value: "family", labelAr: "عائلي", labelEn: "Family" },
        { value: "suite", labelAr: "جناح", labelEn: "Suite" },
      ],
    },

    // ==================== عدد الغرف المتاحة ====================
    {
      name: "totalRooms",
      labelAr: "عدد الغرف المتاحة",
      labelEn: "Total Available Rooms",
      type: "number",
      col: 6,
      required: true,
      order: 5,
      defaultValue: 1,
      min: 1,
    },

    // ==================== الوجبات ====================
    {
      name: "mealPlan",
      labelAr: "نظام الوجبات",
      labelEn: "Meal Plan",
      type: "select",
      col: 6,
      required: true,
      order: 5,
      defaultValue: "room_only",
      options: [
        { value: "room_only", labelAr: "الغرفة فقط", labelEn: "Room Only" },
        { value: "breakfast", labelAr: "الإفطار", labelEn: "Breakfast" },
        { value: "half_board", labelAr: "نصف شامل", labelEn: "Half Board" },
        { value: "full_board", labelAr: "شامل كلي", labelEn: "Full Board" },
        {
          value: "all_inclusive",
          labelAr: "شامل جميع الخدمات",
          labelEn: "All Inclusive",
        },
      ],
    },

    // ==================== التسعير الأساسي ====================
       {
      name: "pricing.basePrice",
      labelAr: "السعر الأساسي/ليلة",
      labelEn: "Base Price/Night",
      type: "number",
      col: 4,
      required: true,
      order: 6,
      min: 0,
    },
    {
      name: "pricing.currency",
      labelAr: "العملة",
      labelEn: "Currency",
      type: "select",
      col: 4,
      order: 6,
      defaultValue: DEFAULT_CURRENCY,
      options: CURRENCY_OPTIONS,
    },
    {
      name: "pricing.discountPercent",
      labelAr: "خصم عام %",
      labelEn: "General Discount %",
      type: "number",
      col: 4,
      order: 6,
      defaultValue: 0,
      min: 0,
      max: 100,
      helperText: "يُطبق على السعر الأساسي فقط",
    },
    // ==================== فترات التسعير الخاصة ====================
    {
      name: "pricing.pricingPeriods",
      labelAr: "🏷️ فترات التسعير الخاصة",
      labelEn: "Special Pricing Periods",
      type: "array",
      col: 12,
      order: 7,
        required: false,       // ← اختياري

      fields: [
        {
          name: "nameAr",
          label: "اسم الفترة (عربي)",
          type: "text",
          col: 6,
          required: true,
        },
        {
          name: "nameEn",
          label: "اسم الفترة (إنجليزي)",
          type: "text",
          col: 6,
          required: true,
        },
        {
          name: "periodType",
          label: "نوع الفترة",
          type: "select",
          col: 4,
          required: true,
          options: [
            { value: "weekend", labelAr: "نهاية أسبوع", labelEn: "Weekend" },
            { value: "seasonal", labelAr: "موسمي", labelEn: "Seasonal" },
            { value: "holiday", labelAr: "عطلة رسمية", labelEn: "Holiday" },
            { value: "custom", labelAr: "مخصص", labelEn: "Custom" },
          ],
        },
        {
          name: "price",
          label: "السعر",
          type: "number",
          col: 4,
          required: true,
          min: 0,
        },
        {
  /* priority يُحدد أي فترة تُطبق عندما يتداخل تاريخين أو أكثر.
الذي يحصل على اعلى رقم له الاوليه الاولى 
// مثال:
// "عيد الفطر": priority = 5  ← يُطبق أولاً
// "نهاية أسبوع": priority = 1  ← يُتجاهل
  */
          name: "priority",
          label: "الأولوية",
          type: "number",
          col: 4,
          defaultValue: 0,
        },
        {
          name: "days",
          label: "الأيام (لنهاية الأسبوع)",
          type: "checkbox-group",
          col: 12,
          condition: { field: "periodType", value: "weekend" },
          options: [
            { key: "friday", labelAr: "الجمعة", labelEn: "Friday" },
            { key: "saturday", labelAr: "السبت", labelEn: "Saturday" },
            { key: "sunday", labelAr: "الأحد", labelEn: "Sunday" },
          ],
        },
        {
          name: "startDate",
          label: "تاريخ البداية",
          type: "date",
          col: 6,
          condition: { field: "periodType", value: ["seasonal", "holiday", "custom"] },
        },
        {
          name: "endDate",
          label: "تاريخ النهاية",
          type: "date",
          col: 6,
          condition: { field: "periodType", value: ["seasonal", "holiday", "custom"] },
        },
        {
          name: "isActive",
          label: "نشط",
          type: "checkbox",
          col: 3,
          defaultValue: true,
        },
      ],
    },

    // {
    //   name: "pricing.weekendPrice",
    //   labelAr: "سعر نهاية الأسبوع",
    //   labelEn: "Weekend Price",
    //   type: "number",
    //   col: 4,
    //   order: 6,
    //   min: 0,
    // },
    // {
    //   name: "pricing.discountPercent",
    //   labelAr: "نسبة الخصم %",
    //   labelEn: "Discount %",
    //   type: "number",
    //   col: 4,
    //   order: 3,
    //   defaultValue: 0,
    //   min: 0,
    //   max: 100,
    //   helperText: "أدخل نسبة بين 0 و 100",
    //   group: "السعة والتسعير",
    // },
    // {
    //   name: "finalPrice",
    //   labelAr: "⚡ السعر بعد الخصم",
    //   labelEn: "Final Price",
    //   type: "computed",
    //   col: 4,
    //   order: 3,
    //   group: "السعة والتسعير",
    //   compute: computations.finalPrice, // ← يستخدم الدالة من formHelpers
    //   display: (value , formData) => {
    //     const base = getNestedValue(formData, "pricing.basePrice") || 0;
    //     const discount =
    //       getNestedValue(formData, "pricing.discountPercent") || 0;
    //     const currency = getNestedValue(formData, "pricing.currency") || "SAR";

    //     return (
    //       <div className="text-center">
    //         {discount > 0 && (
    //           <div className="text-decoration-line-through text-muted small">
    //             {formatters.currency(base, currency)}
    //           </div>
    //         )}
    //         <div className="fs-4 fw-bold text-success">
    //           {formatters.currency(value, currency)}
    //         </div>
    //         {discount > 0 && (
    //           <Badge bg="danger" className="mt-1">
    //             وفّر {discount}%
    //           </Badge>
    //         )}
    //       </div>
    //     );
    //   },
    // },
    // {
    //   name: "pricing.currency",
    //   labelAr: "العملة",
    //   labelEn: "Currency",
    //   type: "select",
    //   col: 4,
    //   required: true,
    //   order: 6,
    //   defaultValue: "SAR",
    //   options: [
    //     { value: "SAR", labelAr: "ريال سعودي", labelEn: "SAR" },
    //     { value: "USD", labelAr: "دولار أمريكي", labelEn: "USD" },
    //     { value: "EUR", labelAr: "يورو", labelEn: "EUR" },
    //     { value: "GBP", labelAr: "جنيه إسترليني", labelEn: "GBP" },
    //     { value: "AED", labelAr: "درهم إماراتي", labelEn: "AED" },
    //     { value: "EGP", labelAr: "جنيه مصري", labelEn: "EGP" },
    //     { value: "TRY", labelAr: "ليرة تركية", labelEn: "TRY" },
    //   ],
    // },

    // ─── ملخص التسعير ───
    {
      name: "priceSummary",
      labelAr: "📊 ملخص التسعير",
      labelEn: "Price Summary",
      type: "computed",
      col: 12,
      order: 4,
      group: "السعة والتسعير",
      compute: (formData, computed) => {
        const base = getNestedValue(formData, "pricing.basePrice") || 0;
        const final = computed?.finalPrice || computations.finalPrice(formData);
        const savings = base - final;
        return { base, final, savings };
      },
      display: (value, formData) => {
        const currency = getNestedValue(formData, "pricing.currency") || "SAR";
        return (
          <Row className="g-3">
            <Col md={4}>
              <div className="p-2 text-center">
                <small className="text-muted d-block">السعر الأصلي</small>
                <div className="text-decoration-line-through">
                  {formatters.currency(value?.base, currency)}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="p-2 text-center text-success">
                <small className="d-block">السعر النهائي</small>
                <div className="fs-4 fw-bold">
                  {formatters.currency(value?.final, currency)}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="p-2 text-center text-danger">
                <small className="d-block">مبلغ التوفير</small>
                <div className="fs-5 fw-bold">
                  {formatters.currency(value?.savings, currency)}
                </div>
              </div>
            </Col>
          </Row>
        );
      },
    },
    // ==================== المرافق ====================
    {
      name: "amenities",
      labelAr: "مرافق الغرفة",
      labelEn: "Room Amenities",
      type: "checkbox-group",
      col: 12,
      order: 8,
      options: [
        { key: "wifi", labelAr: "واي فاي", labelEn: "WiFi" },
        { key: "tv", labelAr: "تلفزيون", labelEn: "TV" },
        { key: "minibar", labelAr: "ميني بار", labelEn: "Minibar" },
        { key: "safe", labelAr: "خزنة", labelEn: "Safe" },
        { key: "balcony", labelAr: "شرفة", labelEn: "Balcony" },
        { key: "sea-view", labelAr: "إطلالة بحرية", labelEn: "Sea View" },
        { key: "city-view", labelAr: "إطلالة مدينة", labelEn: "City View" },
        { key: "Haram-view", labelAr: "إطلالة الحرم", labelEn: "City View" },
        { key: "Qabah-view", labelAr: "إطلالة الكعبة", labelEn: "City View" },

        { key: "bathtub", labelAr: "بانيو", labelEn: "Bathtub" },
        { key: "jacuzzi", labelAr: "جاكوزي", labelEn: "Jacuzzi" },
        { key: "kitchenette", labelAr: "مطبخ صغير", labelEn: "Kitchenette" },
        { key: "iron", labelAr: "مكواة", labelEn: "Iron" },
        { key: "hair-dryer", labelAr: "مجفف شعر", labelEn: "Hair Dryer" },
        {
          key: "air-conditioning",
          labelAr: "تكييف",
          labelEn: "Air Conditioning",
        },
        { key: "heating", labelAr: "تدفئة", labelEn: "Heating" },
        { key: "soundproof", labelAr: "عازل للصوت", labelEn: "Soundproof" },
        { key: "crib", labelAr: "سرير أطفال", labelEn: "Baby Crib" },
      ],
    },

    // ==================== الصور ====================
    {
      name: "images",
      labelAr: "صور الغرفة",
      labelEn: "Room Images",
      type: "file",
      multiple: true,
      col: 12,
      order: 9,
    },

    // ==================== التوفر ====================
    {
  name: "availability.availablePeriods",
  labelAr: "فترات توفر الغرفة",
  labelEn: "Room Sellable Periods",
  type: "array",
  col: 12,
  order: 20,
  defaultValue: [],
  fields: [
    {
      name: "nameAr",
      labelAr: "اسم الفترة بالعربية",
      labelEn: "Period Name Arabic",
      type: "text",
      col: 6,
    },
    {
      name: "nameEn",
      labelAr: "اسم الفترة بالإنجليزية",
      labelEn: "Period Name English",
      type: "text",
      col: 6,
    },
    {
      name: "startDate",
      labelAr: "تاريخ البداية",
      labelEn: "Start Date",
      type: "date",
      col: 6,
      required: true,
    },
    {
      name: "endDate",
      labelAr: "تاريخ النهاية",
      labelEn: "End Date",
      type: "date",
      col: 6,
      required: true,
    },
    {
      name: "isActive",
      labelAr: "نشطة",
      labelEn: "Active",
      type: "checkbox",
      col: 4,
      defaultValue: true,
    },
    {
      name: "notes",
      labelAr: "ملاحظات",
      labelEn: "Notes",
      type: "textarea",
      col: 12,
    },
  ],
},

    // ==================== الحالة ====================
    {
      name: "isActive",
      labelAr: "نشط",
      labelEn: "Active",
      type: "checkbox",
      col: 6,
      defaultValue: true,
      order: 10,
    },
  ],
});
