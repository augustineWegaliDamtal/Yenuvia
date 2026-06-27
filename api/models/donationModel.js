import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // link to the donor (user making the donation)
      required: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // link to the artist receiving the donation
      required: true,
    },
    amount: {
      type: Number, // in GHS
      required: true,
    },
    reference: {
      type: String, // Paystack transaction reference
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
