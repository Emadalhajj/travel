import React, { lazy, Suspense } from "react";
import "./App.css";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Loader from "../Components/common/Loader";
import Header from "../Components/layout/Header";
import DashboardOverview from "../Pages/admin/DashboardOverview";
import AdminLayout from "../Pages/admin/AdminLayout";
import PublicProgramListPage from "../Pages/public/programs/PublicProgramListPage";
import PublicProgramDetailsPage from "../Pages/public/programs/PublicProgramDetailsPage";
import PublicBookingPage from "../Pages/public/booking/PublicBookingPage";
import PublicBookingSuccessPage from "../Pages/public/booking/PublicBookingSuccessPage";
import PublicBookingDetailsPage from "../Pages/public/booking/PublicBookingDetailsPage";
import PublicMyDraftBookingsPage from "../Pages/public/booking/PublicMyDraftBookingsPage";
import ProtectedRoute from "../Components/auth/ProtectedRoute";
import { ADMIN_ROLES } from "../constants/auth/roles";

const Home = lazy(() => import("../Pages/client/Home"));
const AuthPage = lazy(() => import("../Pages/Auth/AuthPage"));
const PasswordRecoveryPage = lazy(
  () => import("../Pages/Auth/PasswordRecoveryPage"),
);
const MyBookings = lazy(() => import("../Pages/client/MyBookings"));
const Profile = lazy(() => import("../Pages/client/Profile"));
const AdminUsersPage = lazy(
  () => import("../Pages/admin/Users/AdminUsersPage"),
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
const AdminUmrahProgramList = lazy(
  () => import("../Pages/admin/umrah/AdminUmrahProgramList"),
);
const CreateUmrahPackagePage = lazy(
  () => import("../Pages/admin/umrah/packages/CreateUmrahPackagePage"),
);
const PublicCustomPackageBuilderPage = lazy(
  () => import("../Pages/public/custom-package/PublicCustomPackageBuilderPage"),
);
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
const PublicDraftBookingDetailsPage = lazy(
  () => import("../Pages/public/booking/PublicDraftBookingDetailsPage"),
);
const PublicBookingPaymentPage = lazy(
  () => import("../Pages/public/booking/PublicBookingPaymentPage"),
);

const PublicBankTransferProofPage = lazy(
  () => import("../Pages/public/payment/PublicBankTransferProofPage"),
);

const PublicPaymentRedirectPage = lazy(
  () => import("../Pages/public/booking/PublicPaymentRedirectPage"),
);

const PublicCustomBookingCustomerPage = lazy(
  () =>
    import("../Pages/public/custom-package/PublicCustomBookingCustomerPage"),
);
const PublicBookingPartyPage = lazy(
  () => import("../Pages/public/booking/PublicBookingPartyPage"),
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
const AdminPaymentTransactionsPage = lazy(
  () => import("../Pages/admin/payments/AdminPaymentTransactionsPage"),
);
const AdminPaymentTransactionDetailsPage = lazy(
  () => import("../Pages/admin/payments/AdminPaymentTransactionDetailsPage"),
);
const AdminOperationsPage = lazy(
  () => import("../Pages/admin/operations/AdminOperationsPage"),
);
const AdminBookingOperationsDetailsPage = lazy(
  () => import("../Pages/admin/operations/AdminBookingOperationsDetailsPage"),
);
const AdminReportsPage = lazy(
  () => import("../Pages/admin/reports/AdminReportsPage"),
);
const AdminDocumentBrandingPage = lazy(
  () => import("../Pages/admin/settings/AdminDocumentBrandingPage"),
);
const PublicPaymentResultPage = lazy(
  () => import("../Pages/public/payment/PublicPaymentResultPage"),
);



function LegacyBookingWizardRedirect(): JSX.Element {
  const { programId } = useParams();
  return (
    <Navigate
      to={programId ? `/booking/program/${programId}` : "/programs"}
      replace
    />
  );
}

function LegacyAdminHotelRoomsRedirect(): JSX.Element {
  const { hotelId } = useParams();
  return (
    <Navigate
      to={hotelId ? `/admin/hotel/${hotelId}/rooms` : "/admin/hotels"}
      replace
    />
  );
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
        <Route path="/forgotPassword" element={<PasswordRecoveryPage />} />
        <Route path="/forgot-password" element={<PasswordRecoveryPage />} />
        <Route path="/reset-password/:token" element={<PasswordRecoveryPage />} />
        <Route
          path="/myBookings"
          element={<Navigate to="/my-bookings" replace />}
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/programs" element={<PublicProgramListPage />} />
        <Route path="/programs/:id" element={<PublicProgramDetailsPage />} />
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
        <Route path="/booking-wizard" element={<LegacyBookingWizardRedirect />} />
        <Route
          path="/booking-wizard/program/:programId"
          element={<LegacyBookingWizardRedirect />}
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
          path="/booking/payment/:draftId/bank-transfer/:transactionId"
          element={<PublicBankTransferProofPage />}
        />
        <Route
          path="/booking/payment/redirect/:draftId"
          element={<PublicPaymentRedirectPage />}
        />
        <Route
          path="/booking/payment/:draftId/result"
          element={<PublicPaymentResultPage />}
        />

        <Route
          path="/booking/custom/:draftId/customer"
          element={<PublicCustomBookingCustomerPage />}
        />

        <Route
          path="/booking/draft/:draftId/details"
          element={<PublicBookingPartyPage />}
        />

        <Route
          path="/booking/custom/:draftId/travelers"
          element={<PublicCustomBookingTravelersPage />}
        />

        {/* Admin Routes توحيد المسارات تحت /admin/... */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverview />} /> {/* /admin */}
          <Route path="dashboard" element={<DashboardOverview />} />{" "}
          {/* /admin/dashboard */}
          <Route path="products" element={<Navigate to="/admin" replace />} />{" "}
          <Route path="users" element={<AdminUsersPage />} />{" "}
          {/*  admin/users */}
          <Route path="hotels" element={<AdminHotelList />} />{" "}
          {/* /admin/hotels */}
          <Route path="visas" element={<AdminVisaList />} />{" "}
          {/* /admin/visas */}
          <Route path="visa-types" element={<AdminVisaTypeList />} />{" "}
          {/* /admin/visa-types */}
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
          <Route
            path="payments/payment-transactions"
            element={<AdminPaymentTransactionsPage />}
          />
          <Route
            path="payments/payment-transactions/:transactionId"
            element={<AdminPaymentTransactionDetailsPage />}
          />
          <Route path="operations" element={<AdminOperationsPage />} />
          <Route
            path="operations/bookings/:bookingId"
            element={<AdminBookingOperationsDetailsPage />}
          />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="settings/document-branding" element={<AdminDocumentBrandingPage />} />


 
        </Route>

        <Route
          path="/adminDashboard"
          element={<Navigate to="/admin" replace />}
        />
        <Route
          path="/allProducts"
          element={<Navigate to="/admin" replace />}
        />

        <Route
          path="/adminVisaTypeList"
          element={<Navigate to="/admin/visa-types" replace />}
        />
        <Route
          path="/adminHotelList"
          element={<Navigate to="/admin/hotels" replace />}
        />
        <Route
          path="/adminHotelRooms/:hotelId/rooms"
          element={<LegacyAdminHotelRoomsRedirect />}
        />
        <Route
          path="/adminTransportList"
          element={<Navigate to="/admin/transports" replace />}
        />
        <Route
          path="/transportTrips/"
          element={<Navigate to="/admin/trips" replace />}
        />
      </Routes>
    </Suspense>
  );
}

export default App;
