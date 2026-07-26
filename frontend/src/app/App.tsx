import React, { lazy, Suspense } from "react";
import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";

// import { Elements } from "@stripe/react-stripe-js";
import Loader from "../Components/common/Loader";
import Header from "../Components/layout/Header";
// import Adminlayout from "../Pages/admin/AdminLayout";
import DashboardOverview from "../Pages/admin/DashboardOverview";
import AdminLayout from "../Pages/admin/AdminLayout";
import PublicProgramListPage from "../Pages/public/programs/PublicProgramListPage";
import PublicProgramDetailsPage from "../Pages/public/programs/PublicProgramDetailsPage";
import PublicBookingPage from "../Pages/public/booking/PublicBookingPage";
import PublicBookingSuccessPage from "../Pages/public/booking/PublicBookingSuccessPage";
import PublicBookingDetailsPage from "../Pages/public/booking/PublicBookingDetailsPage";
import PublicMyDraftBookingsPage from "../Pages/public/booking/PublicMyDraftBookingsPage";
// import AdminPaymentMethodsPage from "./Pages/admin/payments/AdminPaymentMethodsPage";

const Home = lazy(() => import("../Pages/client/Home"));
const AuthPage = lazy(() => import("../Pages/Auth/AuthPage"));
const MyBookings = lazy(() => import("../Pages/client/MyBookings"));
const Profile = lazy(() => import("../Pages/client/Profile"));
const AdminDashboard = lazy(() => import("../Pages/admin/AdminDashboad"));
const AllProducts = lazy(() => import("../Pages/admin/AllProducts"));
// const AdminVisaForm = lazy(() => import("../Pages/admin/AdminVisaForm"));
const AdminUsersPage = lazy(
  () => import("../Pages/admin/Users/ManagemintUsers"),
);
const AdminVisaTypeList = lazy(
  () => import("../Pages/admin/visas/AdminVisaTypeList"),
);
const AdminRoomTypeList = lazy(
  () => import("../Pages/admin/hotels/AdminRoomTypeList"),
);

const AdminVisaList = lazy(() => import("../Pages/admin/visas/AdminVisaList"));
const AdminHotelList = lazy(
  () => import("../Pages/admin/hotels/AdminHotelList"),
);
const AdminHotelRooms = lazy(
  () => import("../Pages/admin/hotels/AdminHotelRooms"),
);

const AdminExtraServiceList = lazy(
  () => import("../Pages/admin/extraServices/AdminExtraServiceList"),
);
// البرامج
const AdminUmrahProgramList = lazy(
  () => import("../Pages/admin/umrah/AdminUmrahProgramList"),
);
// إنشاء وتعديل البرامج
const CreateUmrahPackagePage = lazy(
  () => import("../Pages/admin/umrah/packages/CreateUmrahPackagePage"),
);
//
const PublicCustomPackageBuilderPage = lazy(
  () => import("../Pages/public/custom-package/PublicCustomPackageBuilderPage"),
);
//المخزون
const AdminInventoryList = lazy(
  () => import("../Pages/admin/inventory/AdminInventoryList"),
);

const AdminTransportList = lazy(
  () => import("../Pages/admin/transport/AdminTransportList"),
);

const TransportTrips = lazy(
  () => import("../Pages/admin/transport/TransportTrips"),
);

const AdminVehicleRentalList = lazy(
  () => import("../Pages/admin/transport/AdminVehicleRentalList"),
);
const PublicBookingWizardPage = lazy(
  () => import("../Pages/booking/PublicBookingWizardPage"),
);
const PublicDraftBookingDetailsPage = lazy(
  () => import("../Pages/public/booking/PublicDraftBookingDetailsPage"),
);
const PublicBookingPaymentPage = lazy(
  () => import("../Pages/public/booking/PublicBookingPaymentPage"),
);

const PublicPaymentRedirectPage = lazy(
  () => import("../Pages/public/booking/PublicPaymentRedirectPage"),
);

const PublicCustomBookingCustomerPage = lazy(
  () =>
    import("../Pages/public/custom-package/PublicCustomBookingCustomerPage"),
);

