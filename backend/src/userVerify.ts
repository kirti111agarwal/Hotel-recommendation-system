import axios from "axios";
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

const UserVerify = () => {
  let [query] = useSearchParams();

  let navigate = useNavigate();

  let token = query.get("token");

  let verifyEmail = async () => {
    try {
      let result = await axios({
        url: "http://localhost:5000/hospital-user/verify-email",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(result);
      navigate("/login/user");
      toast.success("Account Verified. Now you can login");
    } catch (error) {
      console.log(error.message);
    }
  };
  useEffect(() => {
    verifyEmail();
  }, []);

  // Add a button to manually navigate
  return <div>verifyEmails</div>;
};

export default UserVerify;
