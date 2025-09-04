import { Link } from "react-router-dom";
import { HotelType } from "../../../backend/src/shared/types";
import { AiFillStar } from "react-icons/ai";
type Props = {
  hotel: HotelType;
};

const SearchResultsCard = ({ hotel }: Props) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Hotel Image */}
      <div className="h-48 overflow-hidden">
        <img
          src={hotel.imageUrls[0]}
          alt={hotel.name}
          className="w-full h-full object-cover object-center"
        />
      </div>
      
      {/* Hotel Information */}
      <div className="p-4 space-y-3">
        {/* Hotel Name and Rating */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <AiFillStar className="fill-yellow-400" key={i} />
              ))}
            </span>
            <span className="text-sm font-medium text-blue-600">{hotel.type}</span>
          </div>
          <Link
            to={`/detail/${hotel._id}`}
            className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
          >
            {hotel.name}
          </Link>
        </div>

        {/* Location */}
        <div className="text-sm text-gray-600">
          {hotel.city}, {hotel.country}
        </div>

        {/* Description */}
        <div className="text-sm text-gray-700 line-clamp-2">
          {hotel.description}
        </div>

        {/* Facilities */}
        <div className="flex flex-wrap gap-1">
          {hotel.facilities.slice(0, 3).map((facility, i) => (
            <span 
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium" 
              key={i}
            >
              {facility}
            </span>
          ))}
          {hotel.facilities.length > 3 && (
            <span className="text-xs text-gray-500">
              +{hotel.facilities.length - 3} more
            </span>
          )}
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-lg font-bold text-green-600">
            ₨{hotel.pricePerNight}
            <span className="text-sm font-normal text-gray-500 ml-1">per night</span>
          </div>
          <Link
            to={`/detail/${hotel._id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsCard;
