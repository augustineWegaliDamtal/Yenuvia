import express from "express";
import multer from "multer";
import Message from "../models/messageModel.js";
import {
  getMessages,
  getRecipients,
  sendMessage,
  markAsRead,
} from "../controllers/messageController.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

// 📂 MULTER CONFIGURATION
const storage = multer.diskStorage({
  destination: (req, file, cb) => { 
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s+/g, '_')); // Replace spaces with underscores
  },
});

// ✅ FILE FILTER: Only allow Arena-compatible media
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || 
      file.mimetype.startsWith("video/") || 
      file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only Images, Videos, and Audio are allowed!"), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } 
});

// --- 🛑 ARENA ROUTE HIERARCHY ---

// 1. Get Recipients list (Static path must come first)
router.get("/recipients", verifyToken, getRecipients);

// 2. Get GLOBAL history for current user (Fixes Inbox 404)
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate("sender", "username avatar role")
      .populate("recipient", "username avatar role")
      .sort({ createdAt: 1 });
    res.status(200).json({ success: true, messages });
  } catch (error) { 
    next(error); 
  }
});

// 3. Mark as Read (Action path)
router.patch("/read/:senderId", verifyToken, markAsRead);

// 4. Send Message (Submission path)
router.post("/", verifyToken, upload.single("media"), sendMessage);

// 5. Get conversation with SPECIFIC user (Dynamic ID must come last)
router.get("/:otherUserId", verifyToken, getMessages);

export default router;