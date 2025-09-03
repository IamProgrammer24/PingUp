import imagekit from "../configs/imageKit.js";
import { inngest } from "../inngest/index.js";
import Connection from "../models/connection.js";
import Post from "../models/post.js";
import User from "../models/User.js";
import fs from "fs";

// Get User Data using userId
export const getUserData = async (req, res) => {
  try {
    const { userId } = await req.auth();
    

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Update User Data
export const updateUserData = async (req, res) => {
  try {
    const { userId } = await req.auth();
    let { username, bio, location, full_name } = req.body;

    const tempUser = await User.findById(userId);
    if (!tempUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If username not provided, keep existing one
    if (!username) {
      username = tempUser.username;
    } else if (tempUser.username !== username) {
      const userExists = await User.findOne({ username });
      if (userExists) {
        // Username taken, fallback to original
        username = tempUser.username;
      }
    }

    const updatedData = {
      username,
      bio,
      location,
      full_name,
    };

    const profile = req.files?.profile?.[0];
    const cover = req.files?.cover?.[0];

    if (profile) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: profile.originalname,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: 512 },
        ],
      });

      updatedData.profile_picture = url;
    }

    if (cover) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: cover.originalname,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: 1280 },
        ],
      });

      updatedData.cover_photo = url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    res.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Discover Users
export const discoverUsers = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { input } = req.body;

    if (!input || input.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search input is required",
      });
    }

    const allUsers = await User.find({
      $or: [
        { username: new RegExp(input, "i") },
        { email: new RegExp(input, "i") },
        { full_name: new RegExp(input, "i") },
        { location: new RegExp(input, "i") },
      ],
    });

    const filteredUsers = allUsers.filter(
      (user) => user._id.toString() !== userId
    );

    res.json({
      success: true,
      users: filteredUsers,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Follow Users
export const followUsers = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { id } = req.body;

    if (userId === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const user = await User.findById(userId);
    const toFollow = await User.findById(id);

    if (!user || !toFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.following.includes(id)) {
      return res.status(400).json({
        success: false,
        message: "You are already following this user",
      });
    }

    user.following.push(id);
    await user.save();

    toFollow.followers.push(userId);
    await toFollow.save();

    res.json({
      success: true,
      message: "Now you are following this user",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Unfollow Users
export const unfollowUsers = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { id } = req.body;

    const user = await User.findById(userId);
    const toUnfollow = await User.findById(id);

    if (!user || !toUnfollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.following = user.following.filter((uid) => uid.toString() !== id);
    await user.save();

    toUnfollow.followers = toUnfollow.followers.filter(
      (fid) => fid.toString() !== userId
    );
    await toUnfollow.save();

    res.json({
      success: true,
      message: "You are no longer following this user",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Send Connection Request
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    // Prevent self-connections
    if (userId === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a connection request to yourself",
      });
    }

    // Check if user has sent more than 20 requests in the last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const connectionRequests = await Connection.find({
      from_user_id: userId,
      createdAt: { $gt: last24Hours },
    });

    if (connectionRequests.length >= 20) {
      return res.status(429).json({
        success: false,
        message:
          "You have sent more than 20 connection requests in the last 24 hours",
      });
    }

    // Check if users are already connected or request exists
    const existingConnection = await Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: id },
        { from_user_id: id, to_user_id: userId },
      ],
    });

    if (!existingConnection) {
      const newConnection = await Connection.create({
        from_user_id: userId,
        to_user_id: id,
      });

      await inngest.send({
        name: "app/connection-request",
        data: { connectionId: newConnection._id },
      });

      return res.status(201).json({
        success: true,
        message: "Connection request sent successfully",
      });
    }

    if (existingConnection.status === "accepted") {
      return res.status(409).json({
        success: false,
        message: "You are already connected with the user",
      });
    }

    return res.status(409).json({
      success: false,
      message: "Connection request is already pending",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

//Get user Connection
export const getUserConnection = async (req, res) => {
  try {
    const { userId } = await req.auth();

    const user = await User.findById(userId)
      .populate("followers")
      .populate("following");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Accepted connections involving the user
    const connections = await Connection.find({
      status: "accepted",
      $or: [{ from_user_id: userId }, { to_user_id: userId }],
    })
      .populate("from_user_id")
      .populate("to_user_id");

    // Pending connection requests *to* the user
    const pendingConnections = await Connection.find({
      to_user_id: userId,
      status: "pending",
    }).populate("from_user_id");

    res.json({
      success: true,
      connections, // 👈 This is retained
      followers: user.followers,
      following: user.following,
      pendingConnections: pendingConnections.map((c) => c.from_user_id),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

//Accept Connection Request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { id } = req.body; // `id` is the user who sent the request

    // Find the pending connection from `id` → `userId`
    const connection = await Connection.findOne({
      from_user_id: id,
      to_user_id: userId,
      status: "pending",
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found",
      });
    }

    // Update connection status to accepted
    connection.status = "accepted";
    await connection.save();

    // Update both users' connection lists if such field exists
    const user = await User.findById(userId);
    const fromUser = await User.findById(id);

    // Add each other to `connections` array only if not already there
    if (!user.connections.includes(id)) {
      user.connections.push(id);
      await user.save();
    }

    if (!fromUser.connections.includes(userId)) {
      fromUser.connections.push(userId);
      await fromUser.save();
    }

    return res.json({
      success: true,
      message: "Connection request accepted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Get User Profiles
export const getUserProfile = async (req, res) => {
  try {
    const { profileId } = req.body;
    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: "Profile ID is required",
      });
    }

    const profile = await User.findById(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const posts = await Post.find({ user: profileId }).populate("user");

    res.json({
      success: true,
      profile,
      posts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
