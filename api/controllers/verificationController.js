// controllers/paymentController.js
import { initializeTransaction, verifyTransaction } from "../services/paystackService.js";
import User from "../models/userModel.js";

// 🔥 1. IMPORT THE GLOBAL SOCKET ENGINE
import { getIO } from "../socket/socketManager.js";

export const initiateVerificationPayment = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 🟢 1. GET THE CYCLE FROM FRONTEND (monthly or annually)
    const { cycle } = req.body; 

    // 🟢 2. SELECT THE RIGHT PLAN CODE FROM YOUR .ENV
    const planCode = cycle === 'annually' 
      ? process.env.PAYSTACK_ANNUAL_PLAN_CODE 
      : process.env.PAYSTACK_MONTHLY_PLAN_CODE;

    // 🟢 3. SET THE CORRECT PRICE (600 GHS for Annual, 60 GHS for Monthly)
    const amountInPesewas = cycle === 'annually' ? 60000 * 100 : 6000 * 100;

    const response = await initializeTransaction({
      email: user.email,
      amount: amountInPesewas, 
      plan: planCode, // 🚀 THIS IS THE KEY: Tells Paystack to start the subscription
      callback_url: `http://localhost:3000/api/payments/callback`,
      metadata: { 
        purpose: "pro_subscription", // Changed from "verification" to match our logic
        userId: user._id,
        cycle: cycle 
      },
    });

    console.log("Paystack init response body:", response.body);

    if (!response.body?.data?.authorization_url) {
      return res.status(500).json({
        success: false,
        message: "Failed to create authorization URL",
        error: response.body,
      });
    }

    return res.json({
      success: true,
      authorization_url: response.body.data.authorization_url,
      reference: response.body.data.reference,
    });
  } catch (err) {
    console.error("Paystack init error:", err.response?.body || err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const handlePaymentCallback = async (req, res) => {
  try {
    // 1. Grab the reference from the URL
    const reference = req.query.reference || req.query.trxref || req.query.txref;
    console.log("--- Callback received for reference:", reference);

    if (!reference) {
      return res.redirect(`http://localhost:5173/payment-error?message=No+reference`);
    }

    // 2. Verify with Paystack
    const response = await verifyTransaction(reference);

    // 🟢 Paystack libraries nest data differently, checking both common locations
    const paystackData = response.data || response.body?.data;
    
    console.log("Paystack Transaction Status:", paystackData?.status);

    if (paystackData && paystackData.status === "success") {
      
      // 3. Extract and Parse Metadata
      let metadata = paystackData.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error("Could not parse metadata string");
        }
      }

      // 🟢 We now extract 'cycle' (monthly/annually) sent from the frontend
      const { userId, purpose, cycle } = metadata || {};

      if (purpose === "pro_subscription" || purpose === "verification") {
        
        // 🏆 4. CALCULATE EXPIRY DATE
        const expiryDate = new Date();
        
        if (cycle === 'annually') {
          // Add 1 Year
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else {
          // Default: Add 1 Month
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        }

        // 👑 5. UPDATE DATABASE
        // We save both 'verified' AND the 'subscriptionExpiry' date
        await User.findByIdAndUpdate(userId, { 
          verified: true,
          subscriptionExpiry: expiryDate 
        });

        // ⚡ SOCKET SHOUT 1: Artist successfully paid and is now verified!
        const io = getIO();
        io.emit("artist_verification_updated", { artistId: userId, verified: true });

        console.log(`✅ Success: User ${userId} is now Pro until ${expiryDate.toDateString()}`);
      }

      // 🚀 REDIRECT TO HOME WITH SUCCESS FLAG
      return res.redirect(`http://localhost:5173/?verified=success`);

    } else {
      console.error("❌ Paystack reported status:", paystackData?.status);
      return res.redirect(`http://localhost:5173/payment-failed`);
    }

  } catch (err) {
    console.error("💥 Critical Callback Error:", err.message);
    return res.redirect(`http://localhost:5173/payment-error?message=Verification+Failed`);
  }
};


export const awardVerification = async (req, res) => {
  try {
    const artist = await User.findByIdAndUpdate(
      req.params.id,
      { verified: true },
      { new: true }
    ).select("username email avatar verified");

    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" });
    }

    // ⚡ SOCKET SHOUT 2: Admin manually awarded a Blue Tick!
    const io = getIO();
    io.emit("artist_verification_updated", { artistId: artist._id, verified: true });

    res.json({ success: true, data: artist });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Revoke verification (super admin only)
export const unverifyVerification = async (req, res) => {
  try {
    // Only super admins can revoke verification
    if (!req.user || req.user.role.toLowerCase() !== "superadmin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Update the user’s verified status to false
    const artist = await User.findByIdAndUpdate(
      req.params.id,
      { verified: false },
      { new: true }
    ).select("username email avatar verified");

    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" });
    }

    // ⚡ SOCKET SHOUT 3: Admin revoked the Blue Tick!
    const io = getIO();
    io.emit("artist_verification_updated", { artistId: artist._id, verified: false });

    res.json({ success: true, data: artist });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};