import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/test";
console.log("Connecting to:", MONGO_URL);

async function createAdmin() {
  await mongoose.connect(MONGO_URL);
  const email = "kirti111garwal@gmail.com"//"dilippoudel466@gmail.com";
  const password = "123456"//"123456";
  const firstName = "Admin";
  const lastName = "User";
  const role = "admin";

  const existing = await User.findOne({ email });
  if (existing) {
    await User.deleteOne({ email });
    console.log("Existing admin user deleted.");
  }

  const user = new User({ email, password, firstName, lastName, role });
  await user.save();
  console.log("Admin user created:", email);
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
}); 