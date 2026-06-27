import { Match } from "../models/matchModel.js";
import { Stake } from "../models/stakeModel.js";
import Work from "../models/Work.js";
import User from "../models/userModel.js"; 
import { getIO } from "../socket/socketManager.js";
import fs from "fs";
import cloudinary from "../utils/cloudinary.js";


export const createMatch = async (req, res) => {
  try {
    const { directive, league, startTime, endTime, contenders } = req.body;

    const newMatch = await Match.create({
      directive,
      league,
      startTime,
      endTime,
      contenders, 
    });
    console.log("📢 SERVER SHOUTING: new_match triggered!");
    const io = getIO();
    io.emit("new_match", { message: "A new fixture was created!" });
    res.status(201).json({ success: true, match: newMatch });
  } catch (error) {
    console.error("Create Match Error:", error);
    res.status(500).json({ success: false, message: "Failed to create fixture" });
  }
};

export const getActiveMatches = async (req, res) => {
  try {
    const { league, status } = req.query; 
    let query = {};

    if (status === "all") {
        // Do nothing
    } else if (status) {
        if (status.includes(",")) {
            query.status = { $in: status.split(",") };
        } else {
            query.status = status;
        }
    } else {
        query.status = "LIVE";
    }

    if (league) query.league = league;

    const matches = await Match.find(query)
      .populate("contenders.artistId", "username avatar school")
      .populate("contenders.workId", "mediaUrls mediaUrl thumbnail")
      .sort({ totalPool: -1, createdAt: -1 }); 

    const matchesWithOdds = matches.map((match) => {
      const matchObj = match.toObject();

      matchObj.contenders = matchObj.contenders.map((contender) => {
        let odds = 2.0; 
        if (match.totalPool > 0 && contender.totalStaked > 0) {
          odds = match.totalPool / contender.totalStaked;
        }
        odds = odds * 0.95; 
        return {
          ...contender,
          odds: `${Math.max(odds, 1.01).toFixed(2)}x` 
        };
      });

      return matchObj;
    });

    res.status(200).json({ success: true, matches: matchesWithOdds });
  } catch (error) {
    console.error("Get Matches Error:", error);
    res.status(500).json({ success: false, message: "Failed to load matches" });
  }
};

export const getMatchDrafts = async (req, res) => {
  try {
    const drafts = await Work.find({ matchId: req.params.id })
      .populate("artistId", "username avatar school verified")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, drafts });
  } catch (error) {
    console.error("Draft Fetch Error:", error);
    res.status(500).json({ success: false, message: "Failed to load drafts" });
  }
};

export const pushMatchLive = async (req, res) => {
  try {
    const { contenders } = req.body; 

    if (!contenders || contenders.length < 2) {
      return res.status(400).json({ success: false, message: "You need at least 2 contenders to start a Derby." });
    }

    const updatedMatch = await Match.findByIdAndUpdate(
      req.params.id,
      {
        status: "LIVE",
        contenders: contenders,
        totalPool: 0, 
      },
      { new: true }
    );
    const io = getIO();
    io.emit("new_match", { message: "A Derby is now LIVE!" });

    res.status(200).json({ success: true, match: updatedMatch, message: "Derby is now LIVE!" });
  } catch (error) {
    console.error("Push Live Error:", error);
    res.status(500).json({ success: false, message: "Failed to push match live." });
  }
};

