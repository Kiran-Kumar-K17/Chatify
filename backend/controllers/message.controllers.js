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

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user.id;
    let imageUrl;

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
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ error: "Recipient not found" });
    }
    if (image) {
      const uploadResult = await cloudinary.uploader.upload(image, {
        folder: "chat-app",
        resource_type: "image",
      });
      imageUrl = uploadResult.secure_url;
    }

    const newMessage = new Message({
      senderId,
      recipientId: receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();
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
