import Message from "../models/message.models.js";
import User from "../models/user.models.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const filterdUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("name email");

    return res.status(200).json(filterdUsers);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return res.status(500).json({ error: "Failed to fetch contacts" });
  }
};

export const getMessagesById = async (req, res) => {
  try {
    const myId = req.user.id;
    const recipientId = req.params.id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, recipientId: recipientId },
        { senderId: recipientId, recipientId: myId },
      ],
    });
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// ~6.7 MB base64 upper bound for a 5 MB raw image
const MAX_IMAGE_BASE64_BYTES = 7 * 1024 * 1024;

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user.id;

    // ── validation ──────────────────────────────────────────────────
    if (!text && !image) {
      return res
        .status(400)
        .json({ error: "Message text or image is required" });
    }
    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ error: "You cannot send a message to yourself" });
    }
    if (text && text.length > 500) {
      return res
        .status(400)
        .json({ error: "Message text must be 500 characters or fewer" });
    }
    if (image) {
      // Must be a base64 data URI of an image
      if (!image.startsWith("data:image/")) {
        return res.status(400).json({ error: "Invalid image format" });
      }
      if (Buffer.byteLength(image, "utf8") > MAX_IMAGE_BASE64_BYTES) {
        return res.status(400).json({ error: "Image is too large (max 5 MB)" });
      }
    }

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    // ── Cloudinary upload ────────────────────────────────────────────
    let imageUrl;
    if (image) {
      const uploadResult = await cloudinary.uploader.upload(image, {
        folder: "chat-app/messages",
        resource_type: "image",
        // Strip metadata and auto-format for web delivery
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      });
      imageUrl = uploadResult.secure_url;
    }

    // ── Save & emit ──────────────────────────────────────────────────
    const messageData = {
      senderId,
      recipientId: receiverId,
      ...(text && { text: text.trim() }),
      ...(imageUrl && { image: imageUrl }),
    };

    const newMessage = await Message.create(messageData);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
};

export const getMessagePartners = async (req, res) => {
  try {
    const myId = req.user.id;
    const messages = await Message.find({
      $or: [{ senderId: myId }, { recipientId: myId }],
    }).select("senderId recipientId");

    const chatPartnersIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === myId.toString()
            ? msg.recipientId.toString()
            : msg.senderId.toString(),
        ),
      ),
    ];

    const chatPartners = await User.find({
      _id: { $in: chatPartnersIds },
    }).select("-password");
    return res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error fetching chat partners:", error);
    return res.status(500).json({ error: "Failed to fetch chat partners" });
  }
};
