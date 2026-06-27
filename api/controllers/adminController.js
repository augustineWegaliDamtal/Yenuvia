import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import systemLogModel from "../models/systemLogModel.js";
import { errorHandler } from "../utils/error.js";

// --- 🛡️ SUPERADMIN ACTIONS ---

export const createAdmin = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) return next(errorHandler(400, "User already exists"));

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newAdmin = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "admin",
    });

    await newAdmin.save();

    await systemLogModel.create({
      user: req.user.id,
      action: "CREATE_USER",
      details: `Created ${newAdmin.role}: ${newAdmin.username}`,
    });

    const { password: pass, ...adminData } = newAdmin._doc;
    res.status(201).json({ success: true, admin: adminData });
  } catch (error) {
    next(error);
  }
};

export const getAdmins = async (req, res, next) => {
  try {
    // Fetch all users to manage the global Arena identity
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    // ✅ FIX: Calculating counts to match exactly what AdminList.jsx expects
    const totalAdmins = users.filter((u) => u.role === "admin").length;
    const totalSuperAdmins = users.filter((u) => u.role === "superadmin").length;
    const totalArtists = users.filter((u) => u.role === "artist").length;

    res.status(200).json({
      success: true,
      admins: users, // Frontend maps 'data.admins'
      counts: {
        admins: totalAdmins,
        superadmins: totalSuperAdmins,
        artists: totalArtists,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.password) {
      updateData.password = bcrypt.hashSync(updateData.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true }
    ).select("-password");

    if (!updatedUser) return next(errorHandler(404, "User not found"));

    await systemLogModel.create({
      user: req.user.id,
      action: "UPDATE_USER",
      details: `Updated user: ${updatedUser.username}`,
    });

    res.status(200).json({ success: true, admin: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Prevent SuperAdmin from accidentally deleting themselves
    if (id === req.user.id) return next(errorHandler(400, "You cannot delete your own root account"));

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) return next(errorHandler(404, "User not found"));

    await systemLogModel.create({
      user: req.user.id,
      action: "DELETE_USER",
      details: `Removed user: ${deletedUser.username}`,
    });

    res.status(200).json({ success: true, message: "User removed successfully" });
  } catch (error) {
    next(error);
  }
};

// --- 🔑 AUTH & PROFILE ---

export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ✅ FIX: Allow BOTH admins and superadmins to log in
    const admin = await User.findOne({ 
      email, 
      role: { $in: ["admin", "superadmin"] } 
    });

    if (!admin) return next(errorHandler(404, "Access Denied: Account not found"));

    const isPasswordValid = bcrypt.compareSync(password, admin.password);
    if (!isPasswordValid) return next(errorHandler(401, "Invalid Credentials"));

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await systemLogModel.create({
      user: admin._id,
      action: "LOGIN_SUCCESS",
      details: `${admin.role} ${admin.username} entered the Arena`,
    });

    const { password: pass, ...adminData } = admin._doc;

    // Set cookie for browser-based auth security
    res.cookie("access_token", token, { httpOnly: true }).status(200).json({
      success: true,
      token,
      admin: adminData,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await User.findById(req.params.id).select("-password");
    if (!admin) return next(errorHandler(404, "Profile not found"));
    res.status(200).json({ success: true, admin });
  } catch (error) {
    next(error);
  }
};


export const updateAdminProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 1. Prepare data to update (only allow specific fields)
    const updateData = {
      username: req.body.username,
      email: req.body.email,
    };

    // 2. Hash password if they are changing it
    if (req.body.password) {
      updateData.password = bcrypt.hashSync(req.body.password, 10);
    }

    // 🟢 3. THE IMAGE FIX: If Multer caught a file, save its path to the database!
    if (req.file) {
      updateData.avatar = `/uploads/${req.file.filename}`;
    }

    // 4. Update the database
    const updatedAdmin = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select("-password"); // Exclude password from the response

    if (!updatedAdmin) return next(errorHandler(404, "Profile not found"));

    // 5. Log the self-update action
    await systemLogModel.create({
      user: id,
      action: "UPDATE_PROFILE",
      details: `${updatedAdmin.role} ${updatedAdmin.username} updated their own profile`,
    });

    res.status(200).json({ success: true, admin: updatedAdmin });
  } catch (error) {
    next(error);
  }
};