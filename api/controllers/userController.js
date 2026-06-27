import User from "../models/userModel.js";
import Work from "../models/Work.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import * as paystackService from '../services/paystackService.js';
import { Stake } from "../models/stakeModel.js";
import smileIdentityCore from "smile-identity-core";
import crypto from "crypto";
import axios from "axios";
const { IDApi } = smileIdentityCore; 

export const updateUser = async (req, res, next) => {
  // 🛡️ Security Check
  if (req.user._id.toString() !== req.params.id) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    const updateFields = { ...req.body };
    
    if (req.body.password) {
      updateFields.password = bcryptjs.hashSync(req.body.password, 10);
    }

    // 💰 MOMO AUTOMATION: Ping Paystack to get the Subaccount Code
    // We only ping if they provided the 3 details, and don't already have a code
    if (req.body.momoName && req.body.momoNumber && req.body.momoNetwork && !req.body.paystackSubaccountCode) {
      try {
        const subaccountData = await paystackService.createSubaccount({
          momoName: req.body.momoName,
          momoNumber: req.body.momoNumber,
          momoNetwork: req.body.momoNetwork
        });

        if (subaccountData && subaccountData.status) {
          // If Paystack says yes, attach the ACCT_xxx code to our database updates
          updateFields.paystackSubaccountCode = subaccountData.data.subaccount_code;
        } else {
           console.error("Paystack Subaccount Failed:", subaccountData.message);
           // You can choose to throw an error here, or let the profile save anyway
        }
      } catch (err) {
        console.error("Paystack Connection Error:", err.message);
      }
    }

    // 💾 Save the final updates to the Database
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { $set: updateFields }, 
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Hide password and generate fresh token
    const { password, ...userData } = updatedUser._doc;
    const token = jwt.sign({ id: updatedUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ success: true, user: { ...userData, token } });
  } catch (error) {
    next(error);
  }
};


export const followUser = async (req, res, next) => {
  if (req.user.id === req.params.id) return res.status(400).json({ success: false, message: "Can't follow yourself" });

  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow.followers.includes(req.user.id)) {
      await userToFollow.updateOne({ $push: { followers: req.user.id } });
      await currentUser.updateOne({ $push: { following: req.params.id } });
      res.status(200).json({ success: true, message: "Following!", isFollowing: true });
    } else {
      await userToFollow.updateOne({ $pull: { followers: req.user.id } });
      await currentUser.updateOne({ $pull: { following: req.params.id } });
      res.status(200).json({ success: true, message: "Unfollowed!", isFollowing: false });
    }
  } catch (error) {
    next(error);
  }
};


export const getArtistStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Aggregate Total Hypes (Likes)
    const workStats = await Work.aggregate([
      { $match: { artistId: new mongoose.Types.ObjectId(id), status: "approved" } },
      { $group: { _id: null, totalHypes: { $sum: "$likes" }, count: { $sum: 1 } } }
    ]);

    const totalHypes = workStats[0]?.totalHypes || 0;

    // Calculate Global Rank
    const allRankings = await Work.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$artistId", score: { $sum: "$likes" } } },
      { $sort: { score: -1 } }
    ]);

    const rank = allRankings.findIndex(a => a._id.toString() === id) + 1;
    const user = await User.findById(id).select("followers following school bio");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({
      success: true,
      stats: {
        hypes: totalHypes,
        rank: rank > 0 ? `#${rank}` : "Unranked",
        followers: user.followers.length,
        following: user.following.length,
        postCount: workStats[0]?.count || 0,
        school: user.school,
        bio: user.bio
      }
    });
  } catch (error) {
    next(error);
  }
};


export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Account deleted' });
  } catch (error) {
    next(error);
  }
};

// 5. 🔍 GET ALL USERS (Search/Admin)
export const getUsers = async (req, res) => {
  try {
    const { role, school } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (school) filter.school = school;

    const users = await User.find(filter).select("-password");
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 6. 👤 GET USER BY ID
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};


export const getWalletData = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get the current balance
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const history = await Stake.find({ userId })
      .populate("matchId", "directive status")
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      balance: user.walletBalance || 0, 
      history 
    });
  } catch (error) {
    console.error("Wallet Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching wallet." });
  }
};


export const verifyGhanaCard = async (req, res) => {
  try {
    const { ghanaCardNumber } = req.body;
    const userId = req.user._id;

    // 1. Initial Format Check
    if (!ghanaCardNumber || !ghanaCardNumber.startsWith("GHA-")) {
      return res.status(400).json({ success: false, message: "Invalid Ghana Card format. Must start with GHA-" });
    }

    const partner_id = process.env.SMILE_PARTNER_ID;
    const api_key = process.env.SMILE_API_KEY;

    if (!partner_id || !api_key) {
        console.error("CRITICAL: Missing Smile ID keys in .env");
        return res.status(500).json({ success: false, message: "Server configuration error." });
    }

    // 2. Set up the Timestamps and Params
    const timestamp = new Date().toISOString();

    const partner_params = {
        job_id: `JOB-${userId}-${Date.now()}`,
        user_id: userId.toString(),
        job_type: 5
    };

    // 3. Generate the Cryptographic HMAC Signature required by Smile ID
    const hmac = crypto.createHmac("sha256", api_key);
    hmac.update(timestamp);
    hmac.update(partner_id);
    hmac.update("sid_request");
    const signature = hmac.digest("base64");

    // 4. Build the exact payload shape the raw endpoint expects
    const payload = {
        partner_id: partner_id,
        partner_params: partner_params,
        country: "GH",
        id_type: "GHANA_CARD", // 🎯 The raw endpoint universally processes this string layout
        id_number: ghanaCardNumber,
        signature: signature,
        timestamp: timestamp
    };

    console.log(`Sending raw payload for ${ghanaCardNumber} directly to Smile ID Sandbox...`);

    // 5. Post directly to the Test API gateway endpoint via Axios
    const apiResponse = await axios.post("https://testapi.smileidentity.com/v1/id_verification", payload, {
        headers: { "Content-Type": "application/json" }
    });

    const response = apiResponse.data;
    console.log("SMILE ID DIRECT RAW RESPONSE:", response);

    // 6. Check the official validation return code
    if (response.ResultCode === "1012" || response.ResultCode === "1020") {
        
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { 
            ghanaCardVerified: true, 
            ghanaCardNumber: ghanaCardNumber 
          },
          { new: true }
        );

        return res.status(200).json({ success: true, user: updatedUser });
    } else {
        return res.status(400).json({ 
            success: false, 
            message: response.ResultText || "Verification failed. ID not found in database." 
        });
    }

  } catch (error) {
    if (error.response) {
        console.error("Smile ID API Error Data:", error.response.data);
    } else {
        console.error("Ghana Card Verification Error:", error.message);
    }
    res.status(500).json({ success: false, message: "Failed to connect to national verification servers." });
  }
};