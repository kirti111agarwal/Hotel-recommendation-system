import { useState } from "react";

type OTPProps = {
  email: string;
  onVerifyOTP: (otp: string) => void;
};

const OTPVerification = ({ email, onVerifyOTP }: OTPProps) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await onVerifyOTP(otp);
    } catch (err: any) {
      setMessage(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 max-w-sm mx-auto mt-20 text-center"
    >
      <h2 className="text-2xl font-bold">Enter OTP</h2>
      <p>We sent a code to {email}</p>
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="border rounded p-2"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white p-2 font-bold hover:bg-blue-500"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>
      {message && <p className="text-red-500 mt-2">{message}</p>}
    </form>
  );
};

export default OTPVerification;
