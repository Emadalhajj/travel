import express from 'express';
import dotenv from "dotenv";
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { connectDB } from './DB/mongoose.js';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from "./config/passport.js";
import authRouter from './routes/auth-routes.js';
import session from "express-session";
// import bookingRouter from "./routes/booking-routes.js"
import visaRouter from './routes/visa-routes.js';
import visaTypeRouter  from './routes/visaType-routes.js'
import RoomTypeRout from './routes/hotel/roomtype-route.js';
import HotelsRoute from './routes/hotel/hotel-route.js';
import TransportRoutes from './routes/transport-routes.js';
import tripRoutes from './routes/trip-routers.js';
import userRoutes from './routes/users-routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import BookingRoute from './routes/booking/booking-route.js';
import InventoryRoute from './routes/inventory/inventory-route.js';
import PaymentTransactionRoute from './routes/payment/paymentTransaction-route.js';
import BookingLogRoute from './routes/booking/booking-log-route.js';
import NotificationRoute from './routes/notifications/notification-route.js';
import voucherRoute from './routes/voucher-route.js';
import DraftBookingRoute from './routes/draft-bookings/draft-booking-route.js';
import SoftDeleteRoute from './routes/soft-delete-route.js';
import AuditLogRoute from './routes/audit/audit-log-route.js';
import SecurityEventRoute from './routes/audit/security-event-route.js';
import UmrahProgramRoute from './routes/umrah-programs/umrah-program-route.js';
import AvailabilityRoute from './routes/availability/availability-route.js';
import ExtraService from './routes/extra-services/extra-service-route.js';
import VehicleRentalRoute from './routes/transports/vehicle-rental-route.js';
import paymentCheckoutRoutes from './routes/payment/payment-checkout-routes.js';
import paymentCallbackRoutes from "./routes/payment/payment-callback-routes.js";
import bankAccountRoutes from "./routes/payment/bank-account-routes.js";
import paymentMethodRoutes from "./routes/payment/payment-method-routes.js"


//use packages
dotenv.config();
const app = express();
const port = process.env.PORT || 3000
// use middleware


// 1️⃣ CORS أول شيء
app.use(cors()); // للسماح بالوصول من دومينات مختلفة
// قراءة البيانات المتداخلة
app.use(express.urlencoded({ extended: true })); // ✅ هذا هو المهم

// 2️⃣ JSON Parser
app.use(express.json({ limit: "10mb" })); // لتحليل جسم الريكوست بصيغة JSON
// 3️⃣ Logger + Cookie Parser
app.use(morgan('dev')); //يوضح تفاصيل الريكوست في الكونسول
app.use(cookieParser()); // لتحليل الكوكيز في الريكوست 
// 4️⃣ Static Files
app.use("/uploads", express.static("uploads"));
// 5️⃣ Session (قبل passport)
// ✅ تفعيل الـ session لتخزين بيانات المستخدم مؤقتًا
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecretkey", // ضع قيمة في .env
    resave: false,
    saveUninitialized: false,
  })
);
// 6️⃣ Passport
// ✅ تهيئة passport
app.use(passport.initialize());
app.use(passport.session()); // <-- يتم تفعيل الجلسة بعد التهيئة

// 7️⃣ Routers
app.use('/api/' , authRouter) // ربط راوتر الاوثنتيكيشن

// app.use("/api/", bookingRouter);
// app.use("/api/visa" , visaRouter)
app.use("/api/visa", visaRouter);  // صحيح

// app.use(express.json({ limit: "10mb" }));

app.use("/api/" , visaTypeRouter)

app.use("/api/" , RoomTypeRout) 

app.use("/api/" , HotelsRoute ) 

app.use("/api/transport" , TransportRoutes)

app.use("/api/trip" ,tripRoutes)

app.use("/api/users" , userRoutes)

app.use("/api/extra-services" , ExtraService)
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

app.use("/api", UmrahProgramRoute);

app.use("/api", AvailabilityRoute);

app.use("/api/payment", paymentCheckoutRoutes);

app.use("/api/payment", paymentCallbackRoutes);

app.use(
  "/api/bank-accounts",
  bankAccountRoutes,
);
app.use(
  "/api/payment-methods",
  paymentMethodRoutes,
);

app.use(errorHandler);


// 8️⃣ Connect DB + Start server
connectDB()
app.listen(port, () => {
  console.log(`Server is running on port ✅  ${port}`); 
}) 
