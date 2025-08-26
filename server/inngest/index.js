import { Inngest } from "inngest";
import User from "../models/User.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "pingup-app" });

// Inngest Function to save user data to database

// const syncUserCreation = inngest.createFunction(
//   { id: "sync-user-from-clerk" },
//   { event: "clerk/user.created" },
//   async (event) => {
//     const { id, first_name, last_name, email_addresses, image_url } =
//       event.data;
//     let username = email_addresses[0].email_address.split("@")[0];

//     // Check availability of username
//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       username = username + Math.floor(Math.random() * 10000);
//     }

//     const userData = {
//       _id: id,
//       email: email_addresses[0].email_address,
//       full_name: `${first_name} ${last_name}`,
//       profile_picture: image_url,
//       username,
//     };
//     console.log("📥 Clerk user.created event received:", event.data);
//     console.log("👉 Creating user with data:", userData);

//     await User.create(userData);
//   }
// );

const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      const { id, first_name, last_name, email_addresses, image_url } =
        event.data;

      // ✅ Safely get the first email address
      const email =
        email_addresses?.[0]?.email_address || "no-email@example.com";

      // ✅ Generate a base username
      let username = email.split("@")[0];

      // ✅ Check for username conflict
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        username += Math.floor(Math.random() * 10000);
      }

      // ✅ Build user data safely
      const userData = {
        _id: id,
        email,
        full_name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
        profile_picture: image_url,
        username,
      };

      console.log("👉 Creating user with data:", userData);

      const createdUser = await User.create(userData);
      console.log("✅ User created:", createdUser);
    } catch (err) {
      console.error("❌ Error creating user:", err.message);
    }
  }
);

// Inngest Function to update user data in database
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async (event) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const updateUserData = {
      email: email_addresses[0].email_address,
      full_name: `${first_name} ${last_name}`,
      profile_picture: image_url,
    };

    await User.findByIdAndUpdate(id, updateUserData);
  }
);

// Inngest Function to delete user data in database
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async (event) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  }
);

// Export Inngest functions
export const functions = [syncUserCreation, syncUserUpdation, syncUserDeletion];
