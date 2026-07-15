export const inventoryFormConfig = ({
  roomTypes = [],
  trips = [],
  transports = [],
  vehicleRentals = [],
  extraServices = [],
  visas = [],
} = {}) => {
  const getProductsByType = (type) => {
    if (type === "roomType") return roomTypes;
    if (type === "trip") return trips;
    if (type === "transport") return transports;
    if (type === "vehicleRental") return vehicleRentals;
    if (type === "extraService") return extraServices;
    if (type === "visa") return visas;
    return [];
  };

  const mapOptions = (items = []) =>
    items.map((item) => ({
      value: item._id,
      labelAr: item.labelAr || item.nameAr || item.titleAr || item.name?.ar || item.name || item._id,
      labelEn: item.labelEn || item.nameEn || item.titleEn || item.name?.en || item.name || item._id,
    }));

  return {
    commonFields: [
      {
        name: "inventoryType",
        labelAr: "نوع المخزون",
        labelEn: "Inventory Type",
        type: "select",
        col: 6,
        required: true,
        order: 1,
        options: [
          { value: "roomType", labelAr: "نوع غرفة", labelEn: "Room Type" },
          { value: "trip", labelAr: "رحلة", labelEn: "Trip" },
          { value: "transport", labelAr: "وسيلة نقل", labelEn: "Transport" },
          { value: "vehicleRental", labelAr: "تأجير نقل", labelEn: "Vehicle Rental" },
          { value: "extraService", labelAr: "خدمة إضافية", labelEn: "Extra Service" },
          { value: "visa", labelAr: "تأشيرة", labelEn: "Visa" },
        ],
      },
      {
        name: "itemId",
        labelAr: "المنتج",
        labelEn: "Product",
        type: "select",
        col: 6,
        required: true,
        order: 2,
        dependsOn: "inventoryType",
        options: (formState) => {
          const type = formState?.inventoryType || "roomType";
          return mapOptions(getProductsByType(type));
        },
      },
      {
        name: "startDate",
        labelAr: "تاريخ البداية",
        labelEn: "Start Date",
        type: "date",
        col: 6,
        required: true,
        order: 3,
      },
      {
        name: "endDate",
        labelAr: "تاريخ النهاية",
        labelEn: "End Date",
        type: "date",
        col: 6,
        required: true,
        order: 3,
      },
      {
        name: "total",
        labelAr: "الإجمالي",
        labelEn: "Total",
        type: "number",
        col: 4,
        required: true,
        min: 1,
        defaultValue: 1,
        order: 4,
      },
      {
        name: "reserved",
        labelAr: "المحجوز",
        labelEn: "Reserved",
        type: "number",
        col: 4,
        min: 0,
        defaultValue: 0,
        order: 4,
      },
      {
        name: "blocked",
        labelAr: "الموقوف",
        labelEn: "Blocked",
        type: "number",
        col: 4,
        min: 0,
        defaultValue: 0,
        order: 4,
      },
      {
        name: "notes",
        labelAr: "ملاحظات",
        labelEn: "Notes",
        type: "textarea",
        rows: 2,
        col: 12,
        order: 5,
      },
      {
        name: "isActive",
        labelAr: "نشط",
        labelEn: "Active",
        type: "checkbox",
        col: 12,
        defaultValue: true,
        order: 6,
      },
    ],
  };
};

// export const inventoryFormConfig = ({
//    products  = [] ,
//   onInventoryTypeChange, } = {}) => ({
//   commonFields: [
//     {
//       name: "inventoryType",
//       labelAr: "نوع المخزون",
//       labelEn: "Inventory Type",
//       type: "select",
//       col: 6,
//       required: true,
//       order: 1,
//       onChange: (value) => {
//     onInventoryTypeChange?.(value);
//   },
//       options: [
//         { value: "roomType", labelAr: "نوع غرفة", labelEn: "Room Type" },
//         { value: "trip", labelAr: "رحلة", labelEn: "Trip" },
//         { value: "transport", labelAr: "وسيلة نقل", labelEn: "Transport" },
//         { value: "vehicleRental", labelAr: "تأجير نقل", labelEn: "Vehicle Rental" },
//         { value: "extraService", labelAr: "خدمة إضافية", labelEn: "Extra Service" },
//         { value: "visa", labelAr: "تأشيرة", labelEn: "Visa" },
//       ],
//     },
//     {
//       name: "itemId",
//       labelAr: "المنتج",
//       labelEn: "Product",
//       type: "select",
//       col: 6,
//       required: true,
//       order: 2,
//       options: products.map((item) => ({
//         value: item._id,
//         labelAr: item.labelAr || item.nameAr || item.titleAr || item.name || item._id,
//         labelEn: item.labelEn || item.nameEn || item.titleEn || item.name || item._id,
//       })),
//     },
//     {
//       name: "startDate",
//       labelAr: "تاريخ البداية",
//       labelEn: "Start Date",
//       type: "date",
//       col: 6,
//       required: true,
//       order: 3,
//     },
//     {
//       name: "endDate",
//       labelAr: "تاريخ النهاية",
//       labelEn: "End Date",
//       type: "date",
//       col: 6,
//       required: true,
//       order: 3,
//     },
//     {
//       name: "total",
//       labelAr: "الإجمالي",
//       labelEn: "Total",
//       type: "number",
//       col: 4,
//       required: true,
//       min: 1,
//       defaultValue: 1,
//       order: 4,
//     },
//     {
//       name: "reserved",
//       labelAr: "المحجوز",
//       labelEn: "Reserved",
//       type: "number",
//       col: 4,
//       min: 0,
//       defaultValue: 0,
//       order: 4,
//     },
//     {
//       name: "blocked",
//       labelAr: "الموقوف",
//       labelEn: "Blocked",
//       type: "number",
//       col: 4,
//       min: 0,
//       defaultValue: 0,
//       order: 4,
//     },
//     {
//       name: "notes",
//       labelAr: "ملاحظات",
//       labelEn: "Notes",
//       type: "textarea",
//       rows: 2,
//       col: 12,
//       order: 5,
//     },
//     {
//   name: "isActive",
//   labelAr: "نشط",
//   labelEn: "Active",
//   type: "switch",
//   col: 12,
//   defaultValue: true,
//   order: 6,
// }
//   ],
// });