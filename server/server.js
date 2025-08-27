import express from "express";
import { serve } from "inngest/express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { inngest } from "./inngestClient.js";

const app = express();

await connectDB();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/api/inngest", async (req, res) => {
  const body = req.body;

  console.log("📩 Received Clerk webhook:", body);

  // Forward event to Inngest with correct shape
  await inngest.send({
    name: body.name, // e.g. "clerk/user.created"
    data: body.data, // actual user data ONLY
  });

  res.status(200).send("OK");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
