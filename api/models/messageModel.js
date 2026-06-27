import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["directMessage", "notice", "postUpdate"], default: "directMessage" },
    content: { type: String }, // text message (optional if media is present)

    // Media support
    mediaUrl: { type: String }, // URL to image, video, or audio file
    mediaType: {
      type: String,
      enum: ["image", "video", "audio"],
      default: null,
    },
  },
  { timestamps: true } // ✅ automatically adds createdAt and updatedAt
);

export default mongoose.model("Message", messageSchema);
