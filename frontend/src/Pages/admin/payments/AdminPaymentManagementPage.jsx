import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  CreditCard,
  Landmark,
  Link2,
  PlugZap,
  ReceiptText,
  Settings2,
} from "lucide-react";

import PageHeader from "../../../Components/layout/PageHeader";

/*
=====================================================
Admin Payment Management Page
=====================================================

الصفحة الرئيسية لنظام إدارة الدفع.

لا تنفذ عمليات CRUD بنفسها، بل تعمل كبوابة موحدة
للوصول إلى الوحدات المختلفة:

- طرق الدفع.
- الحسابات البنكية.
- مزودو الدفع.
- ربط الطرق بالأقسام والمنتجات.
- العمليات المالية.
=====================================================
*/

export default function AdminPaymentManagementPage() {

  const { i18n } = useTranslation();

  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";

  /*
  =====================================================
  Payment Management Sections
  =====================================================

  جميع خيارات الصفحة معرفة في مصفوفة واحدة حتى:
  - لا نكرر تصميم البطاقات.
  - يسهل إضافة وحدة جديدة.
  - يبقى شكل الصفحة موحدًا.
  =====================================================
  */

  const sections = [
    {
      key: "methods",

      titleAr: "طرق الدفع",
      titleEn: "Payment Methods",

      descriptionAr:
        "إدارة طرق الدفع الأساسية وتفعيلها أو تعطيلها وترتيب ظهورها.",

      descriptionEn:
        "Manage payment methods, status, requirements, and display order.",

      path: "/admin/payments/methods",

      icon: CreditCard,

      badgeAr: "الإعدادات الأساسية",
      badgeEn: "Core Settings",
    },

    {
      key: "bankAccounts",

      titleAr: "الحسابات البنكية",
      titleEn: "Bank Accounts",

      descriptionAr:
        "إضافة عدة حسابات بنكية وتحديد الحسابات المفعلة والظاهرة للعملاء.",

      descriptionEn:
        "Manage bank accounts, currencies, visibility, and default accounts.",

      path: "/admin/payments/bank-accounts",

      icon: Landmark,

      badgeAr: "التحويل البنكي",
      badgeEn: "Bank Transfer",
    },

    {
      key: "providers",

      titleAr: "مزودو الدفع",
      titleEn: "Payment Providers",

      descriptionAr:
        "إدارة HyperPay ومزودي الدفع الإلكتروني وبيئة الاختبار والتشغيل.",

      descriptionEn:
        "Manage HyperPay and other online payment provider configurations.",

      path: "/admin/payments/providers",

      icon: PlugZap,

      badgeAr: "الدفع الإلكتروني",
      badgeEn: "Online Payments",
    },

    {
      key: "configurations",

      titleAr: "ربط طرق الدفع",
      titleEn: "Payment Assignments",

      descriptionAr:
        "تحديد طرق الدفع المسموحة لكل قسم أو منتج واختيار الحساب أو المزود.",

      descriptionEn:
        "Assign payment methods, bank accounts, and providers to sections and products.",

      path: "/admin/payments/configurations",

      icon: Link2,

      badgeAr: "الأقسام والمنتجات",
      badgeEn: "Sections & Products",
    },

    {
      key: "transactions",

      titleAr: "عمليات الدفع",
      titleEn: "Payment Transactions",

      descriptionAr:
        "متابعة العمليات الناجحة والمعلقة والفاشلة والتحويلات قيد المراجعة.",

      descriptionEn:
        "Review successful, pending, failed, refunded, and bank transfer transactions.",

      path: "/admin/payments/payment-transactions",

      icon: ReceiptText,

      badgeAr: "السجل المالي",
      badgeEn: "Financial Records",
    },
  ];

  return (
    <div className="container py-4">
      <PageHeader
        titleAr="إدارة الدفع"
        titleEn="Payment Management"
        subtitleAr="إدارة طرق الدفع والحسابات البنكية ومزودي الدفع وربطها بالأقسام والمنتجات."
        subtitleEn="Manage payment methods, bank accounts, providers, and payment assignments."
      />

      {/* وصف آلية النظام */}

      <section className="mb-4 rounded-3 border bg-light p-4">
        <div className="d-flex align-items-start gap-3">
          <div className="rounded-circle bg-success bg-opacity-10 p-3 text-success">
            <Settings2 size={26} />
          </div>

          <div>
            <h2 className="h5 fw-bold mb-2">
              {isArabic
                ? "كيف يعمل نظام الدفع؟"
                : "How does payment management work?"}
            </h2>

            <p className="mb-0 text-muted">
              {isArabic
                ? "أنشئ طريقة الدفع أولًا، ثم أضف الحساب البنكي أو مزود الدفع، وبعد ذلك اربط الطريقة بالقسم أو المنتج الذي يمكنه استخدامها."
                : "Configure payment methods first, add bank accounts or providers, then assign each method to the appropriate section or product."}
            </p>
          </div>
        </div>
      </section>

      {/* خطوات الإعداد */}

      <section className="mb-4">
        <div className="row g-3">
          <SetupStep
            number="1"
            title={
              isArabic
                ? "تهيئة طريقة الدفع"
                : "Configure Method"
            }
            description={
              isArabic
                ? "تفعيل التحويل أو مدى أو Visa وغيرها."
                : "Enable bank transfer, Mada, Visa, and other methods."
            }
          />

          <SetupStep
            number="2"
            title={
              isArabic
                ? "إضافة الحساب أو المزود"
                : "Add Account or Provider"
            }
            description={
              isArabic
                ? "إضافة الحساب البنكي أو بيانات HyperPay."
                : "Add a bank account or HyperPay provider configuration."
            }
          />

          <SetupStep
            number="3"
            title={
              isArabic
                ? "ربط الطريقة"
                : "Assign Method"
            }
            description={
              isArabic
                ? "اختيار القسم أو المنتج الذي ستظهر فيه الطريقة."
                : "Choose the section or product where the method is available."
            }
          />
        </div>
      </section>

      {/* وحدات إدارة الدفع */}

      <section className="row g-4">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <div
              key={section.key}
              className="col-12 col-md-6 col-xl-4"
            >
              <NavLink
                to={section.path}
                className="h-100 w-100 border-0 bg-transparent p-0 text-start"
              >
                <article className="card h-100 border-0 shadow-sm transition">
                  <div className="card-body d-flex flex-column p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div className="rounded-3 bg-success bg-opacity-10 p-3 text-success">
                        <Icon size={28} />
                      </div>

                      <span className="badge rounded-pill bg-light text-secondary">
                        {isArabic
                          ? section.badgeAr
                          : section.badgeEn}
                      </span>
                    </div>

                    <h2 className="h5 fw-bold mt-4">
                      {isArabic
                        ? section.titleAr
                        : section.titleEn}
                    </h2>

                    <p className="flex-grow-1 text-muted">
                      {isArabic
                        ? section.descriptionAr
                        : section.descriptionEn}
                    </p>

                    <div className="mt-3 fw-bold text-success">
                      {isArabic
                        ? "فتح الإدارة ←"
                        : "Open Management →"}
                    </div>
                  </div>
                </article>
              </NavLink>
            </div>
          );
        })}
      </section>
    </div>
  );
}

/*
=====================================================
Setup Step
=====================================================

مكون محلي صغير خاص بالصفحة فقط.

لا يستحق إنشاء ملف مستقل لأنه:
- يستخدم مرة واحدة.
- لا يحتوي منطقًا عامًا.
- لا يكرر مكونًا موجودًا في المشروع.
=====================================================
*/

function SetupStep({
  number,
  title,
  description,
}) {
  return (
    <div className="col-12 col-md-4">
      <div className="h-100 rounded-3 border bg-white p-3 shadow-sm">
        <div className="d-flex align-items-start gap-3">
          <span className="d-flex align-items-center justify-content-center rounded-circle bg-success text-white fw-bold"
            style={{
              width: 34,
              height: 34,
              flexShrink: 0,
            }}
          >
            {number}
          </span>

          <div>
            <h3 className="h6 fw-bold mb-1">
              {title}
            </h3>

            <p className="small text-muted mb-0">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
