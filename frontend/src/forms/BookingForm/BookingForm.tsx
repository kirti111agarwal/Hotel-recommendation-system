import { useForm } from "react-hook-form";
import {
  PaymentIntentResponse,
  UserType,
} from "../../../../backend/src/shared/types";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import { useSearchContext } from "../../contexts/SearchContext";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "react-query";
import * as apiClient from "../../api-client";
import { useAppContext } from "../../contexts/AppContext";

type Props = {
  currentUser: UserType;
  paymentIntent: PaymentIntentResponse;
};

export type BookingFormData = {
  firstName: string;
  lastName: string;
  email: string;
  adultCount: number;
  childCount: number;
  checkIn: string;
  checkOut: string;
  hotelId: string;
  paymentIntentId: string;
  totalCost: number;
};

const BookingForm = ({ currentUser, paymentIntent }: Props) => {
  const stripe = useStripe();
  const elements = useElements();

  const search = useSearchContext();
  const { hotelId } = useParams();
  const navigate = useNavigate();

  const { showToast } = useAppContext();

  // Get hotel data to check capacity
  const { data: hotel } = useQuery(
    "fetchHotelByID",
    () => apiClient.fetchHotelById(hotelId as string),
    {
      enabled: !!hotelId,
    }
  );



  const { mutate: bookRoom, isLoading } = useMutation(
    apiClient.createRoomBooking,
    {
      onSuccess: () => {
        showToast({ message: "Booking Saved!", type: "SUCCESS" });
        // Redirect to My Bookings page after successful booking
        navigate("/my-bookings");
      },
      onError: () => {
        showToast({ message: "Error saving booking", type: "ERROR" });
      },
    }
  );

  const totalGuests = search.adultCount + search.childCount;
  const maxCapacity = hotel ? hotel.adultCount + hotel.childCount : 0;
  const exceedsCapacity = totalGuests > maxCapacity;
  const isFullyBooked = hotel?.availability?.isFullyBooked || false;
  const insufficientCapacity = hotel?.availability && totalGuests > hotel.availability.availableCapacity;
  
  // Separate adult and children capacity checks
  const exceedsAdultCapacity = search.adultCount > (hotel?.adultCount || 0);
  const exceedsChildCapacity = search.childCount > (hotel?.childCount || 0);
  const insufficientAdultCapacity = hotel?.availability && search.adultCount > hotel.availability.availableAdults;
  const insufficientChildCapacity = hotel?.availability && search.childCount > hotel.availability.availableChildren;
  // const isAdultsFullyBooked = hotel?.availability?.isAdultsFullyBooked || false;
  // const isChildrenFullyBooked = hotel?.availability?.isChildrenFullyBooked || false;

  const { handleSubmit, register } = useForm<BookingFormData>({
    defaultValues: {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      adultCount: search.adultCount,
      childCount: search.childCount,
      checkIn: search.checkIn.toISOString(),
      checkOut: search.checkOut.toISOString(),
      hotelId: hotelId,
      totalCost: paymentIntent.totalCost,
      paymentIntentId: paymentIntent.paymentIntentId,
    },
  });

  const onSubmit = async (formData: BookingFormData) => {
    if (!stripe || !elements) {
      return;
    }

    // Calculate number of nights for breakdown
    const numberOfNights = Math.ceil((new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 60 * 60 * 24));
    const adultCost = (hotel?.pricePerNight || 0) * formData.adultCount * numberOfNights;
    const childCost = 0;
    
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      `Are you sure you want to confirm this booking?\n\n` +
      `Hotel: ${hotel?.name}\n` +
      `Dates: ${new Date(formData.checkIn).toDateString()} - ${new Date(formData.checkOut).toDateString()}\n` +
      `Guests: ${formData.adultCount} adults, ${formData.childCount} children\n` +
      `Adults: ${formData.adultCount} × ₨${hotel?.pricePerNight} × ${numberOfNights} nights = ₨${adultCost.toFixed(2)}\n` +
`Children: ${formData.childCount} × ₨0 × ${numberOfNights} nights = ₨${childCost.toFixed(2)}\n` +
`Total Cost: ₨${formData.totalCost.toFixed(2)}\n\n` +
      `This will process your payment and confirm your booking.`
    );

    if (!isConfirmed) {
      return;
    }

    const result = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement) as StripeCardElement,
      },
    });

    if (result.paymentIntent?.status === "succeeded") {
      bookRoom({ ...formData, paymentIntentId: result.paymentIntent.id });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-5 rounded-lg border border-slate-300 p-5"
    >
      <span className="text-3xl font-bold">Confirm Your Details</span>
      <div className="grid grid-cols-2 gap-6">
        <label className="text-gray-700 text-sm font-bold flex-1">
          First Name
          <input
            className="mt-1 border rounded w-full py-2 px-3 text-gray-700 bg-gray-200 font-normal"
            type="text"
            readOnly
            disabled
            {...register("firstName")}
          />
        </label>
        <label className="text-gray-700 text-sm font-bold flex-1">
          Last Name
          <input
            className="mt-1 border rounded w-full py-2 px-3 text-gray-700 bg-gray-200 font-normal"
            type="text"
            readOnly
            disabled
            {...register("lastName")}
          />
        </label>
        <label className="text-gray-700 text-sm font-bold flex-1">
          Email
          <input
            className="mt-1 border rounded w-full py-2 px-3 text-gray-700 bg-gray-200 font-normal"
            type="text"
            readOnly
            disabled
            {...register("email")}
          />
        </label>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Your Price Summary</h2>

        <div className="bg-blue-200 p-4 rounded-md">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Adults ({search.adultCount} × ₨{hotel?.pricePerNight} × {Math.ceil((search.checkOut.getTime() - search.checkIn.getTime()) / (1000 * 60 * 60 * 24))} nights):</span>
<span className="font-semibold">₨{(hotel?.pricePerNight || 0) * search.adultCount * Math.ceil((search.checkOut.getTime() - search.checkIn.getTime()) / (1000 * 60 * 60 * 24))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Children ({search.childCount} × ₨0 × {Math.ceil((search.checkOut.getTime() - search.checkIn.getTime()) / (1000 * 60 * 60 * 24))} nights):</span>
<span className="font-semibold">₨0.00</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Cost:</span>
                <span>₨{paymentIntent.totalCost.toFixed(2)}</span>
              </div>
              <div className="text-xs">Includes taxes and charges</div>
            </div>
          </div>
        </div>
      </div>

      {isFullyBooked && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="font-semibold">❌ Hotel Fully Booked</div>
          <div className="text-sm">
            This hotel is fully booked for your selected dates.
            <br />
            Please choose different dates or another hotel.
          </div>
        </div>
      )}
      
      {!isFullyBooked && insufficientAdultCapacity && (
        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded">
          <div className="font-semibold">⚠️ Insufficient Adult Capacity</div>
          <div className="text-sm">
            Only {hotel?.availability?.availableAdults} adults can be accommodated for your selected dates.
            <br />
            You requested {search.adultCount} adults.
          </div>
        </div>
      )}

      {!isFullyBooked && insufficientChildCapacity && (
        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded">
          <div className="font-semibold">⚠️ Insufficient Children Capacity</div>
          <div className="text-sm">
            Only {hotel?.availability?.availableChildren} children can be accommodated for your selected dates.
            <br />
            You requested {search.childCount} children.
          </div>
        </div>
      )}
      
      {!isFullyBooked && !insufficientAdultCapacity && !insufficientChildCapacity && insufficientCapacity && (
        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded">
          <div className="font-semibold">⚠️ Insufficient Available Capacity</div>
          <div className="text-sm">
            Only {hotel?.availability?.availableCapacity} guests can be accommodated for your selected dates.
            <br />
            You requested {totalGuests} guests.
          </div>
        </div>
      )}
      
      {!isFullyBooked && !insufficientCapacity && exceedsAdultCapacity && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="font-semibold">⚠️ Adult Capacity Exceeded</div>
          <div className="text-sm">
            This hotel can accommodate {hotel?.adultCount} adults.
            <br />
            You requested {search.adultCount} adults.
          </div>
        </div>
      )}

      {!isFullyBooked && !insufficientCapacity && !exceedsAdultCapacity && exceedsChildCapacity && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="font-semibold">⚠️ Children Capacity Exceeded</div>
          <div className="text-sm">
            This hotel can accommodate {hotel?.childCount} children.
            <br />
            You requested {search.childCount} children.
          </div>
        </div>
      )}
      
      {!isFullyBooked && !insufficientCapacity && !exceedsAdultCapacity && !exceedsChildCapacity && exceedsCapacity && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="font-semibold">⚠️ Total Capacity Exceeded</div>
          <div className="text-sm">
            This hotel can accommodate {maxCapacity} guests ({hotel?.adultCount} adults + {hotel?.childCount} children).
            <br />
            You requested {totalGuests} guests.
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xl font-semibold"> Payment Details</h3>
        <CardElement
          id="payment-element"
          className="border rounded-md p-2 text-sm"
        />
      </div>

      <div className="flex justify-end">
        <button
          disabled={
            isLoading || 
            exceedsCapacity || 
            isFullyBooked || 
            insufficientCapacity ||
            exceedsAdultCapacity ||
            exceedsChildCapacity ||
            insufficientAdultCapacity ||
            insufficientChildCapacity
          }
          type="submit"
          className="bg-blue-600 text-white p-2 font-bold hover:bg-blue-500 text-md disabled:bg-gray-500"
        >
          {isLoading 
            ? "Saving..." 
            : isFullyBooked 
              ? "Fully Booked" 
              : insufficientAdultCapacity
                ? "Insufficient Adult Capacity"
                : insufficientChildCapacity
                  ? "Insufficient Children Capacity"
                  : insufficientCapacity 
                    ? "Insufficient Capacity"
                    : exceedsAdultCapacity
                      ? "Adult Capacity Exceeded"
                      : exceedsChildCapacity
                        ? "Children Capacity Exceeded"
                        : exceedsCapacity 
                          ? "Capacity Exceeded" 
                          : "Confirm Booking"
          }
        </button>
      </div>
    </form>
  );
};

export default BookingForm;
