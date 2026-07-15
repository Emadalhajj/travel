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
ثم إنشاء ملف PDF وحفظه داخل uploads/vouchers.
=====================================================
*/

import PDFDocument from "pdfkit";
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
رابط ملف PDF العام ليتم حفظه في قاعدة البيانات.
=====================================================
*/
/*
الدالة الرئيسية تستقبل
voucherNumber
booking
ثم
تنشئ مجلد uploads/vouchers
تنشئ اسم الملف
تفتح PDF جديد
تكتب بيانات الحجز
تحفظ الملف
ترجع رابط الملف
*/
export const generateVoucherPdf = async ({ voucherNumber, booking }) => {
  const folderName = "vouchers";

  const folderPath = ensurePdfFolderExists(folderName);

  const fileName = `${voucherNumber}.pdf`;

  const filePath = path.join(folderPath, fileName);

  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
  });

  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  /*
  =====================================================
  Header
  =====================================================
  */

  doc
    .fontSize(22)
    .text("Umrah Booking Voucher", {
      align: "center",
    });

  doc.moveDown();

  /*
  =====================================================
  Voucher Info
  =====================================================
  */

  doc.fontSize(14).text(`Voucher Number: ${voucherNumber}`);

  doc.text(`Booking Number: ${booking.bookingNumber || booking._id}`);

  doc.text(`Booking Status: ${booking.status || "-"}`);

  doc.text(`Payment Status: ${booking.paymentStatus || "-"}`);

  doc.moveDown();

  /*
  =====================================================
  Customer Info
  =====================================================
  */

  doc.fontSize(16).text("Customer Information");

  doc.moveDown(0.5);

  doc.fontSize(12).text(`Name: ${booking.customer?.name || "-"}`);

  doc.text(`Email: ${booking.customer?.email || "-"}`);

  doc.text(`Phone: ${booking.customer?.phone || "-"}`);

  doc.moveDown();

  /*
  =====================================================
  Booking Summary
  =====================================================
  */

  doc.fontSize(16).text("Booking Summary");

  doc.moveDown(0.5);

  doc.fontSize(12).text(`Booking Type: ${booking.bookingType || "-"}`);

  doc.text(`Current Step: ${booking.currentStep || "-"}`);

  doc.text(`Total Amount: ${booking.pricing?.total || 0}`);

  doc.text(`Currency: ${booking.pricing?.currency || "SAR"}`);

  doc.moveDown();

  /*
  =====================================================
  Footer
  =====================================================
  */

  doc
    .fontSize(11)
    .text("Thank you for booking with us.", {
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

  return buildPdfPublicPath(folderName, fileName);
};