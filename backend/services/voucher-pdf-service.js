// services/vouchers/voucher-pdf-service.js

/*
=====================================================
Voucher PDF Service
=====================================================

هذا الملف مسؤول فقط عن إنشاء ملف PDF فعليًا.

لا يتعامل مع:
-----------------------------------------------------
- قاعدة البيانات
- إنشاء Voucher document
- التحقق من الحجز
- صلاحيات المستخدم

وظيفته الوحيدة:
-----------------------------------------------------
استقبال بيانات الحجز ورقم الفاوتشر
ثم إنشاء ملف PDF في التخزين الخاص للمستندات الحديثة،
مع إبقاء مسار التخزين القديم للتوافق مع الاستعمالات القديمة فقط.
=====================================================
*/

import PDFDocument from "pdfkit";
import { readPricingSnapshot } from "./pricing/legacy-pricing-adapter.js";
import fs from "fs";
import path from "path";

import {
  ensurePdfFolderExists,
  buildPdfPublicPath,
} from "../utils/pdfStorage.js";

/*
=====================================================
generateVoucherPdf
=====================================================

تنشئ ملف PDF للحجز.

تستقبل:
-----------------------------------------------------
- voucherNumber
- booking

وتعيد:
-----------------------------------------------------
بيانات الملف الخاص، أو الرابط القديم عند طلب legacy mode صراحة.
=====================================================
*/
const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== "") || "-";

export const buildVoucherViewModel = ({ voucherNumber, booking, locale = "en" }) => {
  const room = booking.bookingItems?.room || {};
  const isArabic = String(locale).toLowerCase().startsWith("ar");
  return {
    locale: isArabic ? "ar" : "en",
    direction: isArabic ? "rtl" : "ltr",
    voucherNumber,
    bookingNumber: firstValue(booking.bookingNumber, booking._id),
    customerName: firstValue(booking.customer?.name),
    customerEmail: firstValue(booking.customer?.email),
    customerPhone: firstValue(booking.customer?.phone),
    hotelName: firstValue(
      isArabic ? room.hotelNameAr : room.hotelNameEn,
      isArabic ? room.hotelNameEn : room.hotelNameAr,
    ),
    roomTypeName: firstValue(
      isArabic ? room.roomNameAr : room.roomNameEn,
      isArabic ? room.roomNameEn : room.roomNameAr,
    ),
    checkIn: room.checkIn || null,
    checkOut: room.checkOut || null,
    nights: Number(room.nights || 0),
    roomsCount: Number(room.quantity || 0),
    adults: Number(room.adults || 0),
    children: Number(room.children || 0),
    mealPlan: firstValue(room.mealPlan),
    paymentStatus: firstValue(booking.paymentStatus),
    total: readPricingSnapshot(booking.pricing).total,
    currency: firstValue(booking.pricing?.currency, "SAR"),
  };
};

const findArabicFont = () => [
  process.env.PDF_ARABIC_FONT_PATH,
  "C:/Windows/Fonts/arial.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
].find((fontPath) => fontPath && fs.existsSync(fontPath));

export const generateVoucherPdf = async ({
  voucherNumber,
  booking,
  locale = "en",
  privateDocument = false,
}) => {
  const folderName = privateDocument ? "service-documents" : "vouchers";
  const folderPath = privateDocument
    ? path.resolve("private-uploads", folderName)
    : ensurePdfFolderExists(folderName);
  fs.mkdirSync(folderPath, { recursive: true });

  const fileName = `${voucherNumber}.pdf`;

  const filePath = path.join(folderPath, fileName);

  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
  });

  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);
  const view = buildVoucherViewModel({ voucherNumber, booking, locale });
  const isArabic = view.locale === "ar";
  const arabicFont = isArabic ? findArabicFont() : null;
  if (arabicFont) doc.font(arabicFont);
  const align = isArabic ? "right" : "left";
  const label = (ar, en) => isArabic ? ar : en;
  const date = (value) => value ? new Date(value).toISOString().slice(0, 10) : "-";

  /*
  =====================================================
  Header
  =====================================================
  */

  doc
    .fontSize(22)
    .text(label("قسيمة الحجز", "Booking Voucher"), { align: "center" });

  doc.moveDown();

  /*
  =====================================================
  Voucher Info
  =====================================================
  */

  doc.fontSize(14).text(`${label("رقم القسيمة", "Voucher Number")}: ${view.voucherNumber}`, { align });
  doc.text(`${label("رقم الحجز", "Booking Number")}: ${view.bookingNumber}`, { align });
  doc.text(`${label("حالة الدفع", "Payment Status")}: ${view.paymentStatus}`, { align });

  doc.moveDown();

  /*
  =====================================================
  Customer Info
  =====================================================
  */

  doc.fontSize(16).text(label("بيانات العميل", "Customer Information"), { align });

  doc.moveDown(0.5);

  doc.fontSize(12).text(`${label("الاسم", "Name")}: ${view.customerName}`, { align });
  doc.text(`${label("البريد الإلكتروني", "Email")}: ${view.customerEmail}`, { align });
  doc.text(`${label("الهاتف", "Phone")}: ${view.customerPhone}`, { align });

  doc.moveDown();

  /*
  =====================================================
  Booking Summary
  =====================================================
  */

  doc.fontSize(16).text(label("تفاصيل السكن", "Accommodation Details"), { align });

  doc.moveDown(0.5);

  doc.fontSize(12).text(`${label("الفندق", "Hotel")}: ${view.hotelName}`, { align });
  doc.text(`${label("نوع الغرفة", "Room Type")}: ${view.roomTypeName}`, { align });
  doc.text(`${label("تسجيل الوصول", "Check-in")}: ${date(view.checkIn)}`, { align });
  doc.text(`${label("تسجيل المغادرة", "Check-out")}: ${date(view.checkOut)}`, { align });
  doc.text(`${label("الليالي", "Nights")}: ${view.nights}`, { align });
  doc.text(`${label("عدد الغرف", "Rooms")}: ${view.roomsCount}`, { align });
  doc.text(`${label("البالغون", "Adults")}: ${view.adults}`, { align });
  doc.text(`${label("الأطفال", "Children")}: ${view.children}`, { align });
  doc.text(`${label("خطة الوجبات", "Meal plan")}: ${view.mealPlan}`, { align });
  doc.text(`${label("الإجمالي النهائي", "Final total")}: ${view.total}`, { align });
  doc.text(`${label("العملة", "Currency")}: ${view.currency}`, { align });

  doc.moveDown();

  /*
  =====================================================
  Footer
  =====================================================
  */

  doc
    .fontSize(11)
    .text(label("شكرًا لحجزكم معنا.", "Thank you for booking with us."), {
      align: "center",
    });

  doc.end();

  /*
  ننتظر حتى ينتهي حفظ الملف فعليًا.
  */
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  if (!privateDocument) return buildPdfPublicPath(folderName, fileName);
  return {
    storageName: fileName,
    originalName: `${voucherNumber}.pdf`,
    mimeType: "application/pdf",
    size: fs.statSync(filePath).size,
  };
};
