import mongoose from "mongoose";

const sterySchema = new mongoose.Schema(
  {
    user: {
      type: String, // 🔒 Keeping as String (per your request)
      ref: "User",
      required: true,
    },
    content: {
      type: String,
    },
    media_url: {
      type: String,
    },
    media_type: {
      type: String,
      enum: ["text", "image", "video"],
    },
    views_count: [
      {
        type: String, // 🔒 Keeping as String
        ref: "User",
      },
    ],
    background_color: {
      type: String,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

const Stery = mongoose.model("Stery", sterySchema);
export default Stery;
