import { useQuery, useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import { HotelType, BookingType } from "../../../backend/src/shared/types";

// Type for hotel with bookings included
type HotelWithBookings = HotelType & {
  bookings: BookingType[];
};

const MyBookings = () => {
  const queryClient = useQueryClient();
  const { data: hotels } = useQuery(
    "fetchMyBookings",
    apiClient.fetchMyBookings
  );

  const cancelMutation = useMutation(
    async ({ hotelId, bookingId }: { hotelId: string; bookingId: string }) => {
      const res = await fetch(`/api/my-bookings/${hotelId}/${bookingId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to cancel booking");
      return res.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("fetchMyBookings");
      },
    }
  );

  if (!hotels || hotels.length === 0) {
    return <span>No bookings found</span>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">My Bookings</h1>
      {hotels.map((hotel) => {
        const hotelWithBookings = hotel as HotelWithBookings;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] border border-slate-300 rounded-lg p-8 gap-5" key={hotel._id}>
            <div className="lg:w-full lg:h-[250px]">
              <img
                src={hotel.imageUrls[0]}
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px]">
              <div className="text-2xl font-bold">
                {hotel.name}
                <div className="text-xs font-normal">
                  {hotel.city}, {hotel.country}
                </div>
              </div>
              {hotelWithBookings.bookings.map((booking: BookingType) => (
              <div key={booking._id} className="flex items-center gap-4">
                <div>
                  <span className="font-bold mr-2">Dates: </span>
                  <span>
                    {new Date(booking.checkIn).toDateString()} -
                    {new Date(booking.checkOut).toDateString()}
                  </span>
                </div>
                <div>
                  <span className="font-bold mr-2">Guests:</span>
                  <span>
                    {booking.adultCount} adults, {booking.childCount} children
                  </span>
                </div>
                <div>
                  <span className="font-bold mr-2">Total Cost:</span>
                  <span className="text-green-600 font-semibold">
                    ₨{booking.totalCost.toFixed(2)}
                  </span>
                </div>
                <button
                  className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => {
                    const isConfirmed = window.confirm(
                      `Are you sure you want to cancel this booking?\n\n` +
                      `Hotel: ${hotel.name}\n` +
                      `Dates: ${new Date(booking.checkIn).toDateString()} - ${new Date(booking.checkOut).toDateString()}\n` +
                      `Guests: ${booking.adultCount} adults, ${booking.childCount} children\n` +
                      `Total Cost: ₨${booking.totalCost.toFixed(2)}\n\n` +
                      `This action cannot be undone and may result in cancellation fees.`
                    );
                    
                    if (isConfirmed) {
                      cancelMutation.mutate({ hotelId: hotel._id, bookingId: booking._id });
                    }
                  }}
                  disabled={cancelMutation.isLoading}
                >
                  {cancelMutation.isLoading ? "Cancelling..." : "Cancel Booking"}
                </button>
              </div>
            ))}
          </div>
        </div>
        );
      })}
    </div>
  );
};

export default MyBookings;
