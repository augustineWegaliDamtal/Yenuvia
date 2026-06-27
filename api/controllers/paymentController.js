import mongoose from "mongoose";
import { initializeTransaction, verifyTransaction } from "../services/paystackService.js";
import User from "../models/userModel.js";
import Donation from "../models/donationModel.js";
import School from "../models/School.js";
import { errorHandler } from "../utils/error.js";
import Notification from "../models/notificationModel.js";


export const initiateDonationPayment = async (req, res, next) => {
  try {
    const { amount, school } = req.body; 
    const artistId = req.params.id;

    const artist = await User.findById(artistId);
    if (!artist) return next(errorHandler(404, "Artist not found"));

    // 🚀 SAFETY CHECK
    if (!artist.paystackSubaccountCode) {
      return next(errorHandler(400, "Artist has not activated monetization yet."));
    }

    const response = await initializeTransaction({
      email: req.user.email,
      amount: amount * 100, 
      // 💸 THE SPLIT: Routes the gift directly to artist Momo
      subaccount: artist.paystackSubaccountCode,
      callback_url: `${process.env.BASE_URL}/api/payments/donation-callback`,
      metadata: { 
        purpose: "donation", 
        donorId: req.user._id, 
        artistId: artist._id,
        school: school || null 
      },
    });

    if (!response.body?.data?.authorization_url) {
      return next(errorHandler(500, "Failed to create Paystack session"));
    }

    return res.json({
      success: true,
      authorization_url: response.body.data.authorization_url,
      reference: response.body.data.reference,
    });
  } catch (err) {
    next(err);
  }
};

export const handleDonationCallback = async (req, res) => {
  try {
    const reference = req.query.reference || req.query.trxref || req.query.txref;
    
    if (!reference) {
      // 🟢 URL FIX: Changed CLIENT_URL to ARTIST_CLIENT_URL
      return res.redirect(`${process.env.ARTIST_CLIENT_URL}/payment-error?message=No+reference+found`);
    }

    const response = await verifyTransaction({ reference });

    if (response.body?.data?.status === "success") {
      const { donorId, artistId, purpose, school } = response.body.data.metadata;
      const amountGHS = response.body.data.amount / 100;

      if (purpose === "donation") {
        // 1. Record the donation for history
        await Donation.create({
          donor: donorId,
          artist: artistId,
          amount: amountGHS,
          reference: response.body.data.reference,
          status: "success",
        });

        // 2. THE ADDICTION ENGINE: BOOST THE SCHOOL
        if (school) {
          const pointsEarned = amountGHS * 10; 
          await School.findOneAndUpdate(
            { name: school.trim() },
            { 
              $inc: { totalPoints: pointsEarned, totalDonations: amountGHS } 
            },
            { upsert: true, new: true }
          );
        }

        // 🟢 3. NEW: SEND THE NOTIFICATION!
        // First, let's get the donor's name so the message looks good
        const donor = await User.findById(donorId);
        const donorName = donor ? donor.username : "Someone";
        
        const notifMessage = `💰 Awesome! ${donorName} just gifted you ${amountGHS} GHS!`;

        // Save to Database
        await Notification.create({
          recipient: artistId,
          sender: donorId,
          type: "gift",
          message: notifMessage
        });

        // Fire Real-Time Socket Alert
        if (req.io) {
          req.io.to(artistId.toString()).emit("newNotification", {
            type: "gift",
            message: notifMessage
          });
        }
      }

      // 🟢 4. URL FIX: Send them back to the Artist frontend
      return res.redirect(`${process.env.ARTIST_CLIENT_URL}/payment-success?amount=${amountGHS}&school=${encodeURIComponent(school || "")}`);
    } else {
      // 🟢 URL FIX
      return res.redirect(`${process.env.ARTIST_CLIENT_URL}/payment-failed`);
    }
  } catch (err) {
    console.error("Donation callback error:", err.message);
    // 🟢 URL FIX
    return res.redirect(`${process.env.ARTIST_CLIENT_URL}/payment-error?message=Server+Error`);
  }
};

