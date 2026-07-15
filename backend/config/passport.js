//for sinup by google account
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user-model.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // البحث عن المستخدم بالبريد الإلكتروني
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        // ربط حساب Google إذا كان المستخدم موجودًا بدون googleId
        if (user && !user.googleId) {
          user.googleId = profile.id;
          user.profileImage = user.profileImage || profile.photos[0]?.value || "";
          await user.save();
          return done(null, user);
        }

        // إنشاء مستخدم جديد إذا لم يكن موجودًا
        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email,
            profileImage: profile.photos[0]?.value || "",
            googleId: profile.id,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

export default passport;




// // const passport = require('passport');// Passport.js هو مكتبة تستخدم لتسهيل عملية المصادقة (Authentication) في تطبيقات Node.js.
// import passport from 'passport';

// // Passport.js يوفر استراتيجيات مختلفة للمصادقة، مثل المصادقة عبر البريد
// // const GoogleStrategy = require('passport-google-oauth20').Strategy;// Google OAuth 2.0 strategy for Passport.js
// import GoogleStrategy from 'passport-google-oauth20';
// // وهي واحدة من استراتيجيات Passport.js التي تسمح للمستخدمين بتسجيل الدخول باستخدام حساباتهم في Google.
// // const User = require('../models/User');// User model for MongoDB

// import User from '../models/user-model.js';

// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,// Google Client ID from environment variables
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,// Google Client Secret from environment variables
//   // callbackURL هو الرابط الذي سيعود إليه Google بعد المصادقة الناجحة.
//   callbackURL: "/api/auth/google/callback",// Callback URL for Google OAuth
// }, async (accessToken, refreshToken, profile, done) => {
//     // accessToken هو الرمز الذي يمنح الوصول إلى بيانات المستخدم من Google.
//     // refreshToken هو الرمز الذي يمكن استخدامه لتحديث accessToken عند انتهاء صلاحيته.
//     // profile يحتوي على معلومات المستخدم التي تم الحصول عليها من Google بعد المصادقة الناج
//     // done هو دالة تُستخدم لإعلام Passport.js بنجاح أو فشل المصادقة.

//   try {
//      // 1. تحقق إن كان هناك مستخدم موجود مسبقاً بنفس googleId
//     let user = await User.findOne({googleId : profile.id})
//     if(user){
//         return done(null , user) //// تسجيل الدخول فقط
//     }
//        // 2. إذا لم يوجد، تحقق إذا كان هناك مستخدم بنفس البريد
//     user = await User.findOne({ email : profile.emails[0].value})
//     if(user){
//              // إذا وجد مستخدم بالبريد فقط، نربط حساب Google به
//       user.googleId = profile.id;
//       await user.save();
//       return done(null, user);
//     }
//     // 3. إنشاء مستخدم جديد

//     const newUser = new User(
//       {
//         email: profile.emails[0].value,// استخدام البريد الإلكتروني الأول من بيانات الملف الشخصي
//         username: profile.displayName, // استخدام الاسم المعروض من بيانات الملف الشخصي
//         googleId: profile.id,// حفظ Google ID في قاعدة البيانات
//         avatar: profile.photos?.[0]?.value
//       });
//       await newUser.save()

//     return done(null, newUser);
//   } catch (err) {
//     return done(err, null);
//   }
// }));
