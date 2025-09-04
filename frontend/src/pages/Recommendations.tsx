import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import SearchResultsCard from "../components/SearchResultsCard";

const Recommendations = () => {
  const { data: recommendations, isLoading, error } = useQuery("fetchRecommendations", () => apiClient.fetchRecommendations());
  const { data: allHotels, isLoading: isLoadingAll, error: errorAll } = useQuery("fetchAllHotels", apiClient.fetchHotels);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4 text-blue-800">Hotels you may like</h2>
        {isLoading && <div>Loading recommendations...</div>}
        {!!error && <div className="text-red-500">{"An error occurred while loading recommendations"}</div>}
        {!isLoading && !error && recommendations && recommendations.length === 0 && (
          <div>No recommendations available.</div>
        )}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {recommendations && recommendations.map((hotel) => (
            <SearchResultsCard hotel={hotel} key={hotel._id} />
          ))}
        </div>
        <h2 className="text-2xl font-bold mb-4 text-blue-800">All Hotels</h2>
        {isLoadingAll && <div>Loading all hotels...</div>}
        {!!errorAll && <div className="text-red-500">{"An error occurred while loading all hotels"}</div>}
        {!isLoadingAll && !errorAll && allHotels && allHotels.length === 0 && (
          <div>No hotels available.</div>
        )}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
          {allHotels && allHotels.map((hotel) => (
            <SearchResultsCard hotel={hotel} key={hotel._id} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recommendations; 