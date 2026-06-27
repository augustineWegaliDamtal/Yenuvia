import cron from "node-cron";
import User from "../models/userModel.js";
import { getIO } from "../socket/socketManager.js";

export const startSubscriptionCron = () => {
  // ⏰ This cron expression means: Run every day at Midnight
  // (For testing, you can change it to "* * * * *" to run every minute)
  cron.schedule("* * * * *", async () => {
    console.log("⏳ CRON WAKING UP: Checking for expired Pro subscriptions...");

    try {
      const now = new Date();

      // 1. Find everyone who is verified BUT their expiry date is in the past
      const expiredUsers = await User.find({
        verified: true,
        subscriptionExpiry: { $lte: now }
      });

      if (expiredUsers.length === 0) {
        console.log("✅ CRON: No subscriptions expired today. Going back to sleep.");
        return;
      }

      console.log(`🚨 CRON: Found ${expiredUsers.length} expired subscriptions. Revoking Blue Ticks...`);

      // 2. Loop through them and revoke the tick
      for (const user of expiredUsers) {
        user.verified = false;
        await user.save();

        // ⚡ 3. SHOUT TO THE ARENA: Strip the tick in real-time!
        const io = getIO();
        io.emit("artist_verification_updated", { 
          artistId: user._id, 
          verified: false 
        });

        console.log(`📉 Revoked tick for user: ${user.username}`);
      }

      console.log("✅ CRON: All expired ticks removed successfully.");

    } catch (error) {
      console.error("❌ CRON ERROR: Failed to process expirations:", error);
    }
  });
};