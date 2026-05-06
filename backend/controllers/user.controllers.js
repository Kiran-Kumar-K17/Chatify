import User from "../models/user.models.js";
import { generateToken } from "../utils/jwt.js";
import cloudinary from "../lib/cloudinary.js";

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    const user = await User.create({
      name,
      email,
      password,
    });
    const userResponse = user.toObject();
    delete userResponse.password;
    res
      .status(201)
      .json({ message: "User registered successfully", userResponse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(400)
        .json({ message: "Account not found create an account" });
    }
    const isMatch = await existingUser.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = generateToken(existingUser._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    const userResponse = existingUser.toObject();
    delete userResponse.password;
    res.status(200).json({ message: "Login successful", userResponse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logoutUser = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get current authenticated user ────────────────────────────────
const getMe = async (req, res) => {
  try {
    // req.user is already populated by the protect middleware (no password)
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Upload / replace profile picture ──────────────────────────────
const MAX_AVATAR_BASE64_BYTES = 3 * 1024 * 1024; // 3 MB raw → ~4 MB base64

const updateProfilePicture = async (req, res) => {
  try {
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res.status(400).json({ message: "No image provided" });
    }
    if (!profilePicture.startsWith("data:image/")) {
      return res.status(400).json({ message: "Invalid image format" });
    }
    if (Buffer.byteLength(profilePicture, "utf8") > MAX_AVATAR_BASE64_BYTES) {
      return res.status(400).json({ message: "Image is too large (max 2 MB)" });
    }

    // Delete old Cloudinary asset if one exists
    const user = await User.findById(req.user.id);
    if (user.profilePicture && user.profilePicture.includes("cloudinary")) {
      const publicId = user.profilePicture
        .split("/")
        .slice(-2)
        .join("/")
        .replace(/\.[^.]+$/, "");
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }

    // Upload new avatar
    const uploadResult = await cloudinary.uploader.upload(profilePicture, {
      folder: "chat-app/avatars",
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: uploadResult.secure_url },
      { new: true },
    ).select("-password");

    res.status(200).json({
      message: "Profile picture updated",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: error.message });
  }
};

export { registerUser, loginUser, logoutUser, getMe, updateProfilePicture };
