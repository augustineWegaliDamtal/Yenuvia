// controllers/challengeController.js

import Challenge from "../models/Challenge.js";

// Set or update the weekly challenge (admin/superadmin only)
export const setWeeklyChallenge = async (req, res) => {
  try {
    const { topic, description, startDate, endDate } = req.body;

    // Role check
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Ensure only one active challenge at a time
    await Challenge.updateMany({ active: true }, { active: false });

    const challenge = new Challenge({
      topic,
      description,
      startDate,
      endDate,
      createdBy: req.user._id,
      active: true,
    });

    await challenge.save();

    res.json({ success: true, challenge }); // ✅ fixed
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Fetch the active weekly challenge
export const getActiveChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({ active: true })
      .populate("createdBy", "username role");

    if (!challenge) {
      return res.json({ success: true, challenge: null });
    }

    res.json({ success: true, challenge });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
