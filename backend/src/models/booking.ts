import mongoose from "mongoose";
import { BookingType } from "../shared/types";

const bookingSchema = new mongoose.Schema<BookingType>({
  userId: { type: String, required: true },
  hotelId: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  adultCount: { type: Number, required: true },
  childCount: { type: Number, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  totalCost: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Create indexes for better query performance
bookingSchema.index({ userId: 1 });
bookingSchema.index({ hotelId: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });
bookingSchema.index({ hotelId: 1, checkIn: 1, checkOut: 1 });

const Booking = mongoose.model<BookingType>("Booking", bookingSchema);

export default Booking; 