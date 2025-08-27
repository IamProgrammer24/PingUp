import { inngest } from "../inngestClient.js";
import User from "../models/User.js"; // your DB user model

export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ data }) => {
    const { id, first_name, last_name, email_addresses, image_url } = data;

    let username = email_addresses[0].email_address.split("@")[0];

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      username = username + Math.floor(Math.random() * 10000);
    }

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      full_name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      profile_picture: image_url,
      username,
    };

    console.log("👉 Creating user:", userData);

    await User.create(userData);
  }
);
