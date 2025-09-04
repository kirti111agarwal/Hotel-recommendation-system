import { useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import { useSearchContext } from "../../contexts/SearchContext";
import { useAppContext } from "../../contexts/AppContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import * as apiClient from "../../api-client";

type Props = {
  hotelId: string;
  pricePerNight: number;
};

type GuestInfoFormData = {
  checkIn: Date;
  checkOut: Date;
  adultCount: number;
  childCount: number;
};

const GuestInfoForm = ({ hotelId, pricePerNight }: Props) => {
  const search = useSearchContext();
  const { isLoggedIn, userRole } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Get hotel data for capacity validation
  const { data: hotel } = useQuery(
    ["fetchHotelById", hotelId, search.checkIn, search.checkOut],
    () => apiClient.fetchHotelById(hotelId, search.checkIn, search.checkOut),
    {
      enabled: !!hotelId,
    }
  );

  const {
    watch,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<GuestInfoFormData>({
    defaultValues: {
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      adultCount: search.adultCount,
      childCount: search.childCount,
    },
  });

  const checkIn = watch("checkIn");
  const checkOut = watch("checkOut");

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  // Check if booking is for zero days (same check-in and check-out date)
  const isZeroDayBooking = checkIn && checkOut && 
    Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) === 0;

  // Check if booking is for only one day (removed restriction - allow 1 day bookings)
  const isOneDayBooking = false;

  // Check if user is admin or hotel owner (they can't book)
  const isAdminOrHotelOwner = userRole === "admin" || userRole === "hotel owner";

  const onSignInClick = (data: GuestInfoFormData) => {
    search.saveSearchValues(
      "",
      data.checkIn,
      data.checkOut,
      data.adultCount,
      data.childCount
    );
    navigate("/sign-in", { state: { from: location } });
  };

  const onSubmit = (data: GuestInfoFormData) => {
    // Check if hotel is fully booked
    if (hotel?.availability?.isFullyBooked) {
      alert("This hotel is fully booked for your selected dates. Please choose different dates or another hotel.");
      return;
    }

    // Check capacity before proceeding
    if (hotel) {
      // Check if adult count exceeds available adult capacity
      if (hotel.availability && data.adultCount > hotel.availability.availableAdults) {
        alert(`Not enough adult capacity available. Only ${hotel.availability.availableAdults} adults can be accommodated for your selected dates.`);
        return;
      }

      // Check if child count exceeds available child capacity
      if (hotel.availability && data.childCount > hotel.availability.availableChildren) {
        alert(`Not enough children capacity available. Only ${hotel.availability.availableChildren} children can be accommodated for your selected dates.`);
        return;
      }

      // Check if adult count exceeds hotel's total adult capacity
      if (data.adultCount > hotel.adultCount) {
        alert(`Adult capacity exceeded. This hotel can accommodate ${hotel.adultCount} adults. You selected ${data.adultCount} adults.`);
        return;
      }

      // Check if child count exceeds hotel's total child capacity
      if (data.childCount > hotel.childCount) {
        alert(`Children capacity exceeded. This hotel can accommodate ${hotel.childCount} children. You selected ${data.childCount} children.`);
        return;
      }

      const totalGuests = data.adultCount + data.childCount;
      const maxCapacity = hotel.adultCount + hotel.childCount;
      
      if (totalGuests > maxCapacity) {
        alert(`Guest capacity exceeded. This hotel can accommodate ${maxCapacity} guests (${hotel.adultCount} adults + ${hotel.childCount} children). You selected ${totalGuests} guests.`);
        return;
      }
    }

    // Calculate number of nights
    const numberOfNights = Math.ceil((data.checkOut.getTime() - data.checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalCost = pricePerNight * data.adultCount * numberOfNights;
    
    // Show confirmation before proceeding to booking
    const isConfirmed = window.confirm(
      `Proceed to booking?\n\n` +
      `Hotel: ${hotel?.name}\n` +
      `Dates: ${data.checkIn.toDateString()} - ${data.checkOut.toDateString()}\n` +
      `Guests: ${data.adultCount} adults, ${data.childCount} children\n` +
      `Adults: ${data.adultCount} × ₨${pricePerNight} × ${numberOfNights} nights = ₨${totalCost.toFixed(2)}\n` +
`Children: ${data.childCount} × ₨0 × ${numberOfNights} nights = ₨0.00\n` +
`Total Cost: ₨${totalCost.toFixed(2)}\n\n` +
      `You will be taken to the payment and booking confirmation page.`
    );

    if (!isConfirmed) {
      return;
    }
    
    search.saveSearchValues(
      "",
      data.checkIn,
      data.checkOut,
      data.adultCount,
      data.childCount
    );
    navigate(`/hotel/${hotelId}/booking`);
  };

  return (
    <div className="flex flex-col p-4 bg-blue-200 gap-4">
      <div>
        <h3 className="text-md font-bold">Price per Adult: ₨{pricePerNight}</h3>
        <div className="text-xs text-gray-600">Children stay free</div>
      </div>
      
      {hotel?.availability && search.checkIn && search.checkOut && (
        <div className="p-2 border border-gray-200">
          <div className="text-xs font-bold">
            <div>Available: {hotel.availability.availableCapacity} guests</div>
            <div>Adults: {hotel.availability.availableAdults}</div>
            <div>Children: {hotel.availability.availableChildren}</div>
          </div>
        </div>
      )}
      <form
        onSubmit={
          isLoggedIn ? handleSubmit(onSubmit) : handleSubmit(onSignInClick)
        }
      >
        <div className="grid grid-cols-1 gap-4 items-center">
          <div>
            <DatePicker
              required
              selected={checkIn}
              onChange={(date) => setValue("checkIn", date as Date)}
              selectsStart
              startDate={checkIn}
              endDate={checkOut}
              minDate={minDate}
              maxDate={maxDate}
              placeholderText="Check-in Date"
              className="min-w-full bg-white p-2 focus:outline-none"
              wrapperClassName="min-w-full"
            />
          </div>
          <div>
            <DatePicker
              required
              selected={checkOut}
              onChange={(date) => setValue("checkOut", date as Date)}
              selectsStart
              startDate={checkIn}
              endDate={checkOut}
              minDate={minDate}
              maxDate={maxDate}
              placeholderText="Check-in Date"
              className="min-w-full bg-white p-2 focus:outline-none"
              wrapperClassName="min-w-full"
            />
          </div>
          <div className="flex bg-white px-2 py-1 gap-2">
            <label className="items-center flex">
              Adults:
              <input
                className="w-full p-1 focus:outline-none font-bold"
                type="number"
                min={1}
                max={hotel?.availability ? hotel.availability.availableAdults : (hotel ? hotel.adultCount : 20)}
                {...register("adultCount", {
                  required: "This field is required",
                  min: {
                    value: 1,
                    message: "There must be at least one adult",
                  },
                  max: {
                    value: hotel?.availability ? hotel.availability.availableAdults : (hotel ? hotel.adultCount : 20),
                    message: hotel?.availability?.isAdultsFullyBooked 
                      ? "No adult capacity available" 
                      : `Maximum ${hotel?.availability ? hotel.availability.availableAdults : (hotel ? hotel.adultCount : 20)} adults allowed`,
                  },
                  valueAsNumber: true,
                })}
              />
            </label>
            <label className="items-center flex">
              Children:
              <input
                className="w-full p-1 focus:outline-none font-bold"
                type="number"
                min={0}
                max={hotel?.availability ? hotel.availability.availableChildren : (hotel ? hotel.childCount : 20)}
                {...register("childCount", {
                  max: {
                    value: hotel?.availability ? hotel.availability.availableChildren : (hotel ? hotel.childCount : 20),
                    message: hotel?.availability?.isChildrenFullyBooked 
                      ? "No children capacity available" 
                      : `Maximum ${hotel?.availability ? hotel.availability.availableChildren : (hotel ? hotel.childCount : 20)} children allowed`,
                  },
                  valueAsNumber: true,
                })}
              />
            </label>
            {errors.adultCount && (
              <span className="text-red-500 font-semibold text-sm">
                {errors.adultCount.message}
              </span>
            )}
            {errors.childCount && (
              <span className="text-red-500 font-semibold text-sm">
                {errors.childCount.message}
              </span>
            )}
          </div>
          {hotel && (
            <div className="text-xs text-gray-600 bg-white p-2 rounded">
              Hotel capacity: {hotel.adultCount} adults + {hotel.childCount} children = {hotel.adultCount + hotel.childCount} total guests
            </div>
          )}
          {isLoggedIn ? (
            <button 
              disabled={hotel?.availability?.isFullyBooked || hotel?.availability?.isAdultsFullyBooked || isAdminOrHotelOwner || isOneDayBooking || isZeroDayBooking}
              className={`h-full p-2 font-bold text-xl ${
                hotel?.availability?.isFullyBooked || hotel?.availability?.isAdultsFullyBooked || isAdminOrHotelOwner || isOneDayBooking || isZeroDayBooking
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {hotel?.availability?.isFullyBooked ? 'Fully Booked' : 
               hotel?.availability?.isAdultsFullyBooked ? 'No Adult Capacity' :
               isAdminOrHotelOwner ? 'You Can\'t Book' :
               isZeroDayBooking ? 'Sorry, you can\'t book for zero days' : 'Book Now'}
            </button>
          ) : (
            <button 
              disabled={hotel?.availability?.isFullyBooked || hotel?.availability?.isAdultsFullyBooked || isOneDayBooking || isZeroDayBooking}
              className={`h-full p-2 font-bold text-xl ${
                hotel?.availability?.isFullyBooked || hotel?.availability?.isAdultsFullyBooked || isOneDayBooking || isZeroDayBooking
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {hotel?.availability?.isFullyBooked ? 'Fully Booked' : 
               hotel?.availability?.isAdultsFullyBooked ? 'No Adult Capacity' :
               isZeroDayBooking ? 'Sorry' : 'Sign in to Book'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default GuestInfoForm;
