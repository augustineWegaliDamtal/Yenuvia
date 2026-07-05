import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { errorHandler } from "./error.js";


export const verifyToken = (req, res, next) => {
  console.log("🛡️ BOUNCER CHECK: Someone is trying to access a secure route!");
  
  // Look for the token in cookies OR the Authorization header
  const token = req.cookies?.access_token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    console.log("❌ BOUNCER SAYS: No token found! Kicking them out.");
    return next(errorHandler(401, "Unauthorized Access. Please log in."));
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log("❌ BOUNCER SAYS: Token is fake or expired.");
      return next(errorHandler(403, "Session expired. Please log in again."));
    }
 
    try {
      const user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        console.log("❌ BOUNCER SAYS: Ghost user (account deleted).");
        return next(errorHandler(404, "Security Alert: User account no longer exists."));
      }

      
      req.user = user; 
      
      console.log(`✅ BOUNCER SAYS: Access Granted to ${user.role} (${user.username})`);
      next();
    } catch (error) {
      console.error("DB Verification Error:", error.message);
      next(errorHandler(500, "Internal Security Engine Failure"));
    }
  });
};


export const verifyAdmin = (req, res, next) => {

  const role = req.user?.role;
  if (role === "admin" || role === "superadmin") {
    return next();
  }
  return next(errorHandler(403, "Moderation Access Denied: Admin privileges required."));
};


export const verifySuperAdmin = (req, res, next) => {
  if (req.user?.role !== "superadmin") {
    return next(errorHandler(403, "Root Access Denied: SuperAdmin authorization required."));
  }
  next();
};