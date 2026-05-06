import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
} from "../controllers/user.controllers.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);

export default router;
