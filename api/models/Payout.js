import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  network: { type: String, enum: ["MTN", "TELECEL", "AT"], required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ["PENDING", "COMPLETED", "REJECTED"], default: "PENDING" },
}, { timestamps: true });

export const Payout = mongoose.model("Payout", payoutSchema);