// src/components/layout/AdminLayout.jsx
import React, { useState } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Hotel,
  Plane,
  Bus,
  FileText,
  Menu,
  X,
  LogOut,
  Sparkles,
  Boxes,
  Archive
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import ActionButton from "../../Components/common/buttons/ActionButton";
import { Button } from "react-bootstrap";
import generateBreadcrumb from "../../Utils/generateBreadcrumb";

export default function Adminlayout() {
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const currentUser = useSelector((state) => state.auth.currentUser);
  const user = currentUser?.user || currentUser;
  const isAdmin = user?.role === "admin" || user?.role === "superAdmin";

  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  /*
حماية داخلية إضافية داخل صفحة الإدارة في
[AdminLayout.jsx](C:/Users/User/Desktop/All Projects/myreact/travel/travel-app/frontend/src/Pages/admin/AdminLayout.jsx)
*/
  // ← مهم: حتى لو حاول شخص غير مصرح له الوصول لصفحات الإدارة عبر الرابط المباشر، سيتم إعادة توجيهه
  if (!user) return <Navigate to="/authpage" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const navItems = [
    {
      path: "/admin",
      label: lang === "ar" ? "لوحة التحكم" : "Dashboard",
      icon: LayoutDashboard,
    },
    {
      path: "/admin/orders",
      label: lang === "ar" ? "إدارة الطلبات" : "Orders Management",
      icon: ShoppingCart,
    },
    {
      path: "/admin/products",
      label: lang === "ar" ? "إدارة المنتجات" : "Products Management",
      icon:Archive ,
    },
    {
      path: "/admin/users",
      label: lang === "ar" ? "إدارة المستخدمين" : "Users Management",
      icon: Users,
    },
    {
      path: "/admin/hotels",
      label: lang === "ar" ? "إدارة الفنادق" : "Hotels Management",
      icon: Hotel,
    },
    {
      path: "/admin/visas",
      label: lang === "ar" ? "إدارة التأشيرات" : "Visas Management",
      icon: FileText,
    },
    {
      path: "/admin/transports",
      label: lang === "ar" ? "إدارة النقل" : "Transports Management",
      icon: Bus,
    },
    {
      path: "/admin/trips",
      label: lang === "ar" ? "إدارة الرحلات" : "Trips Management",
      icon: Plane,
    },
    {
      path: "/admin/umrah-program",
      label: lang === "ar" ? "إدارة البرامج" : "Program Management",
      icon: Package,
    },
    {
      path: "/admin/extra-services",
      label: lang === "ar" ? "الخدمات الإضافية" : "Extra Services",
      icon: Sparkles,
    },
    
    {
  path: "/admin/vehicle-rentals",
  label: lang === "ar" ? "تأجير النقل" : "Vehicle Rentals",
  icon: Bus,
},
{
  path: "/admin/inventory",
  label: lang === "ar" ? "المخزون" : "Inventory",
  icon: Boxes,
}
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}

      <aside
        className={`bg-gradient-to-b from-indigo-800 to-indigo-950 text-white transition-all duration-300 ease-in-out z-20
          ${isSidebarOpen ? "w-72" : "w-20"}`}
      >
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-indigo-700/50">
          {isSidebarOpen ? (
            <h1 className="text-xl font-bold tracking-wide">لوحة الإدارة</h1>
          ) : (
            <div className="text-2xl font-black">A</div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-indigo-700/50 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? "bg-indigo-700/80 text-white shadow-md"
                      : "text-indigo-200 hover:bg-indigo-700/40 hover:text-white"
                  }`
                }
              >
                <item.icon
                  size={isSidebarOpen ? 22 : 24}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {isSidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
        {/* Logout at bottom */}
        {/* <div className="absolute bottom-6 left-0 right-0 px-3">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-200 hover:bg-red-600/20 hover:text-red-300 transition-colors">
            <LogOut size={22} />
            {isSidebarOpen && (
              <span className="font-medium">
                {lang === "ar" ? "تسجيل الخروج" : "Logout"}
              </span>
            )}
          </button>
        </div> */}
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (optional) */}
        <header className="bg-white shadow-sm h-16 flex items-center px-6 justify-between">
          <div className="d-flex gap-3 align-items-center">
            {/* goBack */}
            <ActionButton
              size="md"
              action="back"
              label={lang === "ar" ? "عودة" : "Back"}
            />
            <div>
              {/* Breadcrumb + Title */}
              <div className="mb-2">
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                  {generateBreadcrumb(location.pathname, navItems, lang)}
                </nav>
              </div>

              {/* العنوان الرئيسي */}
              <h2 className="text-xl font-semibold text-gray-800">
                {navItems.find((item) => item.path === location.pathname)
                  ?.label || (lang === "ar" ? "لوحة التحكم" : "Dashboard")}
              </h2>
            </div>
          </div>

          {/* Notifications, user avatar, etc */}
          <div className="flex items-center gap-4">
            {/* <NotificationsDropdown /> */}
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              E
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet /> {/* هنا يظهر المحتوى الفرعي */}
        </main>
      </div>
    </div>
  );
}
