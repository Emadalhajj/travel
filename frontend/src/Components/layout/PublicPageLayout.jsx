/*
=========================================================
PublicPageLayout
=========================================================

Layout موحد لكل صفحات العميل / الصفحات العامة.

من هنا نتحكم في:
- خلفية الصفحات
- عرض المحتوى
- المسافات
- اتجاه الصفحة
- الخطوط العامة
- الألوان الأساسية
- شكل الصفحة العام

أي تعديل تصميم عام للصفحات العامة يتم من هنا.
=========================================================
*/

export const PUBLIC_THEME = {
  colors: {
    primary: "emerald",
    background: "bg-slate-50",
    card: "bg-white",
    text: "text-slate-900",
    mutedText: "text-slate-500",
    border: "border-slate-100",
  },

  layout: {
    pagePadding: "px-4 py-8",
    containerWidth: "w-full lg:w-[80%] max-w-none",
  },

  typography: {
    font: "font-sans",
    heading: "text-2xl md:text-3xl font-bold",
    sectionTitle: "text-xl font-bold",
    body: "text-sm leading-6",
  },

  radius: {
    card: "rounded-2xl",
    button: "rounded-xl",
  },

  shadow: {
    card: "shadow-sm",
  },
};

export default function PublicPageLayout({
  children,
  className = "",
  containerClassName = "",
}) {
  return (
    <main
      className={`
        min-h-screen
        ${PUBLIC_THEME.colors.background}
        ${PUBLIC_THEME.layout.pagePadding}
        ${PUBLIC_THEME.typography.font}
        ${PUBLIC_THEME.colors.text}
        ${className}
      `}
    >
      <div
        className={`
          mx-auto
          ${PUBLIC_THEME.layout.containerWidth}
          ${containerClassName}
        `}
      >
        {children}
      </div>
    </main>
  );
}


// /*
// البنية المشتركة (Shared Architecture) التي ستستخدمها كل صفحات المشروع.

// */
// export default function PublicPageLayout({
//   children,
//   maxWidth = "max-w-7xl",
//   className = "",
// }) {
//   return (
//     <div className={`min-h-screen bg-slate-50 px-4 py-8 ${className}`}>
//       <div className={`mx-auto ${maxWidth}`}>
//         {children}
//       </div>
//     </div>
//   );
// }