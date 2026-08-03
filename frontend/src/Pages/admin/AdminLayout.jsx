// src/Pages/admin/AdminLayout.jsx

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Archive,
  Boxes,
  Bus,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  Hotel,
  Landmark,
  LayoutDashboard,
  Link2,
  Menu,
  Package,
  Plane,
  PlugZap,
  ReceiptText,
  Settings2,
  ShoppingCart,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import {
  useTranslation,
} from "react-i18next";

import {
  useSelector,
} from "react-redux";

import ActionButton from "../../Components/common/buttons/ActionButton";

import generateBreadcrumb from "../../Utils/generateBreadcrumb";

/*
=====================================================
Path Helpers
=====================================================
*/

/*
تحديد هل المسار الحالي تابع لعنصر معين.

المسار الرئيسي /admin/payments يجب أن يكون مطابقًا
بشكل كامل؛ لأنه Prefix لجميع صفحات الدفع.
*/
const isPathActive = (
  currentPath,
  targetPath,
) => {
  if (!targetPath) {
    return false;
  }

  if (
    targetPath === "/admin" ||
    targetPath === "/admin/payments"
  ) {
    return currentPath === targetPath;
  }

  return (
    currentPath === targetPath ||
    currentPath.startsWith(
      `${targetPath}/`,
    )
  );
};

/*
=====================================================
Admin Layout
=====================================================
*/