// Get all donations made by a specific donor
export const getDonorDonations = async (req, res) => {
  try {
    const donorId = req.params.id;
    const donations = await Donation.find({ donor: donorId })
      .populate("artist", "username email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: donations });
  } catch (err) {
    console.error("Get donor donations error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get total donations for an artist
export const getArtistDonationTotal = async (req, res) => {
  try {
    const artistId = req.params.id;
    const total = await Donation.aggregate([
      { $match: { artist: new mongoose.Types.ObjectId(artistId), status: "success" } },
      { $group: { _id: "$artist", totalAmount: { $sum: "$amount" } } },
    ]);

    res.json({ success: true, total: total[0]?.totalAmount || 0 });
  } catch (err) {
    console.error("Get artist donation total error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// -------------------- QUERIES --------------------

export const getArtistDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ artist: req.params.id })
      .populate("donor", "username avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: donations });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
}


// 🚀 1. INITIATE THE SUBSCRIPTION
export const initiateVerificationPayment = async (req, res, next) => {
  try {
    const { cycle } = req.body; // 'monthly' or 'annually' from the frontend

    // Grab the correct plan code from your .env
    const planCode = cycle === 'annually' 
      ? process.env.PAYSTACK_ANNUAL_PLAN_CODE 
      : process.env.PAYSTACK_MONTHLY_PLAN_CODE;

    // The raw amount in pesewas (600 GHS or 60 GHS). Paystack requires this even with a plan!
    const amountInPesewas = cycle === 'annually' ? 600* 100 : 60 * 100; 

    const payment = await initializeTransaction({
      email: req.user.email,
      amount: amountInPesewas, 
      plan: planCode, // 🌟 THIS TELLS PAYSTACK IT IS A RECURRING SUBSCRIPTION!
      
      // Send them to your backend callback route after payment
      callback_url: `${process.env.BASE_URL}/api/payments/callback`, 
      
      metadata: {
        userId: req.user._id,
        purpose: "pro_subscription",
        cycle: cycle
      }
    });

    if (payment && payment.body && payment.body.status) {
      res.status(200).json({ 
        success: true, 
        authorization_url: payment.body.data.authorization_url 
      });
    } else {
      return next(errorHandler(500, "Failed to connect to billing server."));
    }
  } catch (error) {
    next(error);
  }
};

// 🛡️ 2. HANDLE THE SUCCESSFUL PAYMENT
export const handlePaymentCallback = async (req, res) => {
  try {
    const reference = req.query.reference || req.query.trxref || req.query.txref;
    
    if (!reference) {
      return res.redirect(`${process.env.ARTIST_CLIENT_URL}/payment-error?message=No+reference+found`);
    }

    const response = await verifyTransaction({ reference });

    // IF PAYMENT WAS SUCCESSFUL
    if (response.body?.data?.status === "success") {
      const { userId, purpose } = response.body.data.metadata;

      if (purpose === "pro_subscription") {
        
        // 👑 1. UPGRADE THE ARTIST TO PRO!
        await User.findByIdAndUpdate(userId, { 
          isVerified: true 
        });

        // 🔔 2. SEND A CELEBRATION NOTIFICATION
        const notifMessage = `Welcome to Arena Pro! Your account is now officially verified. 🏆`;
        
        await Notification.create({
          recipient: userId,
          sender: userId, // System notification
          type: "system",
          message: notifMessage
        });

        // Fire Real-Time Socket Alert
        if (req.io) {
          req.io.to(userId.toString()).emit("newNotification", {
            type: "system",
            message: notifMessage
          });
        }
      }

      // 3. Send them back to the frontend Home Feed with a success flag!
      return res.redirect(`${process.env.ARTIST_CLIENT_URL}/?verified=success`);
    } else {
      return res.redirect(`${process.env.ARTIST_CLIENT_URL}/payment-failed`);
    }
  } catch (err) {
    console.error("Verification callback error:", err.message);
    return res.redirect(`${process.env.ARTIST_CLIENT_URL}/payment-error?message=Server+Error`);
  }
};

// --- Keep your existing manual admin routes here ---
export const awardVerification = async (req, res, next) => {
  // Your existing code to let Admins manually verify someone...
};

export const unverifyVerification = async (req, res, next) => {
  // Your existing code to let Admins remove verification...
};