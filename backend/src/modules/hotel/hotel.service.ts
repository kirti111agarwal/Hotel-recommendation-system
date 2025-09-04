import Hotel from "../../models/hotel";
import { HotelType, HotelSearchResponse } from "../../shared/types";
import { ValidationError } from "../common/errors";

export interface HotelSearchParams {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  adultCount?: string;
  childCount?: string;
  page?: string;
  stars?: string[];
  types?: string[];
  facilities?: string[];
  maxPrice?: string;
  sortOption?: string;
}

export interface HotelCreateData {
  userId: string;
  name: string;
  city: string;
  country: string;
  description: string;
  type: string;
  adultCount: number;
  childCount: number;
  facilities: string[];
  pricePerNight: number;
  starRating: number;
  imageUrls: string[];
}

export interface HotelUpdateData extends Partial<HotelCreateData> {
  lastUpdated?: Date;
}

export class HotelService {
  /**
   * Create a new hotel
   */
  static async createHotel(hotelData: HotelCreateData): Promise<HotelType> {
    try {
      // Validate hotel data
      this.validateHotelData(hotelData);

      const hotel = new Hotel({
        ...hotelData,
        lastUpdated: new Date(),
      });

      const savedHotel = await hotel.save();
      return savedHotel.toObject();
    } catch (error: any) {
      throw new ValidationError(`Failed to create hotel: ${error.message}`);
    }
  }

