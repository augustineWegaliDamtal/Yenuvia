import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

// 🔔 GET: Fetch all notifications for the logged-in user
// Route: GET /api/notifications/
router.get("/", verifyToken, getUserNotifications);

// 📚 PUT: Mark ALL notifications as read
// Route: PUT /api/notifications/read-all
// Note: We put this BEFORE '/:id' so the router doesn't confuse "read-all" with an ID
router.put("/read-all", verifyToken, markAllAsRead);

// 📖 PUT: Mark a specific single notification as read
// Route: PUT /api/notifications/:id/read
router.put("/:id/read", verifyToken, markAsRead);

export default router;