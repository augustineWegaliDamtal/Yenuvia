import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    billboardMode: {
      type: String,
      enum: ["community", "artist"],
      default: "community",
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
