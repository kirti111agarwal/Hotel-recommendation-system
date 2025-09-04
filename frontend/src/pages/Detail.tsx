import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import * as apiClient from "../api-client";
import { AiFillStar } from "react-icons/ai";
import GuestInfoForm from "../forms/GuestInfoForm/GuestInfoForm";
import { useEffect } from "react";
import SearchResultsCard from "../components/SearchResultsCard";
import { useSearchContext } from "../contexts/SearchContext";

type DetailProps = {
  showRecommendations?: boolean;
};

const Detail = ({ showRecommendations }: DetailProps) => {
  const { hotelId } = useParams();
  const search = useSearchContext();

  useEffect(() => {
    if (hotelId) {
      fetch(`/api/hotels/${hotelId}/click`, {
        method: "POST",
        credentials: "include",
      });
    }
  }, [hotelId]);

  const { data: hotel } = useQuery(
    ["fetchHotelById", hotelId, search.checkIn, search.checkOut],
    () => apiClient.fetchHotelById(
      hotelId || "", 
      search.checkIn, 
      search.checkOut
    ),
    {
      enabled: !!hotelId,
    }
  );

  const { data: recommendations } = useQuery(
    ["fetchRecommendations", hotelId],
    () => {
      return apiClient.fetchRecommendations(hotelId || "");
    },
    {
      enabled: !!hotelId, // Only run when hotelId is available
    }
  );

  if (!hotel) {
    return <></>;
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="flex">
          {Array.from({ length: hotel.starRating }).map(() => (
            <AiFillStar className="fill-yellow-400" />
          ))}
        </span>
        <h1 className="text-3xl font-bold">{hotel.name}</h1>
        
        {/* Simple Price Display */}
        <div style={{ marginTop: '16px', padding: '8px', border: '1px solid #ccc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>₨{hotel.pricePerNight}</span>
              <span style={{ fontSize: '14px', color: '#666', marginLeft: '4px' }}>per night</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: '#666' }}>{hotel.city}, {hotel.country}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {hotel.imageUrls.map((image) => (
          <div className="h-[300px]">
            <img
              src={image}
              alt={hotel.name}
              className="rounded-md w-full h-full object-cover object-center"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        {hotel.facilities.map((facility) => (
          <div className="border border-slate-300 rounded-sm p-3">
            {facility}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
        <div className="whitespace-pre-line">
          {hotel.description}
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Hotel Capacity</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Adults:</span> {hotel.adultCount}
              </div>
              <div>
                <span className="font-medium">Children:</span> {hotel.childCount}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Total Capacity:</span> {hotel.adultCount + hotel.childCount} guests
              </div>
            </div>
          </div>

          {hotel.availability && search.checkIn && search.checkOut && (
            <div className="mt-4 p-2 border border-gray-200">
              <div className="text-sm font-bold">
                <div>Available: {hotel.availability.availableCapacity} guests</div>
                <div>Adults: {hotel.availability.availableAdults}</div>
                <div>Children: {hotel.availability.availableChildren}</div>
              </div>
            </div>
          )}
        </div>
        <div className="h-fit">
          <GuestInfoForm
            pricePerNight={hotel.pricePerNight}
            hotelId={hotel._id}
          />
        </div>
      </div>
      {showRecommendations && recommendations && recommendations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-2">Recommended for You</h2>
          <p className="text-gray-600 mb-4">Hotels similar in price to what you've viewed</p>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.map((hotel) => (
              <SearchResultsCard hotel={hotel} key={hotel._id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Detail;
