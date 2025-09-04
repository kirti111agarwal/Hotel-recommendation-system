import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import * as apiClient from '../api-client';

export const SimpleHotelForm: React.FC = () => {
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  
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
    imageUrls: [''] as string[]
  });

  const { mutate, isLoading } = useMutation(apiClient.addMyHotel, {
    onSuccess: () => {
      showToast({ message: 'Hotel created successfully!', type: 'SUCCESS' });
      navigate('/my-hotels');
    },
    onError: () => {
      showToast({ message: 'Error creating hotel', type: 'ERROR' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataObj = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => formDataObj.append(key, item));
      } else {
        formDataObj.append(key, value.toString());
      }
    });

    mutate(formDataObj);
  };

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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Hotel</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Hotel Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select type</option>
              <option value="Budget">Budget</option>
              <option value="Business">Business</option>
              <option value="Luxury">Luxury</option>
              <option value="Resort">Resort</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">City *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Country *</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Capacity & Pricing */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Adults *</label>
            <input
              type="number"
              name="adultCount"
              value={formData.adultCount}
              onChange={handleInputChange}
              min="1"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Children</label>
            <input
              type="number"
              name="childCount"
              value={formData.childCount}
              onChange={handleInputChange}
              min="0"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Price/Night *</label>
            <input
              type="number"
              name="pricePerNight"
              value={formData.pricePerNight}
              onChange={handleInputChange}
              min="0"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Stars *</label>
            <select
              name="starRating"
              value={formData.starRating}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
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
          <label className="block text-sm font-medium mb-2">Facilities *</label>
          <div className="grid grid-cols-3 gap-2">
            {['Free WiFi', 'Parking', 'Air Conditioning', 'Room Service', 'Restaurant', 'Bar'].map(facility => (
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

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium mb-1">Image URL *</label>
          <input
            type="url"
            name="imageUrls"
            value={formData.imageUrls[0]}
            onChange={(e) => setFormData(prev => ({ ...prev, imageUrls: [e.target.value] }))}
            className="w-full p-2 border rounded"
            placeholder="https://example.com/image.jpg"
            required
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/my-hotels')}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Creating...' : 'Create Hotel'}
          </button>
        </div>
      </form>
    </div>
  );
}; 