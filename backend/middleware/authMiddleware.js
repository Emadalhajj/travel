import jwt from "jsonwebtoken";
import User from "../models/user-model.js";

import { createSecurityEvent } from "../services/audit/security-event-service.js";
import { SECURITY_EVENT_TYPES } from "../constants/audit/security-event-types.js";

/*
=====================================================
Protect Middleware
=====================================================

يتأكد من وجود JWT صحيح.

إذا التوكن صحيح:
-----------------------------------------------------
يتم جلب المستخدم ووضعه داخل req.user.

إذا التوكن غير صحيح:
-----------------------------------------------------
يتم رفض الطلب.
=====================================================
*/

export const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      await createSecurityEvent({
        req,
        type: SECURITY_EVENT_TYPES.UNAUTHORIZED_ACCESS,
        message: "Request without authorization token",
      });

      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const token = auth.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      await createSecurityEvent({
        req,
        type: SECURITY_EVENT_TYPES.INVALID_TOKEN,
        message: "Token user not found",
        metadata: {
          decoded,
        },
      });

      return res.status(401).json({
        message: "User not found",
      });
    }

    if (!user.isActive) {
      await createSecurityEvent({
        req,
        type: SECURITY_EVENT_TYPES.FORBIDDEN_ACCESS,
        message: "Inactive account tried to access protected resource",
        metadata: {
          userId: user._id,
          role: user.role,
        },
      });

      return res.status(403).json({
        message: "Account is inactive",
      });
    }

    req.user = user;

    next();
  } catch (err) {
    await createSecurityEvent({
      req,
      type: SECURITY_EVENT_TYPES.INVALID_TOKEN,
      message: "Token invalid or expired",
      metadata: {
        error: err.message,
      },
    });

    return res.status(401).json({
      message: "Token invalid or expired",
    });
  }
};

/*
=====================================================
Authorize Middleware
=====================================================

يتأكد أن دور المستخدم موجود ضمن الأدوار المسموحة.

مثال:
-----------------------------------------------------
authorize("admin", "superAdmin")

أو:
-----------------------------------------------------
authorize(["admin", "superAdmin"])
=====================================================
*/

export const authorize = (...roles) => async (req, res, next) => {
  const allowed = roles.flat();

  if (!req.user) {
    await createSecurityEvent({
      req,
      type: SECURITY_EVENT_TYPES.UNAUTHORIZED_ACCESS,
      message: "Authorization check without authenticated user",
      metadata: {
        requiredRoles: allowed,
      },
    });

    return res.status(401).json({
      message: "Not authorized",
    });
  }

  if (!allowed.includes(req.user.role)) {
    await createSecurityEvent({
      req,
      type: SECURITY_EVENT_TYPES.FORBIDDEN_ACCESS,
      message: "User tried to access forbidden resource",
      metadata: {
        requiredRoles: allowed,
        userRole: req.user?.role,
      },
    });

    return res.status(403).json({
      message: "Forbidden",
    });
  }

  next();
};

// import jwt from "jsonwebtoken";
// import User from "../models/user-model.js";
// import { createSecurityEvent } from "../services/audit/security-event-service.js";
// import { SECURITY_EVENT_TYPES } from "../constants/audit/security-event-types.js";
// export const protect = async (req, res, next) => {
//   try {
//     const auth = req.headers.authorization;
//     if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Not authorized" })//
//     const token = auth.split(" ")[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId).select("-password");
//     if (!user) return res.status(401).json({ message: "User not found" });
//     if (!user.isActive) {
//       return res.status(403).json({ message: "Account is inactive" });
//     }
//     req.user = user;
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Token invalid or expired" });
//   }
// };

// export const authorize = (roles = []) => async (req, res, next) => {

//   await createSecurityEvent({
//   req,
//   type: SECURITY_EVENT_TYPES.FORBIDDEN_ACCESS,
//   message: "User tried to access forbidden resource",
//   metadata: {
//     requiredRoles: roles,
//     userRole: req.user?.role,
//   },
// });

//   // roles can be string or array
//   const allowed = Array.isArray(roles) ? roles : [roles];
//   if (!req.user) return res.status(401).json({ message: "Not authorized" });
//   if (!allowed.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
//   next();
// };



