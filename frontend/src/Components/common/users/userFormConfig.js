import { USER_ROLES } from "../../../constants/auth/roles";

export const normalizeUserForForm = (user) => {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  return { ...safeUser, password: "", confirmPassword: "" };
};

export const userFormConfig = ({
  isCreate = true,
  allowedRoles = Object.values(USER_ROLES),
} = {}) => ({
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

    ...(isCreate
      ? [
          {
            name: "password",
            labelAr: "كلمة المرور",
            labelEn: "Password",
            type: "password",
            col: 6,
            required: true,
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
        { value: USER_ROLES.ADMIN, labelAr: "مدير", labelEn: "Admin" },
        { value: USER_ROLES.USER, labelAr: "مستخدم", labelEn: "User" },
        { value: USER_ROLES.SUPER_ADMIN, labelAr: "مشرف", labelEn: "Super Admin" },
      ].filter(({ value }) => allowedRoles.includes(value)),
    },
    {
      name: "profileImage",
      labelAr: "صورة الملف الشخصي",
      labelEn: "Profile Image",
      type: "file",
      multiple: false,
      maxImages: 1,
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

});
