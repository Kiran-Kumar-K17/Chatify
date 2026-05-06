import jwt from "jsonwebtoken";
import User from "../models/user.models.js";
import "dotenv/config.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.headers.cookie
      ?.split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return next(new Error("Authentication token not found"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      console.log("Socket connection rejected: Invalid token");
      return next(new Error("Unauthorized - Invalid Token"));
    }
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log("Socket connection rejected: User not found");
      return next(new Error("User not found"));
    }
    socket.user = user;
    socket.userId = user._id.toString();
    console.log(`Socket authenticated for user: ${user.name} (${user._id})`);
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    return next(new Error("Unauthorized - Authentication Error"));
  }
};
