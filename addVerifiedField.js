import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./api/models/userModel.js";


dotenv.config();


const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB);

    await User.updateMany(
      { verified: { $exists: false } },
      { $set: { verified: false } }
    );

    console.log("Verified field added to all users");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
