import express, { Request, Response } from "express";
import Hotel from "../models/hotel";
import Booking from "../models/booking";
import { BookingType, HotelSearchResponse, UserType } from "../shared/types";
import { param, validationResult } from "express-validator";
import Stripe from "stripe";
import verifyToken, { requireRole } from "../middleware/auth";
import User from "../models/user";

const stripe = new Stripe(process.env.STRIPE_API_KEY as string);

const router = express.Router();

router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = constructSearchQuery(req.query);

    let sortOptions = {};
    switch (req.query.sortOption) {
      case "starRating":
        sortOptions = { starRating: -1 };
        break;
      case "pricePerNightAsc":
        sortOptions = { pricePerNight: 1 };
        break;
      case "pricePerNightDesc":
        sortOptions = { pricePerNight: -1 };
        break;
    }

    const pageSize = 5;
    const pageNumber = parseInt(
      req.query.page ? req.query.page.toString() : "1"
    );
    const skip = (pageNumber - 1) * pageSize;

    const hotels = await Hotel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    const total = await Hotel.countDocuments(query);

    const response: HotelSearchResponse = {
      data: hotels,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    };

    res.json(response);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find().sort("-lastUpdated");
    res.json(hotels);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

// Simple price-based content filtering recommendation algorithm

router.get("/recommendations", async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.query;

    // Fetch all hotels
    const allHotels = await Hotel.find();
    if (allHotels.length === 0) {
      return res.json([]);
    }

    // If no hotelId provided, return 5 random hotels
    if (!hotelId) {
      const randomHotels = allHotels.sort(() => 0.5 - Math.random()).slice(0, 5);
      return res.json(randomHotels);
    }

    // Handle different types of hotelId
    let hotelIdString: string;
    if (Array.isArray(hotelId)) {
      hotelIdString = hotelId[0] as string;
    } else if (typeof hotelId === 'string') {
      hotelIdString = hotelId;
    } else if (typeof hotelId === 'object' && hotelId !== null) {
      // If it's an object, try to extract the actual ID
      const hotelIdObj = hotelId as any;
      if ('_id' in hotelIdObj) {
        hotelIdString = hotelIdObj._id;
      } else if ('id' in hotelIdObj) {
        hotelIdString = hotelIdObj.id;
      } else {
        const randomHotels = allHotels.sort(() => 0.5 - Math.random()).slice(0, 5);
        return res.json(randomHotels);
      }
    } else {
      hotelIdString = String(hotelId);
    }

    // Validate that hotelIdString looks like a valid ObjectId
    if (!hotelIdString || hotelIdString === '[object Object]' || hotelIdString.length !== 24) {
      const randomHotels = allHotels.sort(() => 0.5 - Math.random()).slice(0, 5);
      return res.json(randomHotels);
    }

    // Get the current hotel being viewed
    const currentHotel = await Hotel.findById(hotelIdString);
    if (!currentHotel) {
      const randomHotels = allHotels.sort(() => 0.5 - Math.random()).slice(0, 5);
      return res.json(randomHotels);
    }

    const currentPrice = currentHotel.pricePerNight;

    // Score all hotels by how similar they are in price to the current hotel
    const scoredHotels = allHotels
      .filter(hotel => hotel._id.toString() !== hotelIdString) // excluding current hotel
      .map(hotel => {
        const priceDiff = Math.abs(hotel.pricePerNight - currentPrice);
        const priceSimilarity = Math.max(0, 100 - (priceDiff / currentPrice * 100));

        return {
          ...hotel.toObject(),
          algorithm: {
            currentHotel: currentHotel.name,
            currentPrice,
            priceDiff,
            priceSimilarity: priceSimilarity.toFixed(1) + "%"
          }
        };
      });

    // Sort by price similarity (closest first) and return top 5
    const topRecommendations = scoredHotels
      .sort((a, b) =>
        parseFloat(b.algorithm.priceSimilarity) - parseFloat(a.algorithm.priceSimilarity)
      )
      .slice(0, 5);

    return res.json(topRecommendations);

  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      message: "Unable to fetch recommendations",
      error: err.message
    });
  }
});




