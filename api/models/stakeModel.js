import mongoose from "mongoose";

const stakeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    // Which school/contender did they back?
    contenderId: {
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
    },
    // The GHS amount they paid
    amount: {
      type: Number,
      required: true, 
    },
    // Prevents double-counting the same payment
    paystackReference: {
      type: String,
      required: true,
      unique: true, 
    },
    status: {
      type: String,
      enum: ["PENDING", "WON", "LOST", "REFUNDED"],
      default: "PENDING",
    },
    // How much dividend they received if their faction won
    payoutAmount: {
      type: Number,
      default: 0, 
    }
  },
  { timestamps: true }
);

export const Stake = mongoose.model("Stake", stakeSchema);