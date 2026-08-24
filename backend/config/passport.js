import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import User from "../models/user-model.js";
import { USER_ROLES } from "../constants/auth/roles.js";
import { normalizeEmail } from "../services/auth/auth-service.js";

dotenv.config();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const resolveGoogleUser = async ({ profile, UserModel = User }) => {
  const emailEntry = profile?.emails?.[0];
  const email = normalizeEmail(emailEntry?.value);
  if (!email || emailEntry?.verified === false) {
    throw new Error("Google account did not provide a verified email");
  }

  let user = await UserModel.findOne({ googleId: profile.id });
  if (user) return user;

  user = await UserModel.findOne({
    email: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
  });
  if (user) {
    user.googleId = profile.id;
    if (!user.profileImage) user.profileImage = profile.photos?.[0]?.value || "";
    await user.save();
    return user;
  }

  try {
    return await UserModel.create({
      username: profile.displayName || email.split("@")[0],
      email,
      profileImage: profile.photos?.[0]?.value || "",
      googleId: profile.id,
      role: USER_ROLES.USER,
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const existing = await UserModel.findOne({
      email: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
    });
    if (!existing) throw error;
    if (!existing.googleId) {
      existing.googleId = profile.id;
      await existing.save();
    }
    return existing;
  }
};

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      done(null, await resolveGoogleUser({ profile }));
    } catch (error) {
      done(error, null);
    }
  },
));

export default passport;
