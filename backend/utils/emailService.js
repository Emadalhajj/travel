// const nodemailer = require("nodemailer");

import nodemailer from 'nodemailer';

const { EMAIL, PASSWORD } = process.env;

// ✨ أنشئ transporter مرة وحدة هنا
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,   // بريد المرسل
    pass: process.env.EMAIL_PASS,   // كلمة المرور أو App Password
  },
});
// إرسال فاتورة الطلب

const sendOrderReceipt = async (toEmail, order) => {
  // const transporter = nodemailer.createTransport({
  //   service: "gmail",
  //   auth: {
  //     user: process.env.EMAIL_USER,      // بريد المرسل
  //     pass: process.env.EMAIL_PASS,      // كلمة المرور أو App Password
  //   },
  // })
  const productsList = order.items.map(item => 
    `<li>${item.name} × ${item.quantity} = ${item.price * item.quantity} ر.س</li>`
  ).join("");

  const htmlContent = `
    <h2>🛒 فاتورة الطلب</h2>
    <p>📄 رقم الفاتورة: <strong>#${order._id}</strong></p>
    
    <p>📅 التاريخ: ${new Date(order.createdAt).toLocaleString()}</p>
    <ul>${productsList}</ul>
    <p><strong>الإجمالي الكلي: ${order.total.toFixed(2)} ر.س</strong></p>
    <p><strong>رقم المعاملة:</strong> ${order.paymentId}</p>
    <p>شكراً لتسوقك معنا! 🌟</p>
  `;

  await transporter.sendMail({
    from: `" N.W متجرنا" <${process.env.EMAIL_USER}>`, // اسم المرسل
    to: toEmail, // البريد الإلكتروني للمستلم
    subject: "فاتورة طلبك من متجرنا", // عنوان الرسالة
    html: htmlContent, // محتوى الرسالة بصيغة HTML
  });

}
// * دالة عامة لإرسال أي إيميل (مثلاً للرفض أو القبول)
 
async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };
  await transporter.sendMail(mailOptions); // ✅ الآن تعمل
}

module.exports = { sendOrderReceipt , sendEmail };
// يمكنك استخدام هذه الدالة في أي مكان في تطبيقك لإرسال فاتورة الطلب عبر البريد الإلكتروني
  

