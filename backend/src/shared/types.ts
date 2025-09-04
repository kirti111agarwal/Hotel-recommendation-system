export type UserType = {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "user" | "hotel owner" | "admin";
  clickedHotels?: string[];
  emailOTP?: string;
  otpExpires?: Date;
};

export type HotelType = {
  _id: string;
  userId: string | UserType;
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
  availability?: {
    isFullyBooked: boolean;
    availableCapacity: number;
    totalBookedGuests: number;
    maxCapacity: number;
    overlappingBookings: number;
    // Separate adult and children tracking
    totalBookedAdults: number;
    totalBookedChildren: number;
    availableAdults: number;
    availableChildren: number;
    isAdultsFullyBooked: boolean;
    isChildrenFullyBooked: boolean;
    maxAdults: number;
    maxChildren: number;
  };
  algorithm?: {
    avgClickedPrice: number;
    priceDiff: number;
    priceSimilarity: string;
    rank: string;
    isClicked: boolean;
  };
};

export type BookingType = {
  _id: string;
  userId: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  adultCount: number;
  childCount: number;
  checkIn: Date;
  checkOut: Date;
  totalCost: number;
  createdAt?: Date;
};

export type HotelSearchResponse = {
  data: HotelType[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
};

export type PaymentIntentResponse = {
  paymentIntentId: string;
  clientSecret: string;
  totalCost: number;
};
