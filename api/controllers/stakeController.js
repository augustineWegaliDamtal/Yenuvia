import { Stake } from "../models/stakeModel.js";
import { Match } from "../models/matchModel.js";

export const getMyLedger = async (req, res) => {
  try {
    const history = await Stake.find({ userId: req.user.id })
      .populate("matchId", "directive status") // Pull in the match details
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("Ledger Error:", error);
    res.status(500).json({ success: false, message: "Failed to load ledger." });
  }
};



export const placePledge = async (req, res) => {
  try {
    const { matchId, contenderId, amount, reference } = req.body;

    // 1. Find the match
    const match = await Match.findById(matchId);
    if (!match || match.status !== "LIVE") {
      return res.status(400).json({ success: false, message: "Battle is closed or not found." });
    }

    // 2. Create the Stake record in the Patron's Ledger
    const newStake = new Stake({
      userId: req.user.id,
      matchId,
      contenderId,
      amount,
      status: "PENDING",
      // If you added 'reference' to your Stake schema, great. If not, mongoose will just ignore it.
    });
    await newStake.save();

    // 3. Update the Match's Total Bounty and the School's specific total
    match.totalPool += amount;
    
    match.contenders.forEach(c => {
      if (c._id.toString() === contenderId) {
        c.totalStaked += amount; // Add the GHS to this specific school
      }
    });

    match.markModified('contenders'); // Force Mongoose to save the array update
    await match.save();

    res.status(200).json({ success: true, message: "Pledge successfully registered!" });
  } catch (error) {
    console.error("Pledge Error:", error);
    res.status(500).json({ success: false, message: "Failed to process pledge." });
  }
};