export const settleMatch = async (req, res) => {
  try {
    const { winningContenderId } = req.body;
    const matchId = req.params.id;

    const match = await Match.findById(matchId);
    if (!match || match.status !== "LIVE") {
      return res.status(400).json({ success: false, message: "Match not found or not live." });
    }

    // 🏆 STEP 1: Update Stake Ledger
    const allStakes = await Stake.find({ matchId: match._id });

    await Promise.all(allStakes.map(async (stake) => {
      if (stake.contenderId.toString() === winningContenderId) {
        stake.status = "WON";
      } else {
        stake.status = "LOST";
      }
      stake.payoutAmount = 0; 
      return stake.save();
    }));

    // 🏆 STEP 2: Finalize Match Record
    match.status = "COMPLETED";
    match.winner = winningContenderId;
    
    match.contenders.forEach(c => {
        if (c._id.toString() === winningContenderId) {
            c.isWinner = true;
        }
    });
    match.markModified('contenders'); 
    
    await match.save();

    // ⚡ THE FIX: Tell the platform the match is over so it moves to the Results section!
    const io = getIO();
    io.emit("match_settled", { message: "A Derby has been settled!" });

    res.status(200).json({ 
      success: true, 
      message: "Derby Settled. Funds secured by Yenuvia for project funding and donations."
    });

  } catch (error) {
    console.error("Settlement Error:", error);
    res.status(500).json({ success: false, message: "Internal server error during settlement." });
  }
};

export const getHeroBannerData = async (req, res) => {
  try {
    const liveMatch = await Match.findOne({ status: "LIVE" })
      .populate("contenders.artistId", "username profilePicture")
      .populate("contenders.workId")
      .sort({ totalPool: -1, createdAt: -1 }); 

    if (liveMatch) {
      return res.status(200).json({ success: true, type: "LIVE", data: liveMatch });
    }

    const upcomingMatch = await Match.findOne({ status: "UPCOMING" })
      .sort({ createdAt: -1 });

    if (upcomingMatch) {
      return res.status(200).json({ success: true, type: "DIRECTIVE", data: upcomingMatch });
    }

    res.status(200).json({ success: true, type: "EMPTY", data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error loading banner." });
  }
};

export const deleteMatch = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });
console.log("📢 SERVER SHOUTING: new_match triggered!");
    // ⚡ THE FIX: Re-use "new_match" trigger to force a silent refresh of the list
    const io = getIO();
    io.emit("new_match", { message: "A match was removed." });

    res.status(200).json({ success: true, message: "Directive taken down successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyAndProcessSupport = async (req, res) => {
  try {
    console.log("\n---- 🛑 NEW PAYMENT ATTEMPT STARTED ----");
    const { reference, contenderId } = req.body;
    const matchId = req.params.id;
    
    // 🔍 STEP 1: Check the User Token
    console.log("1. User object from token:", req.user);
    const userId = req.user._id || req.user.id; // Failsafe for JWT token structure!

    // 🔍 STEP 2: Ping Paystack
    console.log(`2. Verifying reference [${reference}] with Paystack...`);
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Ensure this is in your .env!
          "Content-Type": "application/json"
        },
      }
    );

    const paystackData = await paystackRes.json();
    console.log("3. Paystack Response Status:", paystackData.status);

    if (!paystackData.status || paystackData.data.status !== "success") {
      console.log("❌ FAILED AT PAYSTACK: Payment was not successful or Secret Key is wrong.");
      return res.status(400).json({ success: false, message: "Payment was not successful." });
    }

    const transaction = paystackData.data;
    const amountPaid = transaction.amount / 100;
    console.log(`4. Payment Valid! Amount: GHS ${amountPaid}`);

    // 🔍 STEP 3: Check for Double Spend
    const existingSupport = await Stake.findOne({ paystackReference: reference });
    if (existingSupport) {
      console.log("❌ FAILED: Transaction already processed in database.");
      return res.status(400).json({ success: false, message: "Transaction already processed." });
    }

    // 🔍 STEP 4: Save to Ledger
    console.log("5. Saving Stake to Ledger...");
    const newSupport = new Stake({
      matchId,
      userId,
      contenderId,
      amount: amountPaid, 
      paystackReference: reference,
      status: "PENDING"
    });
    await newSupport.save();

    // 🔍 STEP 5: Update the Match Bounty
    console.log("6. Updating Match Pool...");
    const updatedMatch = await Match.findOneAndUpdate(
      { _id: matchId, "contenders._id": contenderId },
      { 
        $inc: { 
          totalPool: amountPaid,
          "contenders.$.totalStaked": amountPaid 
        } 
      },
      { new: true } // Return the updated document
    );
    console.log("7. Match Pool Updated! New Total Pool is:", updatedMatch?.totalPool);

    const io = getIO();
    io.to(matchId).emit("pool_updated", {
      matchId: matchId,
      newTotalPool: updatedMatch.totalPool,
      contenders: updatedMatch.contenders
    });

    console.log("---- ✅ PAYMENT COMPLETE ----\n");
    res.status(200).json({ success: true, message: "Support verified!", amount: amountPaid });

  } catch (error) {
    console.error("❌ FATAL CRASH IN PAYMENT ROUTE:", error);
    res.status(500).json({ success: false, message: "Server error during verification." });
  }
};

