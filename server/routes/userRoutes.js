import express from "express";
import {
  acceptConnectionRequest,
  discoverUsers,
  followUsers,
  getUserConnection,
  getUserData,
  sendConnectionRequest,
  unfollowUsers,
  updateUserData,
} from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";
import { upload } from "../configs/multer.js";

const userRouter = express.Router();

userRouter.get("/data", protect, getUserData);

userRouter.post(
  "/update",
  protect,
  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  updateUserData
);

userRouter.post("/discover", protect, discoverUsers);
userRouter.post("/follow", protect, followUsers);
userRouter.post("/unfollow", protect, unfollowUsers);
userRouter.post("/connect", protect, sendConnectionRequest);
userRouter.post("/accept", protect, acceptConnectionRequest);
userRouter.get("/connections", protect, getUserConnection);

export default userRouter;
