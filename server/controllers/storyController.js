import fs from "fs";
import Story from "../models/story.js";
import imagekit from "../configs/imageKit.js";
import { inngest } from "../inngest/index.js";

// Add User Story
export const addUserStory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, media_type, background_color } = req.body;
    const media = req.file;

    let media_url = null;

    // Upload media to ImageKit if it's an image or video
    
    if (media_type === "image" || media_type === "video") {
      const fileBuffer = fs.readFileSync(media.path);

      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: media.originalname,
      });

      media_url = response.url;
    }

    // Create story
    const story = await Story.create({
      user: userId,
      content,
      media_url,
      media_type,
      background_color,
    });

    // Schedule story deletion after 24 hours
    await inngest.send({
      name: "app/story.delete",
      data: {
        storyId: story._id,
      },
      delay: "24h",
    });

    res.json({
      success: true,
      story, // Optional: return the created story
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get User Stories
export const getStories = async (req, res) => {
  try {
    const { userId } = req.auth(); // Corrected: 'cosnt' to 'const'
    const user = await User.findById(userId); // Corrected method name

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // User connections and followings
    const userIds = [userId, ...user.connections, ...user.following]; // Fixed typo in 'connections'

    // Fetch stories
    const stories = await Story.find({
      user: { $in: userIds },
    })
      .populate("user")
      .sort({ createdAt: -1 }); // Corrected chaining and property names

    res.json({
      success: true,
      stories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
