import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import * as apiClient from '../../api-client';
import SearchResultsCard from '../../components/SearchResultsCard';
import { HotelType } from '../../../../backend/src/shared/types';

interface RecommendationStats {
  totalRecommendations: number;
  strategy: string;
  strategyDescription: string;
  clickHistoryCount: number;
  recommendations: Array<{
    id: string;
    name: string;
    price: number;
    score?: number;
    reason?: string;
  }>;
}

export const RecommendationEngine: React.FC = () => {
  const { hotelId } = useParams();
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  
  const [selectedStrategy, setSelectedStrategy] = useState<string>('auto');
  const [showStats, setShowStats] = useState(false);

  // Get current user for personalized recommendations
  const { data: currentUser } = useQuery(
    "fetchCurrentUser",
    apiClient.fetchCurrentUser
  );

  // Get recommendations
  const { data: recommendations, isLoading, error, refetch } = useQuery(
    ['recommendations', hotelId, currentUser?._id, selectedStrategy],
    () => {
      const params = new URLSearchParams();
      if (hotelId) params.append('hotelId', hotelId);
      if (currentUser?._id) params.append('userId', currentUser._id);
      if (selectedStrategy !== 'auto') params.append('strategy', selectedStrategy);
      
      return apiClient.fetchRecommendations(params.toString());
    },
    {
      enabled: !!currentUser,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Get recommendations with strategy information
  const { data: recommendationStats } = useQuery(
    ['recommendationStats', hotelId, currentUser?._id],
    () => {
      const params = new URLSearchParams();
      if (hotelId) params.append('hotelId', hotelId);
      if (currentUser?._id) params.append('userId', currentUser._id);
      
      return apiClient.fetchRecommendationStats(params.toString());
    },
    {
      enabled: !!currentUser && showStats,
    }
  );

  // Record hotel click mutation
  const recordClickMutation = useMutation(
    (hotelId: string) => apiClient.recordHotelClick(hotelId),
    {
      onSuccess: () => {
        // Refetch recommendations after recording click
        refetch();
      },
      onError: () => {
        showToast({ message: 'Error recording click', type: 'ERROR' });
      }
    }
  );

  const handleHotelClick = (hotelId: string) => {
    recordClickMutation.mutate(hotelId);
    navigate(`/detail/${hotelId}`);
  };

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'price-based':
        return 'Shows hotels similar in price to the currently viewed hotel';
      case 'user-behavior':
        return 'Recommends hotels based on your browsing history';
      case 'popularity':
        return 'Shows highly-rated and recently updated hotels';
      case 'random':
        return 'Random selection of hotels for discovery';
      default:
        return 'Automatically selects the best recommendation strategy';
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'price-based':
        return '💰';
      case 'user-behavior':
        return '👤';
      case 'popularity':
        return '⭐';
      case 'random':
        return '🎲';
      default:
        return '🤖';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="font-semibold">Error Loading Recommendations</div>
            <div className="text-sm">Please try again later.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Hotel Recommendations
          </h1>
          
          {hotelId && (
            <p className="text-gray-600 mb-4">
              Based on the hotel you're currently viewing
            </p>
          )}

          {/* Strategy Selector */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendation Strategy
                </label>
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="auto">🤖 Auto (Best Available)</option>
                  <option value="price-based">💰 Price-Based</option>
                  <option value="user-behavior">👤 User Behavior</option>
                  <option value="popularity">⭐ Popularity</option>
                  <option value="random">🎲 Random Discovery</option>
                </select>
              </div>
              
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {showStats ? 'Hide' : 'Show'} Analytics
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getStrategyIcon(selectedStrategy)}</span>
                <div>
                  <div className="font-semibold text-blue-900">
                    {getStrategyDescription(selectedStrategy).split(' ')[0]} Strategy
                  </div>
                  <div className="text-sm text-blue-700">
                    {getStrategyDescription(selectedStrategy)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Panel */}
          {showStats && recommendationStats && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendation Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="text-2xl font-bold text-blue-600">
                    {recommendationStats.totalRecommendations}
                  </div>
                  <div className="text-sm text-blue-700">Total Recommendations</div>
                </div>
                <div className="bg-green-50 p-4 rounded-md">
                  <div className="text-2xl font-bold text-green-600">
                    {recommendationStats.clickHistoryCount}
                  </div>
                  <div className="text-sm text-green-700">Hotels Viewed</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-md">
                  <div className="text-2xl font-bold text-purple-600">
                    {getStrategyIcon(recommendationStats.strategy.toLowerCase())}
                  </div>
                  <div className="text-sm text-purple-700">Active Strategy</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-md">
                  <div className="text-2xl font-bold text-orange-600">
                    {recommendationStats.recommendations.length > 0 
                      ? Math.round(recommendationStats.recommendations[0].score || 0)
                      : 0}%
                  </div>
                  <div className="text-sm text-orange-700">Top Score</div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Recommendation Details</h4>
                <div className="space-y-2">
                  {recommendationStats.recommendations.map((rec, index) => (
                    <div key={rec.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                        <div>
                          <div className="font-medium">{rec.name}</div>
                          <div className="text-sm text-gray-600">₨{rec.price}/night</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600">
                          {rec.score ? `${Math.round(rec.score)}%` : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">{rec.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recommendations Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {hotelId ? 'Similar Hotels' : 'Recommended for You'}
          </h2>
          
          {recommendations && recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((hotel) => (
                <div key={hotel._id} className="relative">
                  <SearchResultsCard hotel={hotel} />
                  {hotel.algorithm && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs">
                      {hotel.algorithm.priceSimilarity || `${Math.round(hotel.algorithm.score || 0)}%`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <div className="font-semibold">No Recommendations Available</div>
              <div className="text-sm">
                Try browsing more hotels or adjusting your search criteria.
              </div>
            </div>
          )}
        </div>

        {/* Alternative Recommendations */}
        {!hotelId && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Hotels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* This would show popular hotels when no specific hotel is being viewed */}
            </div>
          </div>
        )}

        {/* User Engagement Section */}
        {currentUser && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {recommendationStats?.clickHistoryCount || 0}
                </div>
                <div className="text-sm text-gray-600">Hotels Viewed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {recommendations?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Current Recommendations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {getStrategyIcon(selectedStrategy)}
                </div>
                <div className="text-sm text-gray-600">Active Strategy</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 