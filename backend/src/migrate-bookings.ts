import mongoose from "mongoose";
import Booking from "./models/booking";

// Define the old hotel schema for migration purposes
interface OldHotelType {
  _id: string;
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
  lastUpdated: Date;
  bookings: any[];
}

const oldHotelSchema = new mongoose.Schema<OldHotelType>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  adultCount: { type: Number, required: true },
  childCount: { type: Number, required: true },
  facilities: [{ type: String, required: true }],
  pricePerNight: { type: Number, required: true },
  starRating: { type: Number, required: true, min: 1, max: 5 },
  imageUrls: [{ type: String, required: true }],
  lastUpdated: { type: Date, required: true },
  bookings: [{
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    adultCount: { type: Number, required: true },
    childCount: { type: Number, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    userId: { type: String, required: true },
    totalCost: { type: Number, required: true },
  }],
});

const OldHotel = mongoose.model<OldHotelType>("Hotel", oldHotelSchema);

async function migrateBookings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL as string);
    console.log("Connected to MongoDB");

    // Get all hotels with embedded bookings
    const hotels = await OldHotel.find({ "bookings.0": { $exists: true } });
    console.log(`Found ${hotels.length} hotels with embedded bookings`);

    let totalBookingsMigrated = 0;

    for (const hotel of hotels) {
      if (hotel.bookings && hotel.bookings.length > 0) {
        console.log(`Migrating ${hotel.bookings.length} bookings for hotel: ${hotel.name}`);
        
        // Create new booking documents
        const bookingPromises = hotel.bookings.map((booking: any) => {
          const newBooking = new Booking({
            userId: booking.userId,
            hotelId: hotel._id,
            firstName: booking.firstName,
            lastName: booking.lastName,
            email: booking.email,
            adultCount: booking.adultCount,
            childCount: booking.childCount,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            totalCost: booking.totalCost,
            createdAt: booking._id ? new Date(booking._id.getTimestamp()) : new Date(),
          });
          return newBooking.save();
        });

        await Promise.all(bookingPromises);
        totalBookingsMigrated += hotel.bookings.length;

        // Remove embedded bookings from hotel
        hotel.bookings = [];
        await hotel.save();
        
        console.log(`Successfully migrated bookings for hotel: ${hotel.name}`);
      }
    }

    console.log(`Migration completed! Total bookings migrated: ${totalBookingsMigrated}`);
    
    // Verify migration
    const totalBookings = await Booking.countDocuments();
    console.log(`Total bookings in new collection: ${totalBookings}`);

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateBookings();
}

export default migrateBookings; 