export default function AdminLayout() {
  const {
    i18n,
  } = useTranslation();

  const lang =
    i18n.language || "ar";

  const isArabic =
    lang === "ar";

  const location =
    useLocation();
  const navigate =
    useNavigate();

  /*
  =====================================================
  Authentication
  =====================================================
  */

  const currentUser =
    useSelector(
      (state) =>
        state.auth.currentUser,
    );

  const user =
    currentUser?.user ||
    currentUser;

  const isAdmin =
    user?.role === "admin" ||
    user?.role === "superAdmin";

  /*
  =====================================================
  Sidebar State
  =====================================================
  */

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(true);

  const [
    openMenus,
    setOpenMenus,
  ] = useState({
    payments:
      location.pathname.startsWith(
        "/admin/payments",
      ) ||
      location.pathname.startsWith(
        "/admin/payments/payment-transactions",
      ),
  });

  /*
  =====================================================
  Navigation Items
  =====================================================

  تستخدم useMemo لأن أسماء العناصر تتغير
  عند تغيير اللغة.
  */

  const navItems =
    useMemo(
      () => [
        {
          path: "/admin",

          label: isArabic
            ? "لوحة التحكم"
            : "Dashboard",

          icon: LayoutDashboard,
        },

        /*
        -----------------------------------------------
        إدارة الدفع
        -----------------------------------------------

        عنصر رئيسي يحتوي صفحات فرعية.
        */

        {
          key: "payments",

          label: isArabic
            ? "إدارة الدفع"
            : "Payment Management",

          icon: CreditCard,

          children: [
            {
              path:
                "/admin/payments",

              label: isArabic
                ? "نظرة عامة"
                : "Overview",

              icon:
                LayoutDashboard,
            },

            {
              path:
                "/admin/payments/methods",

              label: isArabic
                ? "طرق الدفع"
                : "Payment Methods",

              icon: Settings2,
            },

            {
              path:
                "/admin/payments/bank-accounts",

              label: isArabic
                ? "الحسابات البنكية"
                : "Bank Accounts",

              icon: Landmark,
            },

            {
              path:
                "/admin/payments/providers",

              label: isArabic
                ? "مزودو الدفع"
                : "Payment Providers",

              icon: PlugZap,
            },

            {
              path:
                "/admin/payments/configurations",

              label: isArabic
                ? "ربط طرق الدفع"
                : "Payment Assignments",

              icon: Link2,
            },

            {
              path:
                "/admin/payments/payment-transactions",

              label: isArabic
                ? "عمليات الدفع"
                : "Payment Transactions",

              icon: ReceiptText,
            },
          ],
        },

        {
          path: "/admin/orders",

          label: isArabic
            ? "إدارة الطلبات"
            : "Orders Management",

          icon: ShoppingCart,
        },

        {
          path: "/admin/products",

          label: isArabic
            ? "إدارة المنتجات"
            : "Products Management",

          icon: Archive,
        },

        {
          path: "/admin/users",

          label: isArabic
            ? "إدارة المستخدمين"
            : "Users Management",

          icon: Users,
        },

        {
          path: "/admin/hotels",

          label: isArabic
            ? "إدارة الفنادق"
            : "Hotels Management",

          icon: Hotel,
        },

        {
          path: "/admin/visas",

          label: isArabic
            ? "إدارة التأشيرات"
            : "Visas Management",

          icon: FileText,
        },

        {
          path: "/admin/transports",

          label: isArabic
            ? "إدارة النقل"
            : "Transports Management",

          icon: Bus,
        },

        {
          path: "/admin/trips",

          label: isArabic
            ? "إدارة الرحلات"
            : "Trips Management",

          icon: Plane,
        },

        {
          path:
            "/admin/umrah-program",

          label: isArabic
            ? "إدارة البرامج"
            : "Program Management",

          icon: Package,
        },

        {
          path:
            "/admin/extra-services",

          label: isArabic
            ? "الخدمات الإضافية"
            : "Extra Services",

          icon: Sparkles,
        },

        {
          path:
            "/admin/vehicle-rentals",

          label: isArabic
            ? "تأجير النقل"
            : "Vehicle Rentals",

          icon: Bus,
        },

        {
          path:
            "/admin/inventory",

          label: isArabic
            ? "المخزون"
            : "Inventory",

          icon: Boxes,
        },
      ],
      [isArabic],
    );

  /*
  =====================================================
  Flattened Navigation
  =====================================================

  تستخدم للـBreadcrumb والبحث عن عنوان الصفحة.

  لا نضيف عنصرًا إضافيًا يدويًا لإدارة الدفع؛ لأن
  صفحة Overview موجودة أصلًا داخل children.
  */

  const flatNavItems =
    useMemo(
      () =>
        navItems.flatMap(
          (item) =>
            Array.isArray(
              item.children,
            )
              ? item.children
              : [item],
        ),
      [navItems],
    );

  /*
  =====================================================
  Current Navigation Item
  =====================================================
  */

  const currentNavItem =
    useMemo(() => {
      /*
      نرتب العناصر حسب طول المسار تنازليًا حتى:
      /admin/payments/bank-accounts
      يفحص قبل:
      /admin/payments
      */

      const sortedItems = [
        ...flatNavItems,
      ].sort(
        (first, second) =>
          second.path.length -
          first.path.length,
      );

      return (
        sortedItems.find(
          (item) =>
            isPathActive(
              location.pathname,
              item.path,
            ),
        ) || null
      );
    }, [
      flatNavItems,
      location.pathname,
    ]);

  /*
  =====================================================
  Open Payment Menu Automatically
  =====================================================

  عند فتح صفحة دفع مباشرة من الرابط، يتم فتح
  القائمة الفرعية تلقائيًا.
  */

  useEffect(() => {
    const isPaymentPage =
      location.pathname.startsWith(
        "/admin/payments",
      ) ||
      location.pathname.startsWith(
        "/admin/payments/payment-transactions",
      );

    if (!isPaymentPage) {
      return;
    }

    setOpenMenus(
      (previous) => ({
        ...previous,
        payments: true,
      }),
    );
  }, [location.pathname]);

  /*
  =====================================================
  Handlers
  =====================================================
  */

  const toggleSidebar = () => {
    setIsSidebarOpen(
      (previous) => !previous,
    );
  };

  const toggleMenu = (
    menuKey,
  ) => {
    /*
    عند الضغط على مجموعة بينما الشريط مغلق:
    - نفتح الشريط.
    - نفتح المجموعة المطلوبة.
    */

    if (!isSidebarOpen) {
      setIsSidebarOpen(true);

      setOpenMenus(
        (previous) => ({
          ...previous,
          [menuKey]: true,
        }),
      );

      return;
    }

    setOpenMenus(
      (previous) => ({
        ...previous,
        [menuKey]:
          !previous[menuKey],
      }),
    );
  };

  /*
  =====================================================
  Authorization Redirects
  =====================================================

  يجب وضعها بعد جميع Hooks حتى لا تتغير أعداد
  واستدعاءات Hooks بين Render وآخر.
  */

  if (!user) {
    return (
      <Navigate
        to="/authpage"
        replace
      />
    );
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /*
  =====================================================
  Render
  =====================================================
  */

  return (
    <div
      className="flex h-screen overflow-hidden bg-gray-100"
      dir={
        isArabic ? "rtl" : "ltr"
      }
    >
      {/* Sidebar */}

      <aside
        className={`z-20 flex-shrink-0 overflow-y-auto bg-gradient-to-b from-indigo-800 to-indigo-950 text-white transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? "w-72"
            : "w-20"
        }`}
      >
        {/* Sidebar Header */}

        <div className="flex h-16 items-center justify-between border-b border-indigo-700/50 px-4">
          {isSidebarOpen ? (
            <h1 className="text-xl font-bold tracking-wide">
              {isArabic
                ? "لوحة الإدارة"
                : "Admin Panel"}
            </h1>
          ) : (
            <div className="text-2xl font-black">
              A
            </div>
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={
              isSidebarOpen
                ? "Close sidebar"
                : "Open sidebar"
            }
            className="rounded-lg p-2 transition-colors hover:bg-indigo-700/50"
          >
            {isSidebarOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>

        {/* Navigation */}

        <nav className="mt-6 space-y-1 px-3 pb-6">
          {navItems.map(
            (item) => {
              /*
              -------------------------------------------
              Parent Item With Children
              -------------------------------------------
              */

              if (
                Array.isArray(
                  item.children,
                )
              ) {
                const isParentActive =
                  item.children.some(
                    (child) =>
                      isPathActive(
                        location.pathname,
                        child.path,
                      ),
                  );

                const isOpen =
                  Boolean(
                    openMenus[
                      item.key
                    ],
                  );

                const ParentIcon =
                  item.icon;

                return (
                  <div
                    key={item.key}
                    className="space-y-1"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        toggleMenu(
                          item.key,
                        );

                        if (
                          item.key ===
                          "payments"
                        ) {
                          navigate(
                            "/admin/payments",
                          );
                        }
                      }}
                      title={
                        !isSidebarOpen
                          ? item.label
                          : undefined
                      }
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
                        isParentActive
                          ? "bg-indigo-700/80 text-white shadow-md"
                          : "text-indigo-200 hover:bg-indigo-700/40 hover:text-white"
                      }`}
                    >
                      <ParentIcon
                        size={
                          isSidebarOpen
                            ? 22
                            : 24
                        }
                        strokeWidth={
                          isParentActive
                            ? 2.2
                            : 1.8
                        }
                      />

                      {isSidebarOpen ? (
                        <>
                          <span className="flex-1 text-start font-medium">
                            {
                              item.label
                            }
                          </span>

                          {isOpen ? (
                            <ChevronUp
                              size={18}
                            />
                          ) : (
                            <ChevronDown
                              size={18}
                            />
                          )}
                        </>
                      ) : null}
                    </button>

                    {/* Submenu */}

                    {isSidebarOpen &&
                    isOpen ? (
                      <div
                        className={`space-y-1 ${
                          isArabic
                            ? "mr-5 border-r border-indigo-700/60 pr-3"
                            : "ml-5 border-l border-indigo-700/60 pl-3"
                        }`}
                      >
                        {item.children.map(
                          (
                            child,
                          ) => {
                            const ChildIcon =
                              child.icon;

                            return (
                              <NavLink
                                key={
                                  child.path
                                }
                                to={
                                  child.path
                                }
                                end={
                                  child.path ===
                                  "/admin/payments"
                                }
                                className={({
                                  isActive,
                                }) =>
                                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                                    isActive
                                      ? "bg-indigo-600/80 text-white"
                                      : "text-indigo-200 hover:bg-indigo-700/40 hover:text-white"
                                  }`
                                }
                              >
                                <ChildIcon
                                  size={
                                    18
                                  }
                                  strokeWidth={
                                    1.8
                                  }
                                />

                                <span className="font-medium">
                                  {
                                    child.label
                                  }
                                </span>
                              </NavLink>
                            );
                          },
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              }

              /*
              -------------------------------------------
              Normal Navigation Item
              -------------------------------------------
              */

              const ItemIcon =
                item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={
                    item.path ===
                    "/admin"
                  }
                  title={
                    !isSidebarOpen
                      ? item.label
                      : undefined
                  }
                  className={({
                    isActive,
                  }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-700/80 text-white shadow-md"
                        : "text-indigo-200 hover:bg-indigo-700/40 hover:text-white"
                    }`
                  }
                >
                  {({
                    isActive,
                  }) => (
                    <>
                      <ItemIcon
                        size={
                          isSidebarOpen
                            ? 22
                            : 24
                        }
                        strokeWidth={
                          isActive
                            ? 2.2
                            : 1.8
                        }
                      />

                      {isSidebarOpen ? (
                        <span className="font-medium">
                          {
                            item.label
                          }
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              );
            },
          )}
        </nav>
      </aside>

      {/* Main Area */}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}

        <header className="flex min-h-16 items-center justify-between gap-4 bg-white px-6 py-2 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <ActionButton
              size="md"
              action="back"
              label={
                isArabic
                  ? "عودة"
                  : "Back"
              }
            />

            <div className="min-w-0">
              {/* Breadcrumb */}

              <nav className="mb-1 flex items-center gap-2 overflow-hidden text-sm text-gray-500">
                {generateBreadcrumb(
                  location.pathname,
                  flatNavItems,
                  lang,
                )}
              </nav>

              {/* Current Page Title */}

              <h2 className="truncate text-xl font-semibold text-gray-800">
                {currentNavItem?.label ||
                  (isArabic
                    ? "لوحة التحكم"
                    : "Dashboard")}
              </h2>
            </div>
          </div>

          {/* User Avatar */}

          <div className="flex flex-shrink-0 items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              {String(
                user?.name ||
                  user?.username ||
                  "E",
              )
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// // src/components/layout/AdminLayout.jsx
// import React, { Children, useEffect, useState } from "react";
// import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
// import {
//   LayoutDashboard,
//   Package,
//   ShoppingCart,
//   Users,
//   Hotel,
//   Plane,
//   Bus,
//   FileText,
//   Menu,
//   X,
//   Sparkles,
//   Boxes,
//   Archive,
//   CreditCard,
//   Landmark,
//   PlugZap,
//   Link2,
//   ReceiptText,
//   ChevronDown,
//   ChevronUp,
//   Settings2,
// } from "lucide-react";
// import { useTranslation } from "react-i18next";
// import { useSelector } from "react-redux";
// import ActionButton from "../../Components/common/buttons/ActionButton";
// import { Button } from "react-bootstrap";
// import generateBreadcrumb from "../../Utils/generateBreadcrumb";

// export default function Adminlayout() {
//   const { i18n } = useTranslation();
//   const lang = i18n.language || "ar";

//   const location = useLocation();

//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);

//   const [openMenus, setOpenMenus] = useState({
//   payments: location.pathname.startsWith("/admin/payments"),
// });

//   const currentUser = useSelector((state) => state.auth.currentUser);
//   const user = currentUser?.user || currentUser;
//   const isAdmin = user?.role === "admin" || user?.role === "superAdmin";


//   const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
//   /*
// حماية داخلية إضافية داخل صفحة الإدارة في
// [AdminLayout.jsx](C:/Users/User/Desktop/All Projects/myreact/travel/travel-app/frontend/src/Pages/admin/AdminLayout.jsx)
// */
//   // ← مهم: حتى لو حاول شخص غير مصرح له الوصول لصفحات الإدارة عبر الرابط المباشر، سيتم إعادة توجيهه
//   if (!user) return <Navigate to="/authpage" replace />;
//   if (!isAdmin) return <Navigate to="/" replace />;

//   // جعل إدارة الدفع عنصرًا رئيسيًا قابلًا للفتح والإغلاق، وتظهر تحته الصفحات الفرعية:
// const toggleMenu = (menuKey) => {
//   setOpenMenus((previous) => ({
//     ...previous,
//     [menuKey]: !previous[menuKey],
//   }));
// };
// // helper 

// const isPathActive = (
//   currentPath,
//   targetPath,
// ) => {
//   if (targetPath === "/admin/payments") {
//     return currentPath === targetPath;
//   }

//   return (
//     currentPath === targetPath ||
//     currentPath.startsWith(
//       `${targetPath}/`,
//     )
//   );
// };

// const isParentActive =
//   item.children.some((child) =>
//     isPathActive(
//       location.pathname,
//       child.path,
//     ),
//   );

//   // فتح القائمة تلقائيًا عند دخول صفحة فرعية

//   useEffect(() => {
//   if (
//     location.pathname.startsWith(
//       "/admin/payments",
//     ) ||
//     location.pathname.startsWith(
//       "/admin/payment-transactions",
//     )
//   ) {
//     setOpenMenus((previous) => ({
//       ...previous,
//       payments: true,
//     }));
//   }
// }, [location.pathname]);
//   const navItems = [
//     {
//       path: "/admin",
//       label: lang === "ar" ? "لوحة التحكم" : "Dashboard",
//       icon: LayoutDashboard,
//     },


//     {
//       path: "/admin/orders",
//       label: lang === "ar" ? "إدارة الطلبات" : "Orders Management",
//       icon: ShoppingCart,
//     },
//     {
//       path: "/admin/products",
//       label: lang === "ar" ? "إدارة المنتجات" : "Products Management",
//       icon:Archive ,
//     },
//     {
//       path: "/admin/users",
//       label: lang === "ar" ? "إدارة المستخدمين" : "Users Management",
//       icon: Users,
//     },
//     {
//       path: "/admin/hotels",
//       label: lang === "ar" ? "إدارة الفنادق" : "Hotels Management",
//       icon: Hotel,
//     },
//     {
//       path: "/admin/visas",
//       label: lang === "ar" ? "إدارة التأشيرات" : "Visas Management",
//       icon: FileText,
//     },
//     {
//       path: "/admin/transports",
//       label: lang === "ar" ? "إدارة النقل" : "Transports Management",
//       icon: Bus,
//     },
//     {
//       path: "/admin/trips",
//       label: lang === "ar" ? "إدارة الرحلات" : "Trips Management",
//       icon: Plane,
//     },
//     {
//       path: "/admin/umrah-program",
//       label: lang === "ar" ? "إدارة البرامج" : "Program Management",
//       icon: Package,
//     },
//     {
//       path: "/admin/extra-services",
//       label: lang === "ar" ? "الخدمات الإضافية" : "Extra Services",
//       icon: Sparkles,
//     },
    
//     {
//   path: "/admin/vehicle-rentals",
//   label: lang === "ar" ? "تأجير النقل" : "Vehicle Rentals",
//   icon: Bus,
// },
// {
//   path: "/admin/inventory",
//   label: lang === "ar" ? "المخزون" : "Inventory",
//   icon: Boxes,
// }
// // الدفع قائمة رئيسية وضمنها قائمة فرعية
// ,{
//   key : "payments" ,
//   label :
//    lang === "ar"
//       ? "إدارة الدفع"
//       : "Payment Management",
//  icon: CreditCard,
//  children : [
//     {
//       path: "/admin/payments",

//       label:
//         lang === "ar"
//           ? "الرئيسية"
//           : "Overview",

//       icon: LayoutDashboard,
//     },
//     {
//       path: "/admin/payments/methods",

//       label:
//         lang === "ar"
//           ? "طرق الدفع"
//           : "Payment Methods",

//       icon: Settings2,
//     },
// {
//       path: "/admin/payments/bank-accounts",

//       label:
//         lang === "ar"
//           ? "الحسابات البنكية"
//           : "Bank Accounts",

//       icon: Landmark,
//     },
//     {
//       path: "/admin/payments/providers",

//       label:
//         lang === "ar"
//           ? "مزودو الدفع"
//           : "Payment Providers",

//       icon: PlugZap,
//     },
//  {
//       path: "/admin/payments/configurations",

//       label:
//         lang === "ar"
//           ? "ربط طرق الدفع"
//           : "Payment Assignments",

//       icon: Link2,
//     },
//      {
//       path: "/admin/payment-transactions",

//       label:
//         lang === "ar"
//           ? "عمليات الدفع"
//           : "Payment Transactions",

//       icon: ReceiptText,
//     },
//  ]
// }
//   ];

// const flatNavItems =
//   navItems.flatMap((item) =>
//     Array.isArray(item.children)
//       ? [
//           {
//             path: "/admin/payments",
//             label: item.label,
//           },
//           ...item.children,
//         ]
//       : [item],
//   );

//   return (
//     <div className="flex h-screen bg-gray-100 overflow-hidden">
//       {/* Sidebar */}

//       <aside
//         className={`bg-gradient-to-b from-indigo-800 to-indigo-950 text-white transition-all duration-300 ease-in-out z-20
//           ${isSidebarOpen ? "w-72" : "w-20"}`}
//       >
//         {/* Header / Logo */}
//         <div className="h-16 flex items-center justify-between px-4 border-b border-indigo-700/50">
//           {isSidebarOpen ? (
//             <h1 className="text-xl font-bold tracking-wide">لوحة الإدارة</h1>
//           ) : (
//             <div className="text-2xl font-black">A</div>
//           )}
//           <button
//             onClick={() => {
//   if (!isSidebarOpen) {
//     setIsSidebarOpen(true);

//     setOpenMenus((previous) => ({
//       ...previous,
//       [item.key]: true,
//     }));

//     return;
//   }

//   toggleMenu(item.key);
// }}
//             className="p-2 rounded-lg hover:bg-indigo-700/50 transition-colors"
//           >
//             {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
//           </button>
//         </div>

//         {/* Navigation */}
//        <nav className="mt-6 px-3 space-y-1">
//   {navItems.map((item) => {
//     /*
//     =====================================================
//     عنصر يحتوي صفحات فرعية
//     =====================================================
//     */

//     if (Array.isArray(item.children)) {
//       const isParentActive =
//         item.children.some((child) =>
//           location.pathname === child.path ||
//           location.pathname.startsWith(
//             `${child.path}/`,
//           ),
//         );

//       const isOpen =
//         Boolean(openMenus[item.key]);

//       return (
//         <div
//           key={item.key}
//           className="space-y-1"
//         >
//           <button
//             type="button"
//             onClick={() =>
//               toggleMenu(item.key)
//             }
//             className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
//               isParentActive
//                 ? "bg-indigo-700/80 text-white shadow-md"
//                 : "text-indigo-200 hover:bg-indigo-700/40 hover:text-white"
//             }`}
//           >
//             <item.icon
//               size={
//                 isSidebarOpen ? 22 : 24
//               }
//               strokeWidth={
//                 isParentActive ? 2.2 : 1.8
//               }
//             />

//             {isSidebarOpen && (
//               <>
//                 <span className="flex-1 text-start font-medium">
//                   {item.label}
//                 </span>

//                 {isOpen ? (
//                   <ChevronUp size={18} />
//                 ) : (
//                   <ChevronDown size={18} />
//                 )}
//               </>
//             )}
//           </button>

//           {isSidebarOpen && isOpen ? (
//             <div
//               className={`space-y-1 ${
//                 lang === "ar"
//                   ? "mr-5 border-r border-indigo-700/60 pr-3"
//                   : "ml-5 border-l border-indigo-700/60 pl-3"
//               }`}
//             >
//               {item.children.map(
//                 (child) => (
//                   <NavLink
//                     key={child.path}
//                     to={child.path}
//                     end={
//                       child.path ===
//                       "/admin/payments"
//                     }
//                     className={({
//                       isActive,
//                     }) =>
//                       `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
//                         isActive
//                           ? "bg-indigo-600/80 text-white"
//                           : "text-indigo-200 hover:bg-indigo-700/40 hover:text-white"
//                       }`
//                     }
//                   >
//                     <child.icon
//                       size={18}
//                       strokeWidth={1.8}
//                     />

//                     <span className="font-medium">
//                       {child.label}
//                     </span>
//                   </NavLink>
//                 ),
//               )}
//             </div>
//           ) : null}
//         </div>
//       );
//     }

//     /*
//     =====================================================
//     عنصر عادي
//     =====================================================
//     */

//     return (
//       <NavLink
//         key={item.path}
//         to={item.path}
//         end={item.path === "/admin"}
//         className={({ isActive }) =>
//           `flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
//             isActive
//               ? "bg-indigo-700/80 text-white shadow-md"
//               : "text-indigo-200 hover:bg-indigo-700/40 hover:text-white"
//           }`
//         }
//       >
//         {({ isActive }) => (
//           <>
//             <item.icon
//               size={
//                 isSidebarOpen ? 22 : 24
//               }
//               strokeWidth={
//                 isActive ? 2.2 : 1.8
//               }
//             />

//             {isSidebarOpen && (
//               <span className="font-medium">
//                 {item.label}
//               </span>
//             )}
//           </>
//         )}
//       </NavLink>
//     );
//   })}
// </nav>
//         {/* Logout at bottom */}
//         {/* <div className="absolute bottom-6 left-0 right-0 px-3">
//           <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-200 hover:bg-red-600/20 hover:text-red-300 transition-colors">
//             <LogOut size={22} />
//             {isSidebarOpen && (
//               <span className="font-medium">
//                 {lang === "ar" ? "تسجيل الخروج" : "Logout"}
//               </span>
//             )}
//           </button>
//         </div> */}
//       </aside>
//       {/* Main Content */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* Top bar (optional) */}
//         <header className="bg-white shadow-sm h-16 flex items-center px-6 justify-between">
//           <div className="d-flex gap-3 align-items-center">
//             {/* goBack */}
//             <ActionButton
//               size="md"
//               action="back"
//               label={lang === "ar" ? "عودة" : "Back"}
//             />
//             <div>
//               {/* Breadcrumb + Title */}
//               <div className="mb-2">
//                 <nav className="flex items-center gap-2 text-sm text-gray-500">
// {generateBreadcrumb(
//   location.pathname,
//   flatNavItems,
//   lang,
// )}                </nav>
//               </div>

//               {/* العنوان الرئيسي */}
// <h2 className="text-xl font-semibold text-gray-800">
//   {currentNavItem?.label ||
//     (lang === "ar"
//       ? "لوحة التحكم"
//       : "Dashboard")}
// </h2>
//             </div>
//           </div>

//           {/* Notifications, user avatar, etc */}
//           <div className="flex items-center gap-4">
//             {/* <NotificationsDropdown /> */}
//             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
//               E
//             </div>
//           </div>
//         </header>

//         {/* Page Content */}
//         <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
//           <Outlet /> {/* هنا يظهر المحتوى الفرعي */}
//         </main>
//       </div>
//     </div>
//   );
// }