// 🔥 UPGRADED SPAWN DERBY ROUTE
export const spawnDerby = async (req, res) => {
  try {
    // 1. Parse the contenders array from the FormData string
    const contenders = JSON.parse(req.body.contenders);
    
    // 2. Updated helper to correctly process the Multer file array
    const processCrestUpload = async (fileArray) => {
      // Check if fileArray exists and has at least one file
      if (!fileArray || fileArray.length === 0) return null;
      
      const file = fileArray[0]; // Multer 'upload.fields' always returns arrays
      const result = await cloudinary.uploader.upload(file.path, { folder: 'yenuvia_crests' });
      
      // Clean up local temp file
      fs.unlinkSync(file.path); 
      return result.secure_url;
    };

    // 3. Explicitly grab the arrays from req.files using bracket notation
    const crestAUrl = req.files && req.files['crestA'] ? await processCrestUpload(req.files['crestA']) : null;
    const crestBUrl = req.files && req.files['crestB'] ? await processCrestUpload(req.files['crestB']) : null;

    // 4. Attach the Cloudinary URLs to the contenders object
    if (crestAUrl && contenders[0]) contenders[0].logoUrl = crestAUrl;
    if (crestBUrl && contenders[1]) contenders[1].logoUrl = crestBUrl;
    
    const parentMatch = await Match.findById(req.params.id);
    if (!parentMatch) return res.status(404).json({ success: false, message: "Directive not found." });

    // 5. Save the new Derby to MongoDB (Now with logoUrls!)
    const newDerby = await Match.create({
      directive: parentMatch.directive,
      league: parentMatch.league,
      startTime: new Date(),
      endTime: parentMatch.endTime, 
      status: "LIVE",
      contenders: contenders,
      totalPool: 0, 
      parentMatchId: parentMatch._id 
    });

    const io = getIO();
    io.emit("new_match", { message: "A new Derby has begun!" });

    res.status(200).json({ success: true, message: "Fixture Spawned!", match: newDerby });
  } catch (error) {
    console.error("Spawn Derby Error:", error);
    res.status(500).json({ success: false, message: "Failed to spawn fixture." });
  }
};

export const getRoundWinners = async (req, res) => {
  try {
    const completedDerbies = await Match.find({ 
      parentMatchId: req.params.id, 
      status: "COMPLETED" 
    }).populate("contenders.artistId").populate("contenders.workId");

    const advancingDrafts = [];
    
    completedDerbies.forEach(derby => {
      let winnerData = derby.contenders.find(c => 
        c.isWinner === true || 
        (derby.winner && c._id.toString() === derby.winner.toString())
      );

      if (!winnerData && derby.contenders.length > 0) {
          winnerData = derby.contenders.sort((a, b) => b.totalStaked - a.totalStaked)[0];
      }

      if (winnerData && winnerData.workId) {
        advancingDrafts.push({
          _id: winnerData.workId._id,
          school: winnerData.school,
          artistId: winnerData.artistId,
          mediaUrls: winnerData.workId.mediaUrls || [], 
          type: winnerData.workId.type || "video"
        });
      }
    });

    res.status(200).json({ success: true, drafts: advancingDrafts });
  } catch (error) {
    console.error("Winners Error:", error);
    res.status(500).json({ success: false, message: "Failed to load winners." });
  }
};