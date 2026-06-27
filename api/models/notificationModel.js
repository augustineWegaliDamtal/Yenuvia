import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // For an order, this is the Buyer!
    },
    type: {
      type: String,
      // 🟢 ADDED "order" and "delivery" to support the marketplace!
      enum: ["like", "comment", "gift", "follow", "system", "approval", "order", "delivery"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedWork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Work",
      default: null, // The artwork they bought
    },
    // 🟢 ADDED THIS: Links directly to the purchase so the artist can see shipping info
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order", // Assuming you have an Order model for payments
      default: null,
    }
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;