router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Hotel ID is required")],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = req.params.id.toString();
    const { checkIn, checkOut } = req.query;

    try {
      const hotel = await Hotel.findById(id);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // If dates are provided, check availability
      if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn as string);
        const checkOutDate = new Date(checkOut as string);
        
        // Find overlapping bookings from separate booking collection
        const overlappingBookings = await Booking.find({
          hotelId: hotel._id,
          $or: [
            {
              checkIn: { $lt: checkOutDate },
              checkOut: { $gt: checkInDate }
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

        return res.json({
          ...hotel.toObject(),
          availability: {
            isFullyBooked,
            availableCapacity,
            totalBookedGuests,
            maxCapacity,
            overlappingBookings: overlappingBookings.length,
            // Separate adult and children tracking
            totalBookedAdults,
            totalBookedChildren,
            availableAdults,
            availableChildren,
            isAdultsFullyBooked,
            isChildrenFullyBooked,
            maxAdults: hotel.adultCount,
            maxChildren: hotel.childCount
          }
        });
      }

      res.json(hotel);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error fetching hotel" });
    }
  }
);

router.post(
  "/:hotelId/bookings/payment-intent",
  verifyToken,
  requireRole(["user"]),
  async (req: Request, res: Response) => {
    const { numberOfNights, adultCount, childCount } = req.body;
    const hotelId = req.params.hotelId;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(400).json({ message: "Hotel not found" });
    }

    // Check capacity before creating payment intent
    const totalGuests = adultCount + childCount;
    const maxCapacity = hotel.adultCount + hotel.childCount;

    // Check if adult count exceeds hotel's adult capacity
    if (adultCount > hotel.adultCount) {
      return res.status(400).json({ 
        message: `Adult capacity exceeded. Hotel can accommodate ${hotel.adultCount} adults. You requested ${adultCount} adults.`,
        availableCapacity: maxCapacity,
        requestedGuests: totalGuests,
        hotelCapacity: {
          adultCount: hotel.adultCount,
          childCount: hotel.childCount
        },
        requestedCapacity: {
          adultCount,
          childCount
        }
      });
    }

    // Check if child count exceeds hotel's child capacity
    if (childCount > hotel.childCount) {
      return res.status(400).json({ 
        message: `Children capacity exceeded. Hotel can accommodate ${hotel.childCount} children. You requested ${childCount} children.`,
        availableCapacity: maxCapacity,
        requestedGuests: totalGuests,
        hotelCapacity: {
          adultCount: hotel.adultCount,
          childCount: hotel.childCount
        },
        requestedCapacity: {
          adultCount,
          childCount
        }
      });
    }

    if (totalGuests > maxCapacity) {
      return res.status(400).json({ 
        message: `Guest capacity exceeded. Hotel can accommodate ${maxCapacity} guests (${hotel.adultCount} adults + ${hotel.childCount} children). You requested ${totalGuests} guests.`,
        availableCapacity: maxCapacity,
        requestedGuests: totalGuests,
        hotelCapacity: {
          adultCount: hotel.adultCount,
          childCount: hotel.childCount
        },
        requestedCapacity: {
          adultCount,
          childCount
        }
      });
    }

    // Calculate total cost based on number of adults
    // Adults pay full price, children are typically free or discounted
    const adultCost = hotel.pricePerNight * adultCount * numberOfNights;
    const childCost = 0; // Children are free, or you can modify this for child pricing
    const totalCost = adultCost + childCost;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCost * 100,
      currency: "gbp",
      metadata: {
        hotelId,
        userId: req.userId,
      },
    });

    if (!paymentIntent.client_secret) {
      return res.status(500).json({ message: "Error creating payment intent" });
    }

    const response = {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret.toString(),
      totalCost,
    };

    res.send(response);
  }
);

