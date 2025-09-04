import nodemailer from "nodemailer";

export async function sendEmailOTP(toEmail: string, otp: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // your app password
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Your Login Verification Code",
    text: `Your verification code is: ${otp}\nIt will expire in 5 minutes.`,
  });

  console.log(`OTP sent to ${toEmail}: ${otp}`); // optional for testing
}
