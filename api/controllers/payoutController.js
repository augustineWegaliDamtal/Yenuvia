import { Payout } from "../models/Payout.js"; // Ensure you created this model earlier

// @desc    Get all pending payout requests for Admin
// @route   GET /api/payouts/admin/pending
export const getPendingPayouts = async (req, res) => {
  try {
    // Only fetch requests that haven't been paid yet
    const requests = await Payout.find({ status: "PENDING" })
      .populate("userId", "username email") // Shows you who is asking
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a payout as completed after manual MoMo transfer
// @route   PUT /api/payouts/approve/:id
export const approvePayout = async (req, res) => {
  try {
    const request = await Payout.findByIdAndUpdate(
      req.params.id, 
      { status: "COMPLETED" },
      { new: true }
    );
    res.status(200).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};