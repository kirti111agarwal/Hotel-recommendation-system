import express, { Request, Response } from "express";
import verifyToken, { requireRole } from "../middleware/auth";
import Hotel from "../models/hotel";
import Booking from "../models/booking";
import { HotelType, BookingType } from "../shared/types";

const router = express.Router();

// /api/my-bookings
router.get("/", verifyToken, requireRole(["user"]), async (req: Request, res: Response) => {
  try {
    // Get all bookings for the user
    const userBookings = await Booking.find({ userId: req.userId });
    
    // Get hotel IDs from bookings
    const hotelIds = userBookings.map(booking => booking.hotelId);
    
    // Get hotels for these bookings
    const hotels = await Hotel.find({ _id: { $in: hotelIds } });
    
    // Create a map of hotel data
    const hotelMap = new Map();
    hotels.forEach(hotel => {
      hotelMap.set(hotel._id.toString(), hotel);
    });
    
    // Combine booking data with hotel data
    const results = userBookings.map(booking => {
      const hotel = hotelMap.get(booking.hotelId);
      if (!hotel) return null;
      
      return {
        ...hotel.toObject(),
        bookings: [booking],
      };
    }).filter(result => result !== null);

    res.status(200).send(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});

// Add endpoint for user to cancel their booking for a specific hotel
router.delete("/:hotelId/:bookingId", verifyToken, requireRole(["user"]), async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findOne({ 
      _id: req.params.bookingId, 
      userId: req.userId,
      hotelId: req.params.hotelId 
    });
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found or not authorized" });
    }
    
    await Booking.findByIdAndDelete(req.params.bookingId);
    res.status(200).json({ message: "Booking cancelled" });
  } catch (error) {
    res.status(500).json({ message: "Unable to cancel booking" });
  }
});

export default router;