  /**
   * Get hotel by ID with optional availability check
   */
  static async getHotelById(
    hotelId: string,
    checkIn?: string,
    checkOut?: string
  ): Promise<HotelType & { availability?: any }> {
    try {
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        throw new ValidationError("Hotel not found");
      }

      const hotelData = hotel.toObject();

      // If dates are provided, check availability
      if (checkIn && checkOut) {
        const availability = await this.checkAvailability(
          hotelId,
          new Date(checkIn),
          new Date(checkOut)
        );
        return { ...hotelData, availability };
      }

      return hotelData;
    } catch (error: any) {
      throw new ValidationError(`Failed to fetch hotel: ${error.message}`);
    }
  }

  /**
   * Update hotel by ID
   */
  static async updateHotel(
    hotelId: string,
    userId: string,
    updateData: HotelUpdateData
  ): Promise<HotelType> {
    try {
      const hotel = await Hotel.findOne({ _id: hotelId, userId });
      if (!hotel) {
        throw new ValidationError("Hotel not found or access denied");
      }

      // Validate update data if provided
      if (updateData.name || updateData.city || updateData.country) {
        this.validateHotelData({ ...hotel.toObject(), ...updateData });
      }

      const updatedHotel = await Hotel.findByIdAndUpdate(
        hotelId,
        {
          ...updateData,
          lastUpdated: new Date(),
        },
        { new: true }
      );

      if (!updatedHotel) {
        throw new ValidationError("Failed to update hotel");
      }

      return updatedHotel.toObject();
    } catch (error: any) {
      throw new ValidationError(`Failed to update hotel: ${error.message}`);
    }
  }

  /**
   * Delete hotel by ID
   */
  static async deleteHotel(hotelId: string, userId: string): Promise<void> {
    try {
      const hotel = await Hotel.findOneAndDelete({ _id: hotelId, userId });
      if (!hotel) {
        throw new ValidationError("Hotel not found or access denied");
      }
    } catch (error: any) {
      throw new ValidationError(`Failed to delete hotel: ${error.message}`);
    }
  }

  /**
   * Search hotels with filters and pagination
   */
  static async searchHotels(params: HotelSearchParams): Promise<HotelSearchResponse> {
    try {
      const query = this.constructSearchQuery(params);
      const sortOptions = this.getSortOptions(params.sortOption);
      const pageSize = 5;
      const pageNumber = parseInt(params.page || "1");
      const skip = (pageNumber - 1) * pageSize;

      const hotels = await Hotel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize);

      const total = await Hotel.countDocuments(query);

      return {
        data: hotels.map(hotel => hotel.toObject()),
        pagination: {
          total,
          page: pageNumber,
          pages: Math.ceil(total / pageSize),
        },
      };
    } catch (error: any) {
      throw new ValidationError(`Failed to search hotels: ${error.message}`);
    }
  }

  /**
   * Get all hotels for admin
   */
  static async getAllHotels(): Promise<HotelType[]> {
    try {
      const hotels = await Hotel.find().sort("-lastUpdated");
      return hotels.map(hotel => hotel.toObject());
    } catch (error: any) {
      throw new ValidationError(`Failed to fetch hotels: ${error.message}`);
    }
  }

  /**
   * Get hotels by owner
   */
  static async getHotelsByOwner(userId: string): Promise<HotelType[]> {
    try {
      const hotels = await Hotel.find({ userId }).sort("-lastUpdated");
      return hotels.map(hotel => hotel.toObject());
    } catch (error: any) {
      throw new ValidationError(`Failed to fetch user hotels: ${error.message}`);
    }
  }

  /**
   * Check hotel availability for given dates
   */
  static async checkAvailability(
    hotelId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<any> {
    try {
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        throw new ValidationError("Hotel not found");
      }

      // Import Booking model here to avoid circular dependency
      const Booking = (await import("../../models/booking")).default;
      
      const overlappingBookings = await Booking.find({
        hotelId: hotel._id,
        $or: [
          {
            checkIn: { $lt: checkOut },
            checkOut: { $gt: checkIn }
          }
        ]
      });

      const totalBookedAdults = overlappingBookings.reduce((total: number, booking: any) => {
        return total + booking.adultCount;
      }, 0);

      const totalBookedChildren = overlappingBookings.reduce((total: number, booking: any) => {
        return total + booking.childCount;
      }, 0);

      const totalBookedGuests = totalBookedAdults + totalBookedChildren;
      const maxCapacity = hotel.adultCount + hotel.childCount;
      const availableCapacity = maxCapacity - totalBookedGuests;
      
      const availableAdults = hotel.adultCount - totalBookedAdults;
      const availableChildren = hotel.childCount - totalBookedChildren;
      
      const isFullyBooked = availableCapacity <= 0;
      const isAdultsFullyBooked = availableAdults <= 0;
      const isChildrenFullyBooked = availableChildren <= 0;

      return {
        isFullyBooked,
        availableCapacity,
        totalBookedGuests,
        maxCapacity,
        overlappingBookings: overlappingBookings.length,
        totalBookedAdults,
        totalBookedChildren,
        availableAdults,
        availableChildren,
        isAdultsFullyBooked,
        isChildrenFullyBooked,
        maxAdults: hotel.adultCount,
        maxChildren: hotel.childCount
      };
    } catch (error: any) {
      throw new ValidationError(`Failed to check availability: ${error.message}`);
    }
  }

  /**
   * Validate hotel data
   */
  private static validateHotelData(data: any): void {
    if (!data.name || data.name.trim().length < 3) {
      throw new ValidationError("Hotel name must be at least 3 characters long");
    }

    if (!data.city || data.city.trim().length < 2) {
      throw new ValidationError("City must be at least 2 characters long");
    }

    if (!data.country || data.country.trim().length < 2) {
      throw new ValidationError("Country must be at least 2 characters long");
    }

    if (!data.description || data.description.trim().length < 10) {
      throw new ValidationError("Description must be at least 10 characters long");
    }

    if (!data.type || data.type.trim().length < 2) {
      throw new ValidationError("Hotel type must be at least 2 characters long");
    }

    if (!data.adultCount || data.adultCount < 1) {
      throw new ValidationError("Adult count must be at least 1");
    }

    if (!data.childCount || data.childCount < 0) {
      throw new ValidationError("Child count cannot be negative");
    }

    if (!data.facilities || data.facilities.length === 0) {
      throw new ValidationError("At least one facility must be selected");
    }

    if (!data.pricePerNight || data.pricePerNight < 0) {
      throw new ValidationError("Price per night cannot be negative");
    }

    if (!data.starRating || data.starRating < 1 || data.starRating > 5) {
      throw new ValidationError("Star rating must be between 1 and 5");
    }

    if (!data.imageUrls || data.imageUrls.length === 0) {
      throw new ValidationError("At least one image URL must be provided");
    }
  }

  /**
   * Construct search query from parameters
   */
  private static constructSearchQuery(params: HotelSearchParams): any {
    let constructedQuery: any = {};

    if (params.destination) {
      const regex = new RegExp(params.destination, "i");
      constructedQuery.$or = [
        { city: regex },
        { country: regex },
        { name: regex },
        { description: regex },
        { type: regex },
        { facilities: regex },
      ];
    }

    if (params.adultCount) {
      constructedQuery.adultCount = {
        $gte: parseInt(params.adultCount),
      };
    }

    if (params.childCount) {
      constructedQuery.childCount = {
        $gte: parseInt(params.childCount),
      };
    }

    if (params.facilities) {
      constructedQuery.facilities = {
        $all: Array.isArray(params.facilities)
          ? params.facilities
          : [params.facilities],
      };
    }

    if (params.types) {
      constructedQuery.type = {
        $in: Array.isArray(params.types)
          ? params.types
          : [params.types],
      };
    }

    if (params.stars) {
      const starRatings = Array.isArray(params.stars)
        ? params.stars.map((star: string) => parseInt(star))
        : parseInt(params.stars);

      constructedQuery.starRating = { $in: starRatings };
    }

    if (params.maxPrice) {
      constructedQuery.pricePerNight = {
        $lte: parseInt(params.maxPrice).toString(),
      };
    }

    return constructedQuery;
  }

  /**
   * Get sort options for search
   */
  private static getSortOptions(sortOption?: string): any {
    switch (sortOption) {
      case "starRating":
        return { starRating: -1 };
      case "pricePerNightAsc":
        return { pricePerNight: 1 };
      case "pricePerNightDesc":
        return { pricePerNight: -1 };
      default:
        return { lastUpdated: -1 };
    }
  }
} 