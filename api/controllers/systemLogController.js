import SystemLog from "../models/systemLogModel.js";

// Create a new log entry
export const createLog = async (req, res) => {
  try {
    const { action, details } = req.body;

    const newLog = new SystemLog({
      user: req.user?.id || null, // superadmin/admin performing the action
      action,
      details,
      timestamp: new Date(),
    });

    await newLog.save();
    res.status(201).json({ success: true, log: newLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all logs
export const getLogs = async (req, res) => {
  try {
    const logs = await SystemLog.find()
      .populate("user", "username email role") // show user info
      .sort({ timestamp: -1 }); // newest first

    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a log (optional, for cleanup)
export const deleteLog = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLog = await SystemLog.findByIdAndDelete(id);

    if (!deletedLog) {
      return res.status(404).json({ success: false, message: "Log not found" });
    }

    res.status(200).json({ success: true, message: "Log deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