router.post(
  "/:hotelId/bookings",
  verifyToken,
  requireRole(["user"]),
  async (req: Request, res: Response) => {
    try {
      const paymentIntentId = req.body.paymentIntentId;

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId as string
      );

      if (!paymentIntent) {
        return res.status(400).json({ message: "payment intent not found" });
      }

      if (
        paymentIntent.metadata.hotelId !== req.params.hotelId ||
        paymentIntent.metadata.userId !== req.userId
      ) {
        return res.status(400).json({ message: "payment intent mismatch" });
      }

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          message: `payment intent not succeeded. Status: ${paymentIntent.status}`,
        });
      }

      // Check hotel capacity before booking
      const hotel = await Hotel.findById(req.params.hotelId);
      if (!hotel) {
        return res.status(400).json({ message: "hotel not found" });
      }

      const { adultCount, childCount, checkIn, checkOut } = req.body;
      const totalGuests = adultCount + childCount;
      const maxCapacity = hotel.adultCount + hotel.childCount;

      // Check if adult count exceeds hotel's adult capacity
      if (adultCount > hotel.adultCount) {
        return res.status(400).json({ 
          message: `Adult capacity exceeded. Hotel can accommodate ${hotel.adultCount} adults. You requested ${adultCount} adults.`,
          availableCapacity: maxCapacity,
          requestedGuests: totalGuests,
          hotelCapacity: {
            adultCount: hotel.adultCount,
            childCount: hotel.childCount
          },
          requestedCapacity: {
            adultCount,
            childCount
          }
        });
      }

      // Check if child count exceeds hotel's child capacity
      if (childCount > hotel.childCount) {
        return res.status(400).json({ 
          message: `Children capacity exceeded. Hotel can accommodate ${hotel.childCount} children. You requested ${childCount} children.`,
          availableCapacity: maxCapacity,
          requestedGuests: totalGuests,
          hotelCapacity: {
            adultCount: hotel.adultCount,
            childCount: hotel.childCount
          },
          requestedCapacity: {
            adultCount,
            childCount
          }
        });
      }

      // Check if the requested guest count exceeds hotel capacity
      if (totalGuests > maxCapacity) {
        return res.status(400).json({ 
          message: `Guest capacity exceeded. Hotel can accommodate ${maxCapacity} guests (${hotel.adultCount} adults + ${hotel.childCount} children). You requested ${totalGuests} guests.`,
          availableCapacity: maxCapacity,
          requestedGuests: totalGuests,
          hotelCapacity: {
            adultCount: hotel.adultCount,
            childCount: hotel.childCount
          },
          requestedCapacity: {
            adultCount,
            childCount
          }
        });
      }

      const newBooking = new Booking({
        ...req.body,
        userId: req.userId,
        hotelId: req.params.hotelId,
      });

      await newBooking.save();
      res.status(200).send();
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "something went wrong" });
    }
  }
);

// Record a hotel click for recommendations
router.post("/:hotelId/click", verifyToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const hotelId = req.params.hotelId;
    if (!user.clickedHotels) user.clickedHotels = [];
    
    // Only add if not already present, and keep last 20
    if (!user.clickedHotels.includes(hotelId)) {
      user.clickedHotels.push(hotelId);
      if (user.clickedHotels.length > 20) user.clickedHotels = user.clickedHotels.slice(-20);
      await user.save();
    }
    
    res.status(200).json({ message: "Hotel click recorded" });
  } catch (error) {
    res.status(500).json({ message: "Unable to record hotel click" });
  }
});

// Admin: Get all hotels
router.get("/admin/all", verifyToken, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find();
    const userIds = hotels.map(hotel => hotel.userId);
    const users = await User.find({ _id: { $in: userIds } }, 'firstName lastName email');
    
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user._id.toString(), user);
    });
    
    const hotelsWithOwners = hotels.map(hotel => ({
      ...hotel.toObject(),
      userId: userMap.get(hotel.userId) || { firstName: 'Unknown', lastName: 'Owner', email: 'unknown@example.com' }
    }));
    
    res.json(hotelsWithOwners);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels" });
  }
});
// Admin: Delete any hotel
router.delete("/admin/:hotelId", verifyToken, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    res.status(200).json({ message: "Hotel deleted" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

const constructSearchQuery = (queryParams: any) => {
  let constructedQuery: any = {};

  if (queryParams.destination) {
    const regex = new RegExp(queryParams.destination, "i");
    constructedQuery.$or = [
      { city: regex },
      { country: regex },
      { name: regex },
      { description: regex },
      { type: regex },
      { facilities: regex },
    ];
  }

  if (queryParams.adultCount) {
    constructedQuery.adultCount = {
      $gte: parseInt(queryParams.adultCount),
    };
  }

  if (queryParams.childCount) {
    constructedQuery.childCount = {
      $gte: parseInt(queryParams.childCount),
    };
  }

  if (queryParams.facilities) {
    constructedQuery.facilities = {
      $all: Array.isArray(queryParams.facilities)
        ? queryParams.facilities
        : [queryParams.facilities],
    };
  }

  if (queryParams.types) {
    constructedQuery.type = {
      $in: Array.isArray(queryParams.types)
        ? queryParams.types
        : [queryParams.types],
    };
  }

  if (queryParams.stars) {
    const starRatings = Array.isArray(queryParams.stars)
      ? queryParams.stars.map((star: string) => parseInt(star))
      : parseInt(queryParams.stars);

    constructedQuery.starRating = { $in: starRatings };
  }

  if (queryParams.maxPrice) {
    constructedQuery.pricePerNight = {
      $lte: parseInt(queryParams.maxPrice).toString(),
    };
  }

  return constructedQuery;
};

export default router;
