import express from "express"; // ✅ You forgot to import express
import { upload } from "../configs/multer.js"; // ✅ Ensure correct import path and extension
import { addUserStory, getStories } from "../controllers/storyController.js";
import { protect } from "../middlewares/auth.js";

const storyRouter = express.Router(); // ✅ Fixed typos: 'cosnt' → 'const', 'router()' → 'Router()'

// Routes
storyRouter.post("/create", protect, upload.single("media"), addUserStory); // ✅ Fixed order
storyRouter.get("/get", protect, getStories);

export default storyRouter;
