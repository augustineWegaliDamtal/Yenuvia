import User from "../models/userModel.js";
import Work from "../models/Work.js";

export const getArtistById = async (req, res) => {
  try {
    const artist = await User.findOne({ _id: req.params.id, role: "artist" });
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" });
    }

    // 🕵️ THE EXPIRY CHECK (Add this block)
    if (artist.verified && artist.subscriptionExpiry) {
      const today = new Date();
      const expiry = new Date(artist.subscriptionExpiry);

      if (today > expiry) {
        artist.verified = false;
        artist.subscriptionExpiry = null;
        await artist.save(); // 💾 This saves the "Expired" status to MongoDB
        console.log(`⚠️ Artist ${artist.username} Pro status expired.`);
      }
    }

    // ✅ Use artistId (not artist)
    const works = await Work.find({ artistId: artist._id });

    res.json({
      success: true,
      user: {
        ...artist.toObject(),
        works,
      },
    });
  } catch (err) {
    console.error("Error fetching artist:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// controllers/artistController.js
export const getAllArtists = async (req, res) => {
  try {
    const artists = await User.find({ role: "artist" })
      .select("username email avatar verified");
    res.json({ success: true, artists });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
