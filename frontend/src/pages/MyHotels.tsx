import { useQuery, useMutation, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import * as apiClient from "../api-client";
import { BsBuilding, BsMap } from "react-icons/bs";
import { BiHotel, BiMoney, BiStar } from "react-icons/bi";
import { useState } from "react";

const MyHotels = () => {
  const queryClient = useQueryClient();
  const { data: hotelData } = useQuery(
    "fetchMyHotels",
    apiClient.fetchMyHotels,
    {
      onError: () => {},
    }
  );

  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteHotelMutation = useMutation(
    async (hotelId: string) => {
      const res = await fetch(`/api/my-hotels/${hotelId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete hotel");
      return res.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("fetchMyHotels");
      },
    }
  );

  const cancelBookingMutation = useMutation(
    async ({ hotelId, bookingId }: { hotelId: string; bookingId: string }) => {
      const res = await fetch(`/api/my-hotels/${hotelId}/bookings/${bookingId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to cancel booking");
      return res.json();
    },
    {
      onSuccess: () => {
        if (selectedHotelId) handleViewBookings(selectedHotelId);
      },
    }
  );

  const handleViewBookings = async (hotelId: string) => {
    setSelectedHotelId(hotelId);
    setLoadingBookings(true);
    setError(null);
    try {
      const res = await fetch(`/api/my-hotels/${hotelId}/bookings`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bookings");
      setBookings(await res.json());
    } catch (err: any) {
      setError(err.message);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  if (!hotelData) {
    return <span>No Hotels found</span>;
  }

  return (
    <div className="space-y-5">
      <span className="flex justify-between">
        <h1 className="text-3xl font-bold">My Hotels</h1>
        <Link
          to="/add-hotel"
          className="flex bg-blue-600 text-white text-xl font-bold p-2 hover:bg-blue-500"
        >
          Add Hotel
        </Link>
      </span>
      <div className="grid grid-cols-1 gap-8">
        {hotelData.map((hotel) => (
          <div
            data-testid="hotel-card"
            className="flex flex-col justify-between border border-slate-300 rounded-lg p-8 gap-5"
            key={hotel._id}
          >
            <h2 className="text-2xl font-bold">{hotel.name}</h2>
            <div className="whitespace-pre-line">{hotel.description}</div>
            <div className="grid grid-cols-5 gap-2">
              <div className="border border-slate-300 rounded-sm p-3 flex items-center">
                <BsMap className="mr-1" />
                {hotel.city}, {hotel.country}
              </div>
              <div className="border border-slate-300 rounded-sm p-3 flex items-center">
                <BsBuilding className="mr-1" />
                {hotel.type}
              </div>
              <div className="border border-slate-300 rounded-sm p-3 flex items-center">
                <BiMoney className="mr-1" />₨{hotel.pricePerNight} per night
              </div>
              <div className="border border-slate-300 rounded-sm p-3 flex items-center">
                <BiHotel className="mr-1" />
                {hotel.adultCount} adults, {hotel.childCount} children
              </div>
              <div className="border border-slate-300 rounded-sm p-3 flex items-center">
                <BiStar className="mr-1" />
                {hotel.starRating} Star Rating
              </div>
            </div>
            <span className="flex justify-end gap-2">
              <Link
                to={`/edit-hotel/${hotel._id}`}
                className="flex bg-blue-600 text-white text-xl font-bold p-2 hover:bg-blue-500"
              >
                View Details
              </Link>
              <button
                className="flex bg-green-600 text-white text-xl font-bold p-2 hover:bg-green-500"
                onClick={() => handleViewBookings(hotel._id)}
              >
                View Bookings
              </button>
              <button
                className="flex bg-red-600 text-white text-xl font-bold p-2 hover:bg-red-500"
                onClick={() => {
                  const isConfirmed = window.confirm(
                    `Are you sure you want to delete this hotel?\n\n` +
                    `Hotel Name: ${hotel.name}\n` +
                    `Location: ${hotel.city}, ${hotel.country}\n` +
                    `Type: ${hotel.type}\n` +
                    `Price: ₨${hotel.pricePerNight} per night\n\n` +
                    `⚠️ WARNING: This action cannot be undone!\n` +
                    `All hotel data and any existing bookings will be permanently deleted.`
                  );
                  
                  if (isConfirmed) {
                    deleteHotelMutation.mutate(hotel._id);
                  }
                }}
                disabled={deleteHotelMutation.isLoading}
              >
                {deleteHotelMutation.isLoading ? "Deleting..." : "Delete Hotel"}
              </button>
            </span>
            {selectedHotelId === hotel._id && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Bookings</h3>
                {loadingBookings ? (
                  <div>Loading...</div>
                ) : error ? (
                  <div className="text-red-500">{error}</div>
                ) : bookings.length === 0 ? (
                  <div>No bookings found for this hotel.</div>
                ) : (
                  <table className="min-w-full bg-white border mt-2">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border">First Name</th>
                        <th className="py-2 px-4 border">Last Name</th>
                        <th className="py-2 px-4 border">Email</th>
                        <th className="py-2 px-4 border">Check In</th>
                        <th className="py-2 px-4 border">Check Out</th>
                        <th className="py-2 px-4 border">Adults</th>
                        <th className="py-2 px-4 border">Children</th>
                        <th className="py-2 px-4 border">Total Cost</th>
                        <th className="py-2 px-4 border">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-4 border">{booking.firstName}</td>
                          <td className="py-2 px-4 border">{booking.lastName}</td>
                          <td className="py-2 px-4 border">{booking.email}</td>
                          <td className="py-2 px-4 border">{new Date(booking.checkIn).toLocaleDateString()}</td>
                          <td className="py-2 px-4 border">{new Date(booking.checkOut).toLocaleDateString()}</td>
                          <td className="py-2 px-4 border">{booking.adultCount}</td>
                          <td className="py-2 px-4 border">{booking.childCount}</td>
                          <td className="py-2 px-4 border">₨{booking.totalCost}</td>
                          <td className="py-2 px-4 border">
                            <button
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                              onClick={() => {
                                const isConfirmed = window.confirm(
                                  `Are you sure you want to cancel this booking?\n\n` +
                                  `Hotel: ${hotel.name}\n` +
                                  `Guest: ${booking.firstName} ${booking.lastName}\n` +
                                  `Email: ${booking.email}\n` +
                                  `Dates: ${new Date(booking.checkIn).toDateString()} - ${new Date(booking.checkOut).toDateString()}\n` +
                                  `Guests: ${booking.adultCount} adults, ${booking.childCount} children\n` +
                                  `Total Cost: ₨${booking.totalCost}\n\n` +
                                  `⚠️ WARNING: This action cannot be undone!\n` +
                                  `Cancelling this booking may result in refund processing.`
                                );
                                
                                if (isConfirmed) {
                                  cancelBookingMutation.mutate({ hotelId: hotel._id, bookingId: booking._id });
                                }
                              }}
                              disabled={cancelBookingMutation.isLoading}
                            >
                              {cancelBookingMutation.isLoading ? "Cancelling..." : "Cancel Booking"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyHotels;
