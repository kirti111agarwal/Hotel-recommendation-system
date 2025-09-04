import Hotel from "../models/hotel";
import { HotelType } from "../shared/types";

export class SimpleHotelService {
  // Get all hotels
  static async getAllHotels(): Promise<HotelType[]> {
    try {
      const hotels = await Hotel.find().sort("-lastUpdated");
      return hotels.map(hotel => hotel.toObject());
    } catch (error) {
      throw new Error("Failed to fetch hotels");
    }
  }

  // Get hotel by ID
  static async getHotelById(hotelId: string): Promise<HotelType> {
    try {
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        throw new Error("Hotel not found");
      }
      return hotel.toObject();
    } catch (error) {
      throw new Error("Failed to fetch hotel");
    }
  }

  // Search hotels
  static async searchHotels(query: string): Promise<HotelType[]> {
    try {
      const regex = new RegExp(query, "i");
      const hotels = await Hotel.find({
        $or: [
          { name: regex },
          { city: regex },
          { country: regex },
          { description: regex }
        ]
      });
      return hotels.map(hotel => hotel.toObject());
    } catch (error) {
      throw new Error("Failed to search hotels");
    }
  }

  // Create hotel
  static async createHotel(hotelData: any): Promise<HotelType> {
    try {
      const hotel = new Hotel({
        ...hotelData,
        lastUpdated: new Date()
      });
      const savedHotel = await hotel.save();
      return savedHotel.toObject();
    } catch (error) {
      throw new Error("Failed to create hotel");
    }
  }

  // Update hotel
  static async updateHotel(hotelId: string, updateData: any): Promise<HotelType> {
    try {
      const hotel = await Hotel.findByIdAndUpdate(
        hotelId,
        { ...updateData, lastUpdated: new Date() },
        { new: true }
      );
      if (!hotel) {
        throw new Error("Hotel not found");
      }
      return hotel.toObject();
    } catch (error) {
      throw new Error("Failed to update hotel");
    }
  }

  // Delete hotel
  static async deleteHotel(hotelId: string): Promise<void> {
    try {
      const hotel = await Hotel.findByIdAndDelete(hotelId);
      if (!hotel) {
        throw new Error("Hotel not found");
      }
    } catch (error) {
      throw new Error("Failed to delete hotel");
    }
  }
} 