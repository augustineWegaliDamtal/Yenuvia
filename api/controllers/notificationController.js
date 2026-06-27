import Notification from "../models/notificationModel.js";
import { errorHandler } from "../utils/error.js";

// 🔔 1. GET ALL NOTIFICATIONS FOR THE LOGGED-IN USER
export const getUserNotifications = async (req, res, next) => {
  try {
    // Fetch the latest 50 notifications for this specific user
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 }) // Newest first!
      .limit(50) 
      .populate("sender", "username avatar") // Grabs the sender's details for the UI
      .populate("relatedWork", "title mediaUrls type") // Grabs the artwork details
      .populate("relatedOrder", "totalAmount status"); // Grabs the order details

    // Calculate how many are unread so we can put the number in the red badge!
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({ 
      success: true, 
      notifications, 
      unreadCount 
    });
  } catch (error) {
    next(error);
  }
};

// 📖 2. MARK A SINGLE NOTIFICATION AS READ
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) return next(errorHandler(404, "Notification not found"));

    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// 📚 3. MARK ALL AS READ (For the "Mark all as read" button)
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false }, // Find all unread for this user
      { $set: { isRead: true } } // Change them all to read
    );

    res.status(200).json({ success: true, message: "All caught up!" });
  } catch (error) {
    next(error);
  }
};