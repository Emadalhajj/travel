export const userFormConfig = ({ isCreate = true } = {}) => ({
  commonFields: [
    {
      name: "firstName",
      labelAr: "الاسم الأول",
      labelEn: "First Name",
      type: "text",
      col: 6,
    },
    {
      name: "lastName",
      labelAr: "الاسم الأخير",
      labelEn: "Last Name",
      type: "text",
      col: 6,
    },
    {
      name: "username",
      labelAr: "اسم المستخدم",
      labelEn: "Username",
      type: "text",
      col: 6,
    },
    {
      name: "email",
      labelAr: "البريد الإلكتروني",
      labelEn: "Email",
      type: "email",
      col: 6,
    },

    // ────── كلمة المرور تظهر فقط عند الإضافة ──────
    ...(isCreate
      ? [
          {
            name: "password",
            labelAr: "كلمة المرور",
            labelEn: "Password",
            type: "password",
            col: 6,
            required: true, // يمكنك إضافة هذا إذا أردت
          },
          {
            name: "confirmPassword",
            labelAr: "تأكيد كلمة المرور",
            labelEn: "Confirm Password",
            type: "password",
            col: 6,
            required: true,
          },
        ]
      : []),

    {
      name: "role",
      labelAr: "الدور",
      labelEn: "Role",
      type: "select",
      col: 6,
      options: [
        { value: "admin", labelAr: "مدير", labelEn: "Admin" },
        { value: "user", labelAr: "مستخدم", labelEn: "User" },
        { value: "superAdmin", labelAr: "مشرف", labelEn: "Super Admin" },
      ],
    },
    {
      name: "profileImage",
      labelAr: "صورة الملف الشخصي",
      labelEn: "Profile Image",
      type: "file",
      multiple: false,
      col: 12,
    },
    {
      name: "isActive",
      labelAr: "الحالة",
      labelEn: "Status",
      type: "checkbox",
      col: 12,
    },
  ],

  // createFields : [
  //     {
  //         name : "password",
  //         labelAr : "كلمة المرور",
  //         labelEn : "Password",
  //         type : "password",

  //         col : 6,
  //     },
  //     {
  //         name : "confirmPassword",
  //         labelAr : "تأكيد كلمة المرور",
  //         labelEn : "Confirm Password",
  //         type : "password",
  //         col : 6,
  //     },
  // ]
});