const PublicCustomBookingTravelersPage = lazy(
  () =>
    import("../Pages/public/custom-package/PublicCustomBookingTravelersPage"),
);
// طرق الدفع
const AdminBankAccountsPage = lazy(
  () => import("../Pages/admin/payments/AdminBankAccountsPage"),
);
const AdminPaymentManagementPage = lazy(
  () => import("../Pages/admin/payments/AdminPaymentManagementPage"),
)

const AdminPaymentMethodsPage = lazy(
  () => import("../Pages/admin/payments/AdminPaymentMethodsPage"),
)

const AdminPaymentProvidersPage = lazy(
  () => import("../Pages/admin/payments/AdminPaymentProvidersPage"),
)

const AdminPaymentConfigurationsPage = lazy(
  () => import("../Pages/admin/payments/AdminPaymentConfigurationsPage"),
)



// const AdminBankAccountFormPage = lazy(
//   () => import("../Pages/admin/payments/AdminBankAccountFormPage"),
// );
/*
إضافة حارس صلاحيات للمسارات (AdminOnlyRoute) في
[App.tsx](C:/Users/User/Desktop/All Projects/myreact/travel/travel-app/frontend/src/app/App.tsx)
يحول غير المسجل إلى /authpage
يحول غير admin إلى /
تم تطبيقه على:
المسار الأب /admin
المسارات القديمة مثل /adminDashboard, /adminVisaList ... إلخ

لو المستخدم ليس admin يتم إعادة توجيهه مباشرة خارج لوحة الإدارة

*/
function AdminOnlyRoute({ children }: { children: JSX.Element }): JSX.Element {
  const currentUser = useSelector((state: any) => state.auth.currentUser);
  const user = currentUser?.user || currentUser;

  if (!user) return <Navigate to="/authpage" replace />;
  if (user.role !== "admin" && user.role !== "superAdmin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/authpage" element={<AuthPage />} />
        <Route
          path="/myBookings"
          element={<Navigate to="/my-bookings" replace />}
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/programs" element={<PublicProgramListPage />} />
        <Route path="/programs/:id" element={<PublicProgramDetailsPage />} />
        {/* <Route path="/booking" element={<PublicBookingPage />} /> */}
        <Route
          path="/booking/program/:programId"
          element={<PublicBookingPage />}
        />
        <Route
          path="/booking/success/:bookingId"
          element={<PublicBookingSuccessPage />}
        />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route
          path="/booking/:bookingId"
          element={<PublicBookingDetailsPage />}
        />
        <Route
          path="/my-draft-bookings"
          element={<PublicMyDraftBookingsPage />}
        />
        <Route
          path="/custom-package-builder"
          element={<PublicCustomPackageBuilderPage />}
        />
        <Route
          path="/custom-package"
          element={<PublicCustomPackageBuilderPage />}
        />
        <Route path="/booking-wizard" element={<PublicBookingWizardPage />} />
        <Route
          path="/booking-wizard/program/:programId"
          element={<PublicBookingWizardPage />}
        />
        <Route
          path="/draft-booking/:draftId"
          element={<PublicDraftBookingDetailsPage />}
        />
        <Route
          path="/booking/payment/:draftId"
          element={<PublicBookingPaymentPage />}
        />
        <Route
          path="/booking/payment/redirect/:draftId"
          element={<PublicPaymentRedirectPage />}
        />

        <Route
          path="/booking/custom/:draftId/customer"
          element={<PublicCustomBookingCustomerPage />}
        />

        <Route
          path="/booking/custom/:draftId/travelers"
          element={<PublicCustomBookingTravelersPage />}
        />

        {/* Admin Routes توحيد المسارات تحت /admin/... */}
        <Route
          path="/admin"
          element={
            <AdminOnlyRoute>
              <AdminLayout />
            </AdminOnlyRoute>
          }
        >
          <Route index element={<DashboardOverview />} /> {/* /admin */}
          <Route path="dashboard" element={<DashboardOverview />} />{" "}
          {/* /admin/dashboard */}
          <Route path="products" element={<AllProducts />} />{" "}
          {/* /admin/products */}
          {/* <Route path="orders" element={<OrdersManagement />} />            {/* /admin/orders */}
          <Route path="users" element={<AdminUsersPage />} />{" "}
          {/*  admin/users */}
          <Route path="hotels" element={<AdminHotelList />} />{" "}
          {/* /admin/hotels */}
          <Route path="visas" element={<AdminVisaList />} />{" "}
          {/* /admin/visas */}
          <Route path="visa-types" element={<AdminVisaTypeList />} />{" "}
          {/* /admin/visa-types */}
          {/* <Route path="visa-form" element={<AdminVisaForm />} />{" "} */}
          {/* /admin/visa-form */}
          <Route path="room-types" element={<AdminRoomTypeList />} />{" "}
          {/* Umrah Pages */}
          <Route
            path="umrah-program"
            element={<AdminUmrahProgramList />}
          />{" "}
          <Route path="inventory" element={<AdminInventoryList />} />{" "}
          <Route
            path="umrah-program/create"
            element={<CreateUmrahPackagePage />}
          />
          <Route
            path="umrah-program/edit/:id"
            element={<CreateUmrahPackagePage />}
          />
          <Route
            path="umrah-program/clone/:id"
            element={<CreateUmrahPackagePage />}
          />
          {/* /admin/room-types */}
          <Route
            path="hotel/:hotelId/rooms"
            element={<AdminHotelRooms />}
          />{" "}
          {/* extra serviecs */}
          <Route
            path="extra-services"
            element={<AdminExtraServiceList />}
          />{" "}
          {/* /admin/hotel/123/rooms */}
          <Route path="transports" element={<AdminTransportList />} />{" "}
          {/* /admin/transports */}
          <Route path="trips" element={<TransportTrips />} />{" "}
          {/* /admin/trips */}
          <Route
            path="vehicle-rentals"
            element={<AdminVehicleRentalList />}
          />{" "}
          {/* ادارة الدفع */}
          {/* /admin/vehicle-rentals */}
          <Route
            path="payments/bank-accounts"
            element={<AdminBankAccountsPage />}
          />
          <Route
            path="payments"
            element={<AdminPaymentManagementPage />}
          />
          <Route
            path="payments/methods"
            element={<AdminPaymentMethodsPage />}
          />
          <Route
            path="payments/providers"
            element={<AdminPaymentProvidersPage />}
          />
          <Route
            path="payments/configurations"
            element={<AdminPaymentConfigurationsPage />}
          />


 
        </Route>

        {/* <Route path="/" element={<Home />} /> */}
        {/* <Route path="/authpage" element={<AuthPage />} /> */}
        {/* <Route path="/myBookings" element={<MyBookings />} /> */}
        <Route
          path="/adminDashboard"
          element={
            <AdminOnlyRoute>
              <AdminDashboard />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/allProducts"
          element={
            <AdminOnlyRoute>
              <AllProducts />
            </AdminOnlyRoute>
          }
        />

        {/* <Route path="/adminVisaForm" element={<AdminOnlyRoute><AdminVisaForm /></AdminOnlyRoute>} /> */}
        <Route
          path="/adminVisaTypeList"
          element={
            <AdminOnlyRoute>
              <AdminVisaTypeList />
            </AdminOnlyRoute>
          }
        />
        {/* <Route path="/adminRoomTypeList" element={<AdminOnlyRoute><AdminRoomTypeList /></AdminOnlyRoute>} /> */}
        {/* <Route path="/adminVisaList" element={<AdminOnlyRoute><AdminVisaList /></AdminOnlyRoute>} /> */}
        <Route
          path="/adminHotelList"
          element={
            <AdminOnlyRoute>
              <AdminHotelList />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/adminHotelRooms/:hotelId/rooms"
          element={
            <AdminOnlyRoute>
              <AdminHotelRooms />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/adminTransportList"
          element={
            <AdminOnlyRoute>
              <AdminTransportList />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/transportTrips/"
          element={
            <AdminOnlyRoute>
              <TransportTrips />
            </AdminOnlyRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
