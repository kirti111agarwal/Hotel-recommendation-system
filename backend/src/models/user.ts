import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserType } from "../shared/types";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ["user", "hotel owner", "admin"], required: true },
  clickedHotels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hotel" }],
  //Add these two fields for email-based OTP
  emailOTP: { type: String, required: false },
  otpExpires: { type: Date, required: false },      // stores expiration time
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

const User = mongoose.model<UserType & mongoose.Document>("User", userSchema);

export default User;
