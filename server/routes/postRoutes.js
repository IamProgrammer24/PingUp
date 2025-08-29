import express from "express";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";
import {
  addPost,
  getFeedPosts,
  likePost,
} from "../controllers/postController.js";

const postRouter = express.Router();

// Route to add a post (with up to 4 images)
postRouter.post("/add", upload.array("images", 4), protect, addPost);

// Route to get feed posts for authenticated user
postRouter.get("/feed", protect, getFeedPosts);

// Route to like or unlike a post
postRouter.post("/like", protect, likePost);

// ✅ Export the router
export default postRouter;
