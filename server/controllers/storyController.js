import fs from "fs";
import Stery from "../models/story.js";
import imagekit from "../configs/imageKit.js";
import { inngest } from "../inngest/index.js";
import User from "../models/User.js";

// Add User Story
// export const addUserStory = async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const { content, media_type, background_color } = req.body;
//     const media = req.file;

//     let media_url = null;

//     // Upload media to ImageKit if it's an image or video

//     if (media_type === "image" || media_type === "video") {
//       const fileBuffer = fs.readFileSync(media.path);

//       const response = await imagekit.upload({
//         file: fileBuffer,
//         fileName: media.originalname,
//       });

//       media_url = response.url;
//     }

//     // Create story
//     const story = await Story.create({
//       user: userId,
//       content,
//       media_url,
//       media_type,
//       background_color,
//     });

//     // Schedule story deletion after 24 hours
//     await inngest.send({
//       name: "app/story.delete",
//       data: {
//         storyId: story._id,
//       },
//       delay: "24h",
//     });

//     res.json({
//       success: true,
//       story, // Optional: return the created story
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const addUserStory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, media_type = "text", background_color } = req.body;
    const media = req.file;

    let media_url = null;

    // ✅ Step 1: Upload media (if media_type is image/video and file exists)
    if ((media_type === "image" || media_type === "video") && media) {
      try {
        const fileBuffer = await fs.promises.readFile(media.path);

        const response = await imagekit.upload({
          file: fileBuffer,
          fileName: media.originalname,
        });

        media_url = response.url;

        // ✅ Clean up the uploaded file after ImageKit upload
        await fs.promises.unlink(media.path);
      } catch (uploadErr) {
        console.error("❌ Media upload failed:", uploadErr.message);
        return res.status(400).json({
          success: false,
          message: "Media upload failed",
        });
      }
    }

    // ✅ Step 2: Create story
    const story = await Stery.create({
      user: userId,
      content,
      media_url,
      media_type,
      background_color,
    });

    // ✅ Step 3: Schedule story deletion after 24 hours
    await inngest.send({
      name: "app/story.delete",
      data: { storyId: story._id },
      delay: "24h",
    });

    // ✅ Step 4: Respond with success
    res.status(201).json({
      success: true,
      story,
    });
  } catch (error) {
    console.error("❌ Server error in addUserStory:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
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
    const stories = await Stery.find({
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
