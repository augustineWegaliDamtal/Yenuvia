import bcryptjs from "bcryptjs";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { errorHandler } from "../utils/error.js";

// -------------------- Artist Signup --------------------
export const Signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  // 1. Validation check before hitting the DB
  if (!username || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Please fill in all fields (username, email, and password)." 
    });
  }

  try {
    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: "artist", // explicitly set for Yenuvia
    });

    await newUser.save();
    res.status(201).json({ success: true, message: "Artist created successfully" });
    
  } catch (error) {
    // 2. Catch MongoDB duplicate key error (e.g., email or username already taken)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({ 
        success: false, 
        message: `That ${field} is already registered on Yenuvia.` 
      });
    }

    // 3. Pass off any other unexpected bugs to your global error middleware
    next(errorHandler(500, error.message));
  }
};

// -------------------- Signin (any role) --------------------
export const Signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(401, "Invalid credentials"));

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, "Invalid password"));

    const normalizedRole = validUser.role.toLowerCase();
    const token = jwt.sign(
      { id: validUser._id, role: normalizedRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...rest } = validUser._doc;
    rest.role = normalizedRole;

    const isProduction = process.env.NODE_ENV === "production";

res.cookie("access_token", token, {
  httpOnly: true,
  secure: isProduction ? true : false,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
})
      .status(200)
      .json({ success: true, user: rest, token });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

export const Google = async (req, res, next) => {
  try {
    // 🔥 FIX 1: Change 'photo' to 'avatar'
    const { name, email, avatar } = req.body; 
    let user = await User.findOne({ email });

    if (user) {
      const token = jwt.sign(
        { id: user._id, role: user.role.toLowerCase() },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      const { password, ...userData } = user._doc;
      userData.role = user.role.toLowerCase();
      return 
      const isProduction = process.env.NODE_ENV === "production";

res.cookie("access_token", token, {
  httpOnly: true,
  secure: isProduction ? true : false,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
})
        .status(200)
        .json({ success: true, user: userData, token });
    }

    const generatedPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcryptjs.hash(generatedPassword, 10);
    const username = name.split(" ").join("").toLowerCase() + Math.random().toString(36).slice(-4);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      // 🔥 FIX 2: Pass the avatar directly
      avatar, 
      role: "artist",
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const { password, ...userData } = newUser._doc;
    userData.role = newUser.role.toLowerCase();

    return 
    const isProduction = process.env.NODE_ENV === "production";

res.cookie("access_token", token, {
  httpOnly: true,
  secure: isProduction ? true : false,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
})
      .status(200)
      .json({ success: true, user: userData, token });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// -------------------- Signout --------------------
export const signOut = async (req, res, next) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("access_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    res.status(200).json({ success: true, message: "User signed out successfully" });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// -------------------- Admin Signup (superadmin only) --------------------
export const AdminSignup = async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    if (req.user?.role.toLowerCase() !== "superadmin") {
      return next(errorHandler(403, "Access denied. Only superadmins can create admins."));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return next(errorHandler(400, "Email already in use"));

    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newAdmin = new User({ username, email, password: hashedPassword, role: "admin" });
    await newAdmin.save();

    const { password: _, ...userData } = newAdmin._doc;
    userData.role = "admin";

    // 🔥 FIX: Removed token generation entirely. Just return success!
    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      user: userData,
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// -------------------- Admin Signin --------------------
export const AdminSignin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return next(errorHandler(404, "Admin not found"));
    if (user.role.toLowerCase() !== "admin") return next(errorHandler(403, "Access denied. Not an admin."));

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) return next(errorHandler(400, "Invalid credentials"));

    const token = jwt.sign({ id: user._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const { password: _, ...userData } = user._doc;
    userData.role = "admin";

    const isProduction = process.env.NODE_ENV === "production";

res.cookie("access_token", token, {
  httpOnly: true,
  secure: isProduction ? true : false,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
}).status(200).json({ success: true, message: "Admin signin successful", user: userData });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// -------------------- SuperAdmin Signin --------------------

export const SuperAdminSignin = async (req, res, next) => {
  const { email, password } = req.body;
console.log("Signin attempt with email:", email);

  try {
    // Find user by email
    const user = await User.findOne({ email });
    console.log("Fetched user from DB:", user);

    if (!user) return next(errorHandler(404, "Superadmin not found"));

    // Normalize role and enforce superadmin check
    const normalizedRole = user.role.toLowerCase();
    if (normalizedRole !== "superadmin") {
      return next(errorHandler(403, "Access denied. Not a superadmin."));
    }

    // Verify password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) return next(errorHandler(400, "Invalid credentials"));

    // Generate JWT (only id, role comes from DB later)
    const token = jwt.sign(
     { id: user._id, role: "superadmin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
const decoded = jwt.decode(token); 
console.log("Issued JWT payload:", decoded);
    // Prepare user data without password
    const { password: _, ...userData } = user._doc;
    userData.role = "superadmin"; // explicitly set

    const isProduction = process.env.NODE_ENV === "production";

res.cookie("access_token", token, {
  httpOnly: true,
  secure: isProduction ? true : false,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
})
      .status(200)
      .json({
        success: true,
        message: "Superadmin signin successful",
        user: userData,
        token,
      });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};
