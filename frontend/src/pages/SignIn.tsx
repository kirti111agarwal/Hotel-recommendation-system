import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import { useAppContext } from "../contexts/AppContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import OTPVerification from "../components/OTPVerification"; // ✅ import component


export type SignInFormData = {
  email: string;
  password: string;
};

const SignIn = () => {
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [isOtpStep, setIsOtpStep] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<SignInFormData>();

  // Step 1: Login with email + password
  const loginMutation = useMutation(apiClient.signIn, {
    onSuccess: async (_data, variables) => {
      setUserEmail(variables.email); // store email for OTP
      setIsOtpStep(true); // show OTP screen instead of navigating
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "ERROR" });
    },
  });

  const onSubmit = handleSubmit((data) => {
    loginMutation.mutate(data);
  });

  // Step 2: Verify OTP
  const verifyOtp = async (otp: string) => {
    try {
      await apiClient.verifyOTP({ email: userEmail, otp });
      showToast({ message: "Login Successful!", type: "SUCCESS" });
      await queryClient.invalidateQueries("validateToken");
      navigate(location.state?.from?.pathname || "/");
    } catch (err: any) {
      showToast({ message: err.message || "Invalid OTP", type: "ERROR" });
      setIsOtpStep(false);       // go back to login form
      setUserEmail("");          // clear stored email
      navigate("/sign-in")
    }
  };

  // ✅ Show OTP page if login successful
  if (isOtpStep) {
    return <OTPVerification email={userEmail} onVerifyOTP={verifyOtp} />;
  }

  // Otherwise show login form
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <h2 className="text-3xl font-bold">Sign In</h2>
      <label className="text-gray-700 text-sm font-bold flex-1">
        Email
        <input
          type="email"
          className="border rounded w-full py-1 px-2 font-normal"
          {...register("email", { required: "This field is required" })}
        />
        {errors.email && (
          <span className="text-red-500">{errors.email.message}</span>
        )}
      </label>
      <label className="text-gray-700 text-sm font-bold flex-1">
        Password
        <input
          type="password"
          className="border rounded w-full py-1 px-2 font-normal"
          {...register("password", {
            required: "This field is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
        />
        {errors.password && (
          <span className="text-red-500">{errors.password.message}</span>
        )}
      </label>
      <span className="flex items-center justify-between">
        <span className="text-sm">
          Not Registered?{" "}
          <Link className="underline" to="/register">
            Create an account here
          </Link>
        </span>
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 font-bold hover:bg-blue-500 text-xl"
        >
          Login
        </button>
      </span>
    </form>
  );
};

export default SignIn;
