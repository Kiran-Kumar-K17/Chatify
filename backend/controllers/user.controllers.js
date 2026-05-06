import User from "../models/user.models.js";
import { generateToken } from "../utils/jwt.js";

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
      sameSite: "strict",
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
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { registerUser, loginUser, logoutUser };
