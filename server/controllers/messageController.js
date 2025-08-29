import imagekit from "../configs/imageKit.js";
import fs from "fs";
import Message from "../models/message.js";

// Create an empty object to store SSE connections
const connections = {};

// Controller function for the SSE endpoint
export const sseController = (req, res) => {
  const { userId } = req.params;
  console.log("New client connected:", userId);

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Add the client's response object to the connections object
  connections[userId] = res;

  // Send an initial event to the client
  res.write(`event: log\ndata: Connected to SSE stream\n\n`);

  // Handle client disconnection
  req.on("close", () => {
    delete connections[userId];
    console.log("Client disconnected:", userId);
  });
};

// send Message

export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, text } = req.body;
    const image = req.file;

    let media_url = "";
    let message_type = image ? "image" : "text";

    // Upload image if present
    if (message_type === "image") {
      const fileBuffer = fs.readFileSync(image.path); // ✅ fixed typo: readFileSync
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: image.originalname,
      });

      media_url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });
    }

    // Create the message
    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
    });

    // Respond to sender
    res.json({
      success: true,
      message,
    });

    // Send message in real-time via SSE to recipient
    const messageWithUserData = await Message.findById(message._id).populate(
      "from_user_id"
    );

    if (connections[to_user_id]) {
      connections[to_user_id].write(
        `event: message\ndata: ${JSON.stringify(messageWithUserData)}\n\n`
      );
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Get Chat Messages
export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    }).sort({ createdAt: 1 }); // Oldest first (chat style)

    // Mark all incoming messages as seen
    await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId, seen: false },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Recent Messages (to the current user)
export const getUserRecentMessages = async (req, res) => {
  try {
    const { userId } = req.auth();

    const messages = await Message.find({ to_user_id: userId })
      .populate("from_user_id to_user_id")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
