import Hotel from "../models/hotel";
import { HotelType } from "../shared/types";

export class SimpleRecommendationService {
  // Get price-based recommendations
  static async getRecommendations(hotelId?: string): Promise<HotelType[]> {
    try {
      if (!hotelId) {
        // Return random hotels if no hotelId provided
        const hotels = await Hotel.find();
        return hotels.sort(() => 0.5 - Math.random()).slice(0, 5);
      }

      // Get current hotel
      const currentHotel = await Hotel.findById(hotelId);
      if (!currentHotel) {
        return [];
      }

      // Get all other hotels
      const allHotels = await Hotel.find({ _id: { $ne: hotelId } });
      
      // Score hotels by price similarity
      const scoredHotels = allHotels.map(hotel => {
        const priceDiff = Math.abs(hotel.pricePerNight - currentHotel.pricePerNight);
        const similarity = Math.max(0, 100 - (priceDiff / currentHotel.pricePerNight * 100));
        return { ...hotel.toObject(), similarity };
      });

      // Return top 5 most similar hotels
      return scoredHotels
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
        .map(hotel => {
          const { similarity, ...hotelData } = hotel;
          return hotelData;
        });

    } catch (error) {
      throw new Error("Failed to get recommendations");
    }
  }

} 