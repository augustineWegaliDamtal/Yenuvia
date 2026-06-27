import express from "express";
import {
  Signup,        // Artist signup (default role)
  Signin,        // Artist signin
  Google,        // Google OAuth
  signOut,       // Logout
  AdminSignup,   // Admin creation (restricted to superadmin)
  AdminSignin,
  SuperAdminSignin,   // Admin signin
} from "../controllers/authController.js";

import { verifyToken, verifySuperAdmin } from "../utils/verifyUser.js";

const router = express.Router();

/* 🎨 Artist endpoints */
router.post("/signup", Signup);
router.post("/signin", Signin);

/* 🌐 OAuth endpoint */
router.post("/google", Google);

/* 🚪 Logout */
router.post("/signout", signOut);

/* 🛡 Admin endpoints */
router.post("/admin-signup", verifyToken, verifySuperAdmin, AdminSignup);
router.post("/admin-signin", AdminSignin);
router.post("/superadmin-signin", SuperAdminSignin);


export default router;
