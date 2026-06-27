import Settings from "../models/Settings.js";

// Get current billboard settings
// In getBillboardSettings controller
export const getBillboardSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ billboardMode: "community" });
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Update billboard settings
export const updateBillboardSettings = async (req, res) => {
  try {
    const { billboardMode, artistId } = req.body;
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings({ billboardMode, artistId });
    } else {
      settings.billboardMode = billboardMode;
      settings.artistId = billboardMode === "artist" ? artistId : null;
    }

    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
