import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./DB/mongoose.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import authRouter from "./routes/auth-routes.js";
import visaRouter from "./routes/visa-routes.js";
import visaTypeRouter from "./routes/visaType-routes.js";
import RoomTypeRoute from "./routes/hotel/roomtype-route.js";
import HotelsRoute from "./routes/hotel/hotel-route.js";
import TransportRoutes from "./routes/transport-routes.js";
import tripRoutes from "./routes/trip-routers.js";
import userRoutes from "./routes/users-routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import BookingRoute from "./routes/booking/booking-route.js";
import InventoryRoute from "./routes/inventory/inventory-route.js";
import PaymentTransactionRoute from "./routes/payment/paymentTransaction-route.js";
import BookingLogRoute from "./routes/booking/booking-log-route.js";
import NotificationRoute from "./routes/notifications/notification-route.js";
import voucherRoute from "./routes/voucher-route.js";
import DraftBookingRoute from "./routes/draft-bookings/draft-booking-route.js";
import SoftDeleteRoute from "./routes/soft-delete-route.js";
import AuditLogRoute from "./routes/audit/audit-log-route.js";
import SecurityEventRoute from "./routes/audit/security-event-route.js";
import BookingOperationsRoute from "./routes/operations/booking-operations-route.js";
import ReportRoute from "./routes/reports/report-route.js";
import DocumentBrandingRoute from "./routes/document-branding-route.js";
import UmrahProgramRoute from "./routes/umrah-programs/umrah-program-route.js";
import AvailabilityRoute from "./routes/availability/availability-route.js";
import ExtraService from "./routes/extra-services/extra-service-route.js";
import VehicleRentalRoute from "./routes/transports/vehicle-rental-route.js";
import paymentCheckoutRoutes from "./routes/payment/payment-checkout-routes.js";
import paymentCallbackRoutes from "./routes/payment/payment-callback-routes.js";
import bankAccountRoutes from "./routes/payment/bank-account-routes.js";
import paymentMethodRoutes from "./routes/payment/payment-method-routes.js";
import paymentProviderRoutes from "./routes/payment/payment-provider-routes.js";
import paymentConfigurationRoutes from "./routes/payment/payment-configuration-routes.js";
import publicPaymentConfigurationRoutes from "./routes/payment/public-payment-configuration-routes.js";
import publicPaymentRoutes from "./routes/payment/public-payment-routes.js";
import AdminLookupRoute from "./routes/lookups/admin-lookup-route.js";
import PrivateFileRoute from "./routes/private-file-routes.js";
import {
  getAllowedOrigins,
  getTrustProxy,
  validateStartupEnvironment,
} from "./config/environment.js";
import { paymentCallbackRateLimiter } from "./middleware/security/rate-limiters.js";
import {
  handleStripeWebhook,
} from "./controllers/payment/stripe-webhook-controller.js";

//use packages
dotenv.config();
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", getTrustProxy());
const port = process.env.PORT || 3000;
const shutdownTimeoutMs = Math.max(
  1000,
  Number(process.env.SHUTDOWN_TIMEOUT_MS) || 10000,
);
let httpServer = null;
let shutdownPromise = null;
// use middleware

// 1️⃣ CORS أول شيء
const allowedOrigins = getAllowedOrigins();
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
}));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
}));

/*
Stripe يحتاج Raw Body للتحقق من Stripe-Signature.
يجب تسجيل هذا المسار قبل express.json().
*/
app.post(
  "/api/payment/webhooks/stripe",
  paymentCallbackRateLimiter,
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

// قراءة البيانات المتداخلة
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 2️⃣ JSON Parser
app.use(express.json({ limit: "1mb" }));
// 3️⃣ Logger + Cookie Parser
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cookieParser()); // لتحليل الكوكيز في الريكوست
// Private booking/payment documents must never fall through to static serving.
app.use("/uploads/draft-bookings", (_req, res) => res.sendStatus(404));
app.use("/uploads/payment-proofs", (_req, res) => res.sendStatus(404));
// 4️⃣ Public Static Files
app.use("/uploads", express.static("uploads"));
// Stateless Passport initialization for Google OAuth.
app.use(passport.initialize());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/ready", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    database: ready ? "connected" : "disconnected",
  });
});

