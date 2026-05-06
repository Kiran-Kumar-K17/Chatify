import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateProfilePicture,
} from "../controllers/user.controllers.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getMe);
router.put("/profile/picture", protect, updateProfilePicture);

export default router;
