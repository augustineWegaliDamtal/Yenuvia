import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import { errorHandler } from "../utils/error.js";
import mongoose from "mongoose";

// 📌 Get recipients based on role (Elite logic)
export const getRecipients = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);
    let recipients;

    if (currentUser.role === "superadmin") {
      recipients = await User.find({ role: { $in: ["admin", "artist"] } }).select("username avatar role");
    } else if (currentUser.role === "admin") {
      recipients = await User.find({ role: { $in: ["superadmin", "artist"] } }).select("username avatar role");
    } else if (currentUser.role === "artist") {
      recipients = await User.find({ role: { $in: ["admin", "superadmin"] } }).select("username avatar role");
    } else {
      recipients = [];
    }

    res.status(200).json({ success: true, users: recipients });
  } catch (error) {
    next(error);
  }
};

// 📌 Get conversation history
export const getMessages = async (req, res, next) => {
  try {
    const { otherUserId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId },
      ],
    })
      .populate("sender", "_id username role avatar")
      .populate("recipient", "_id username role avatar")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// 📌 Send message with Swift Socket Triggers
export const sendMessage = async (req, res, next) => {
  try {
    const { recipient, content } = req.body;
    const sender = req.user;

    if (!recipient || !mongoose.Types.ObjectId.isValid(recipient)) {
      return next(errorHandler(400, "Target recipient is missing or invalid."));
    }

    const recipientUser = await User.findById(recipient);
    if (!recipientUser) return next(errorHandler(404, "Recipient not found in the Arena."));

    // ✅ HANDLE MEDIA UPLOAD (Standardized Path)
    let mediaUrl = null;
    let mediaType = null;
    if (req.file) {
      // Store as relative path /uploads/filename.ext
      mediaUrl = `/uploads/${req.file.filename}`;
      const mime = req.file.mimetype;
      if (mime.startsWith("image")) mediaType = "image";
      else if (mime.startsWith("video")) mediaType = "video";
      else if (mime.startsWith("audio")) mediaType = "audio";
    }

    if (!content?.trim() && !mediaUrl) {
      return next(errorHandler(400, "Cannot send an empty transmission."));
    }

    const newMessage = await Message.create({
      sender: sender._id,
      recipient: recipientUser._id,
      content: content?.trim(),
      mediaUrl,
      mediaType,
      read: false
    });

    // ✅ RE-FETCH WITH FULL POPULATION (Crucial for Socket stability)
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "_id username role avatar")
      .populate("recipient", "_id username role avatar");

    // ⚡ SOCKET.IO: BROADCAST TO BOTH PARTIES
    if (req.io) {
      const senderRoom = sender._id.toString();
      const recipientRoom = recipientUser._id.toString();

      // Send the FULL populated object to both participants
      // This prevents the "disappearing" act because the frontend gets the same data
      req.io.to(senderRoom).emit("receiveMessage", populatedMessage);
      req.io.to(recipientRoom).emit("receiveMessage", populatedMessage);

      // Trigger Badge/Toast for Admins
      if (["admin", "superadmin"].includes(recipientUser.role)) {
        req.io.to(recipientRoom).emit("new_admin_message", {
          from: sender.username,
          text: content || "Sent a file",
          messageId: populatedMessage._id
        });
      }
    }

    res.status(200).json({ success: true, message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

// 📌 Mark as Read
export const markAsRead = async (req, res, next) => {
  try {
    const { senderId } = req.params;
    const recipientId = req.user._id;

    await Message.updateMany(
      { sender: senderId, recipient: recipientId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ success: true, message: "Conversation synchronized." });
  } catch (error) {
    next(error);
  }
};