import express from "express";
import { upload } from "../configs/multer.js";
import {
  getChatMessages,
  sendMessage,
  sseController,
} from "../controllers/messageController.js";
import { protect } from "../middlewares/auth.js";

const messageRouter = express.Router();

// SSE connection endpoint for real-time messages (using userId param)
messageRouter.get("/:userId", protect, sseController);

// Send a message (with optional image upload)
messageRouter.post("/send", protect, upload.single("image"), sendMessage);

// Get chat messages between users
messageRouter.post("/get", protect, getChatMessages);

export default messageRouter;
