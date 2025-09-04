import { HotelType } from "../../../backend/src/shared/types";

type Props = {
  checkIn: Date;
  checkOut: Date;
  adultCount: number;
  childCount: number;
  numberOfNights: number;
  hotel: HotelType;
};

const BookingDetailsSummary = ({
  checkIn,
  checkOut,
  adultCount,
  childCount,
  numberOfNights,
  hotel,
}: Props) => {
  return (
    <div className="grid gap-4 rounded-lg border border-slate-300 p-5 h-fit">
      <h2 className="text-xl font-bold">Your Booking Details</h2>
      <div className="border-b py-2">
        Location:
        <div className="font-bold">{`${hotel.name}, ${hotel.city}, ${hotel.country}`}</div>
      </div>
      <div className="flex justify-between">
        <div>
          Check-in
          <div className="font-bold"> {checkIn.toDateString()}</div>
        </div>
        <div>
          Check-out          <div className="font-bold"> {checkOut.toDateString()}</div>
        </div>
      </div>
      <div className="border-t border-b py-2">
        Total length of stay:
        <div className="font-bold">{numberOfNights} nights</div>
      </div>

      <div>
        Guests{" "}
        <div className="font-bold">
          {adultCount} adults & {childCount} children
        </div>
      </div>
      
      <div className="border-t pt-2">
        <div className="text-sm text-gray-600">Hotel Capacity</div>
        <div className="font-bold">
          {hotel.adultCount} adults & {hotel.childCount} children
        </div>
        <div className="text-sm text-gray-600 mt-1">
          Total capacity: {hotel.adultCount + hotel.childCount} guests
        </div>
        <div className="text-sm text-blue-600 mt-1">
          Your booking: {adultCount + childCount} guests
        </div>
        {adultCount + childCount > hotel.adultCount + hotel.childCount && (
          <div className="text-sm text-pink-600 mt-1 font-semibold">
            ⚠️ Exceeds hotel capacity!
          </div>
        )}
        
        {hotel.availability && (
          <div className="border-t pt-2 mt-2">
            <div className="text-sm font-bold">
              <div>Available: {hotel.availability.availableCapacity} guests</div>
              <div>Adults: {hotel.availability.availableAdults}</div>
              <div>Children: {hotel.availability.availableChildren}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetailsSummary;
