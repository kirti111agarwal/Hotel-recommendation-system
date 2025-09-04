import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import * as apiClient from '../../api-client';
import { HotelType } from '../../../../backend/src/shared/types';

interface HotelManagementProps {
  mode: 'view' | 'create' | 'edit';
  hotelId?: string;
}

export const HotelManagement: React.FC<HotelManagementProps> = ({ mode, hotelId }) => {
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    country: '',
    description: '',
    type: '',
    adultCount: 1,
    childCount: 0,
    facilities: [] as string[],
    pricePerNight: 0,
    starRating: 3,
    imageUrls: [] as string[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch hotel data if in edit mode
  const { data: hotel, isLoading: isLoadingHotel } = useQuery(
    ['hotel', hotelId],
    () => apiClient.fetchHotelById(hotelId!),
    {
      enabled: mode === 'edit' && !!hotelId,
      onSuccess: (data) => {
        setFormData({
          name: data.name,
          city: data.city,
          country: data.country,
          description: data.description,
          type: data.type,
          adultCount: data.adultCount,
          childCount: data.childCount,
          facilities: data.facilities,
          pricePerNight: data.pricePerNight,
          starRating: data.starRating,
          imageUrls: data.imageUrls
        });
      }
    }
  );

  // Create hotel mutation
  const createHotelMutation = useMutation(apiClient.addMyHotel, {
    onSuccess: () => {
      showToast({ message: 'Hotel created successfully!', type: 'SUCCESS' });
      queryClient.invalidateQueries(['myHotels']);
      navigate('/my-hotels');
    },
    onError: () => {
      showToast({ message: 'Error creating hotel', type: 'ERROR' });
    }
  });

  // Update hotel mutation
  const updateHotelMutation = useMutation(
    (data: FormData) => apiClient.updateMyHotel(hotelId!, data),
    {
      onSuccess: () => {
        showToast({ message: 'Hotel updated successfully!', type: 'SUCCESS' });
        queryClient.invalidateQueries(['hotel', hotelId]);
        queryClient.invalidateQueries(['myHotels']);
        navigate('/my-hotels');
      },
      onError: () => {
        showToast({ message: 'Error updating hotel', type: 'ERROR' });
      }
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFacilityChange = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleImageUrlChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.map((url, i) => i === index ? value : url)
    }));
  };

  const addImageUrl = () => {
    setFormData(prev => ({
      ...prev,
      imageUrls: [...prev.imageUrls, '']
    }));
  };

  const removeImageUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => formDataObj.append(key, item));
        } else {
          formDataObj.append(key, value.toString());
        }
      });

      if (mode === 'create') {
        await createHotelMutation.mutateAsync(formDataObj);
      } else if (mode === 'edit') {
        await updateHotelMutation.mutateAsync(formDataObj);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    return (
      formData.name.trim().length >= 3 &&
      formData.city.trim().length >= 2 &&
      formData.country.trim().length >= 2 &&
      formData.description.trim().length >= 10 &&
      formData.type.trim().length >= 2 &&
      formData.adultCount >= 1 &&
      formData.childCount >= 0 &&
      formData.facilities.length > 0 &&
      formData.pricePerNight > 0 &&
      formData.starRating >= 1 &&
      formData.starRating <= 5 &&
      formData.imageUrls.length > 0 &&
      formData.imageUrls.every(url => url.trim().length > 0)
    );
  };

  if (mode === 'edit' && isLoadingHotel) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {mode === 'create' ? 'Add New Hotel' : 'Edit Hotel'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hotel Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter hotel name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hotel Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select hotel type</option>
                  <option value="Budget">Budget</option>
                  <option value="Business">Business</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Resort">Resort</option>
                  <option value="Boutique">Boutique</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter city"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter country"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your hotel..."
                required
              />
            </div>

            {/* Capacity and Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adult Capacity *
                </label>
                <input
                  type="number"
                  name="adultCount"
                  value={formData.adultCount}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Child Capacity
                </label>
                <input
                  type="number"
                  name="childCount"
                  value={formData.childCount}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Night (₨) *
                </label>
                <input
                  type="number"
                  name="pricePerNight"
                  value={formData.pricePerNight}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Star Rating *
                </label>
                <select
                  name="starRating"
                  value={formData.starRating}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={1}>1 Star</option>
                  <option value={2}>2 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={5}>5 Stars</option>
                </select>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facilities *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  'Free WiFi', 'Parking', 'Air Conditioning', 'Room Service',
                  'Fitness Center', 'Swimming Pool', 'Restaurant', 'Bar',
                  'Spa', 'Conference Room', 'Laundry', 'Pet Friendly'
                ].map(facility => (
                  <label key={facility} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.facilities.includes(facility)}
                      onChange={() => handleFacilityChange(facility)}
                      className="mr-2"
                    />
                    <span className="text-sm">{facility}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Image URLs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URLs *
              </label>
              <div className="space-y-2">
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleImageUrlChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter image URL"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeImageUrl(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Add Image URL
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/my-hotels')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!validateForm() || isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Hotel' : 'Update Hotel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 