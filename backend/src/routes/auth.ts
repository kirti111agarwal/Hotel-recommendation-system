import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import User from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import verifyToken from "../middleware/auth";

// Import your email OTP utility
import { sendEmailOTP } from "../utils/mailer";

const router = express.Router();

// Helper function to generate 6-digit OTP
const generateOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString();

// ===== LOGIN: request OTP =====
router.post(
  "/login",
  [
    check("email", "Valid email is required").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({ min: 6 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

      // Generate OTP
      const otp = generateOTP();
      user.emailOTP = otp;
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await user.save();

      // Send OTP email
      await sendEmailOTP(email, otp);

      res.status(200).json({
        message: "OTP sent to your email. Please verify to complete login.",
        email: user.email,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

// ===== VERIFY OTP & LOGIN =====
router.post("/verify-otp", async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Safe checks for optional fields
    if (!user.emailOTP || !user.otpExpires) {
      return res.status(400).json({ message: "No OTP requested" });
    }
    if (user.otpExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    if (user.emailOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP correct → generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET_KEY as string,
      { expiresIn: "1d" }
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Clear OTP
    user.emailOTP = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      userId: user._id,
      email: user.email,
      role: user.role,
      message: "Login successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// ===== VALIDATE TOKEN =====
router.get("/validate-token", verifyToken, (req: Request, res: Response) => {
  res.status(200).json({
    userId: req.userId,
    role: req.userRole,
    message: "Token is valid",
  });
});

// ===== LOGOUT =====
router.post("/logout", (req: Request, res: Response) => {
  res.cookie("auth_token", "", { expires: new Date(0), httpOnly: true });
  res.send({ message: "Logged out successfully" });
});

export default router;
