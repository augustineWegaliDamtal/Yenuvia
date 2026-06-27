import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import { approvePayout, getPendingPayouts } from "../controllers/payoutController.js";
// Use your admin auth middleware

const router = express.Router();

// Both of these should be protected so only SuperAdmins can use them
router.get("/admin/pending", verifyToken, getPendingPayouts);
router.put("/approve/:id", verifyToken, approvePayout);

export default router;