// 7️⃣ Routers
app.use("/api/", authRouter); // ربط راوتر الاوثنتيكيشن

// app.use("/api/visa" , visaRouter)
app.use("/api/visa", visaRouter); // صحيح

app.use("/api/", visaTypeRouter);

app.use("/api/", RoomTypeRoute);

app.use("/api/", HotelsRoute);

app.use("/api/transport", TransportRoutes);

app.use("/api/trip", tripRoutes);

app.use("/api/users", userRoutes);

app.use("/api/extra-services", ExtraService);
app.use("/api", VehicleRentalRoute);

app.use("/api", BookingRoute);

app.use("/api", InventoryRoute);

app.use("/api", PaymentTransactionRoute);

app.use("/api", BookingLogRoute);

app.use("/api", NotificationRoute);

app.use("/api/vouchers", voucherRoute);

app.use("/api", DraftBookingRoute);

app.use("/api", SoftDeleteRoute);

app.use("/api", AuditLogRoute);

app.use("/api", SecurityEventRoute);

app.use("/api", BookingOperationsRoute);

app.use("/api", ReportRoute);
app.use("/api", DocumentBrandingRoute);

app.use("/api", UmrahProgramRoute);

app.use("/api", AvailabilityRoute);

app.use("/api/payment", paymentCheckoutRoutes);

app.use("/api/payment", paymentCallbackRoutes);

app.use("/api/bank-accounts", bankAccountRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/admin/payment-providers", paymentProviderRoutes);
app.use("/api/payments/configurations", paymentConfigurationRoutes);
app.use("/api/public/payments", publicPaymentConfigurationRoutes);
app.use("/api/public/payments", publicPaymentRoutes);
app.use("/api", AdminLookupRoute);
app.use("/api", PrivateFileRoute);

app.use(errorHandler);

const closeHttpServer = async (server) => {
  if (!server?.listening) return;

  await new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const timeout = setTimeout(() => {
      server.closeAllConnections?.();
      finish();
    }, shutdownTimeoutMs);
    timeout.unref?.();

    server.close(() => {
      clearTimeout(timeout);
      finish();
    });
    server.closeIdleConnections?.();
  });
};

export const shutdown = ({ reason = "shutdown", exitCode = 0 } = {}) => {
  if (shutdownPromise) return shutdownPromise;

  shutdownPromise = (async () => {
    console.log(`Shutting down: ${reason}`);
    await closeHttpServer(httpServer);
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    process.exitCode = exitCode;
  })().catch((error) => {
    console.error("Shutdown failed:", error?.message || error);
    process.exitCode = 1;
  });

  return shutdownPromise;
};

export const startServer = async ({
  connect = connectDB,
  listen = () => app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  }),
} = {}) => {
  validateStartupEnvironment();
  await connect();
  httpServer = listen();
  return httpServer;
};

export const installProcessHandlers = () => {
  process.once("SIGTERM", () => void shutdown({ reason: "SIGTERM" }));
  process.once("SIGINT", () => void shutdown({ reason: "SIGINT" }));
  process.once("unhandledRejection", (error) => {
    console.error("Unhandled rejection:", error?.message || error);
    void shutdown({ reason: "unhandledRejection", exitCode: 1 });
  });
  process.once("uncaughtException", (error) => {
    console.error("Uncaught exception:", error?.message || error);
    void shutdown({ reason: "uncaughtException", exitCode: 1 });
  });
};

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  installProcessHandlers();
  startServer().catch((error) => {
    console.error("Server startup failed:", error?.message || error);
    void shutdown({ reason: "startupFailure", exitCode: 1 });
  });
}

export { app };
