import { Link } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import SignOutButton from "./SignOutButton";
import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import { FaUserCircle } from "react-icons/fa";
import { useState } from "react";

const Header = () => {
  const { isLoggedIn, userRole } = useAppContext();
  const [showProfile, setShowProfile] = useState(false);
  const { data: user } = useQuery("fetchCurrentUser", apiClient.fetchCurrentUser, { enabled: isLoggedIn });

  return (
    <div className="bg-[#5F9EA0] text-white py-10">
      <div className="container mx-auto flex justify-between">
        <span className="text-3xl text-green font-bold tracking-tight">
          <Link to="/">PrimeStays</Link>
        </span>
        <span className="flex space-x-2 items-center relative">
          {isLoggedIn ? (
            <>
              {userRole === "user" && (
                <Link
                  className="flex items-center text-white px-3 font-bold hover:bg-red-600"
                  to="/my-bookings"
                >
                  My Bookings
                </Link>
              )}
              {userRole === "hotel owner" && (
                <Link
                  className="flex items-center text-white px-3 font-bold hover:bg-blue-600"
                  
                  to="/my-hotels"
                >
                  My Hotels
                </Link>
              )}
              {userRole === "admin" && (
                <Link
                  className="flex items-center text-white px-3 font-bold hover:bg-blue-600"
                  to="/admin"
                >
                  Details
                </Link>
              )}
              <div className="relative">
                <button
                  className="flex items-center text-white px-3 text-2xl hover:text-blue-300 focus:outline-none"
                  onClick={() => setShowProfile((v) => !v)}
                  aria-label="Profile"
                >
                  <FaUserCircle />
                </button>
                {showProfile && user && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 z-50 text-left">
                    <div className="flex items-center gap-3 mb-3">
                      <FaUserCircle className="text-3xl text-blue-600" />
                      <div>
                        <div className="font-bold text-lg text-blue-900">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-gray-600">{user.role}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-800 mb-2">
                      <span className="font-semibold">Email:</span> {user.email}
                    </div>
                    <SignOutButton />
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              to="/sign-in"
              className="flex bg-white items-center text-blue-600 px-3 font-bold hover:bg-gray-100"
            >
              Sign In
            </Link>
          )}
        </span>
      </div>
    </div>
  );
};

export default Header;
