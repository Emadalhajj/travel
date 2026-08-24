// src/Pages/admin/AdminLayout.jsx

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Activity,
  BarChart3,
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
  Sparkles,
  Users,
  X,
} from "lucide-react";

import {
  useTranslation,
} from "react-i18next";

import ActionButton from "../../Components/common/buttons/ActionButton";
import { USER_ROLES } from "../../constants/auth/roles";
import useAuthorization from "../../hooks/auth/useAuthorization";

import generateBreadcrumb from "../../Utils/generateBreadcrumb";

const ADMIN_NAV_ROLES = Object.freeze([
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
]);

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

  const { user, role } = useAuthorization();

  /*
  =====================================================
  Sidebar State
  =====================================================
  */

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(() =>
    typeof window === "undefined" ||
    window.matchMedia("(min-width: 1024px)").matches,
  );

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
      () => {
        if (!ADMIN_NAV_ROLES.includes(role)) return [];

        return [
        {
          path: "/admin",

          label: isArabic
            ? "لوحة التحكم"
            : "Dashboard",

          icon: LayoutDashboard,
        },
        {
          path: "/admin/operations",
          label: isArabic ? "مركز العمليات" : "Operations Center",
          icon: Activity,
        },
        {
          path: "/admin/reports",
          label: isArabic ? "التقارير" : "Reports",
          icon: BarChart3,
        },
        {
          path: "/admin/settings/document-branding",
          label: isArabic ? "هوية ملفات PDF" : "PDF Branding",
          icon: Settings2,
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
        ];
      },
      [isArabic, role],
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
