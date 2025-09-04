import { useEffect, useState } from "react";
//import * as apiClient from "../api-client";

type UserType = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};
type HotelType = {
  _id: string;
  name: string;
  city: string;
  country: string;
  userId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

const Admin = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await fetch("/api/users/admin/all", { credentials: "include" });
        const hotelsRes = await fetch("/api/hotels/admin/all", { credentials: "include" });
        if (!usersRes.ok || !hotelsRes.ok) throw new Error("Failed to fetch data");
        setUsers(await usersRes.json());
        setHotels(await hotelsRes.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    await fetch(`/api/users/admin/${userId}`, { method: "DELETE", credentials: "include" });
    setUsers(users.filter((u) => u._id !== userId));
  };

  const handleDeleteHotel = async (hotelId: string) => {
    if (!window.confirm("Are you sure you want to delete this hotel?")) return;
    await fetch(`/api/hotels/admin/${hotelId}`, { method: "DELETE", credentials: "include" });
    setHotels(hotels.filter((h) => h._id !== hotelId));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <div className="flex gap-4 mb-8">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold"
          onClick={() => {
            document.getElementById("admin-users-section")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Manage Users
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold"
          onClick={() => {
            document.getElementById("admin-hotels-section")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Manage Hotels
        </button>
      </div>
      <div className="mb-8" id="admin-users-section">
        <h3 className="text-xl font-semibold mb-2">Users</h3>
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border">First Name</th>
              <th className="py-2 px-4 border">Last Name</th>
              <th className="py-2 px-4 border">Email</th>
              <th className="py-2 px-4 border">Role</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="py-2 px-4 border">{user.firstName}</td>
                <td className="py-2 px-4 border">{user.lastName}</td>
                <td className="py-2 px-4 border">{user.email}</td>
                <td className="py-2 px-4 border">{user.role}</td>
                <td className="py-2 px-4 border">
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    onClick={() => handleDeleteUser(user._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div id="admin-hotels-section">
        <h3 className="text-xl font-semibold mb-2">Hotels</h3>
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border">Name</th>
              <th className="py-2 px-4 border">City</th>
              <th className="py-2 px-4 border">Country</th>
              <th className="py-2 px-4 border">Owner</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((hotel) => (
              <tr key={hotel._id}>
                <td className="py-2 px-4 border">{hotel.name}</td>
                <td className="py-2 px-4 border">{hotel.city}</td>
                <td className="py-2 px-4 border">{hotel.country}</td>
                <td className="py-2 px-4 border">
                  {typeof hotel.userId === 'string' 
                    ? hotel.userId 
                    : hotel.userId 
                      ? `${hotel.userId.firstName} ${hotel.userId.lastName}` 
                      : 'Unknown Owner'
                  }
                </td>
                <td className="py-2 px-4 border">
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    onClick={() => handleDeleteHotel(hotel._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin; 