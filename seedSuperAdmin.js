import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./api/models/userModel.js";

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_DB);
    console.log("✅ Connected to MongoDB");

    // Hash password
    const hashedPassword = await bcrypt.hash("salma.com", 10);

    // Check if superadmin already exists
    const existing = await User.findOne({ email: "salmaalhassan@gmail.com" });
    if (existing) {
      console.log("⚠️ Superadmin already exists, skipping seeding");
      mongoose.connection.close();
      return;
    }

    // Create new superadmin
    const superadmin = new User({
      username: "Salma Alhassan",
      email: "salmaalhassan@gmail.com",
      password: hashedPassword,
      role: "superadmin",
      avatar: "",
    });

    await superadmin.save();
    console.log("✅ Superadmin seeded successfully");

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error seeding superadmin:", err.message);
    mongoose.connection.close();
  }
};

seedSuperAdmin();
