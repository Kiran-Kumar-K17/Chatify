import { Router } from "express";
import {
  getAllContacts,
  getMessagesById,
  getMessagePartners,
  sendMessage,
} from "../controllers/message.controllers.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);
router.get("/contacts", getAllContacts);
router.get("/partners", getMessagePartners);
router.get("/:id/messages", getMessagesById);
router.post("/:id/send", sendMessage);

export default router;
