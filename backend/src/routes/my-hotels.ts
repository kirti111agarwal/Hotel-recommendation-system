import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import Hotel from "../models/hotel";
import Booking from "../models/booking";
import verifyToken, { requireRole } from "../middleware/auth";
import { body } from "express-validator";
import { HotelType } from "../shared/types";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

router.post(
  "/",
  verifyToken,
  requireRole(["hotel owner"]),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("type").notEmpty().withMessage("Hotel type is required"),
    body("pricePerNight")
      .notEmpty()
      .isNumeric()
      .withMessage("Price per night is required and must be a number"),
    body("facilities")
      .notEmpty()
      .isArray()
      .withMessage("Facilities are required"),
  ],
  upload.array("imageFiles", 6),
  async (req: Request, res: Response) => {
    try {
      const imageFiles = req.files as Express.Multer.File[];
      const newHotel: HotelType = req.body;

      const imageUrls = await uploadImages(imageFiles);

      newHotel.imageUrls = imageUrls;
      newHotel.lastUpdated = new Date();
      newHotel.userId = req.userId;

      const hotel = new Hotel(newHotel);
      await hotel.save();

      res.status(201).send(hotel);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

router.get("/", verifyToken, requireRole(["hotel owner"]), async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ userId: req.userId });
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

router.get("/:id", verifyToken, requireRole(["hotel owner"]), async (req: Request, res: Response) => {
  const id = req.params.id.toString();
  try {
    const hotel = await Hotel.findOne({
      _id: id,
      userId: req.userId,
    });
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

router.put(
  "/:hotelId",
  verifyToken,
  requireRole(["hotel owner"]),
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      const updatedHotel: HotelType = req.body;
      updatedHotel.lastUpdated = new Date();

      const hotel = await Hotel.findOneAndUpdate(
        {
          _id: req.params.hotelId,
          userId: req.userId,
        },
        updatedHotel,
        { new: true }
      );

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      const files = req.files as Express.Multer.File[];
      const updatedImageUrls = await uploadImages(files);

      hotel.imageUrls = [
        ...updatedImageUrls,
        ...(updatedHotel.imageUrls || []),
      ];

      await hotel.save();
      res.status(201).json(hotel);
    } catch (error) {
      res.status(500).json({ message: "Something went throw" });
    }
  }
);

// Add DELETE endpoint for hotel owner and admin
router.delete(
  "/:hotelId",
  verifyToken,
  requireRole(["hotel owner", "admin"]),
  async (req: Request, res: Response) => {
    try {
      const filter: any = { _id: req.params.hotelId };
      if (req.userRole !== "admin") {
        filter.userId = req.userId;
      }
      const hotel = await Hotel.findOneAndDelete(filter);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found or not authorized" });
      }
      res.status(200).json({ message: "Hotel deleted" });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

// Add endpoint for hotel owner to view bookings for a specific hotel
router.get("/:hotelId/bookings", verifyToken, requireRole(["hotel owner"]), async (req: Request, res: Response) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.hotelId, userId: req.userId });
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found or not authorized" });
    }
    const bookings = await Booking.find({ hotelId: req.params.hotelId });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});

// Add endpoint for hotel owner to cancel a user's booking for their hotel
router.delete("/:hotelId/bookings/:bookingId", verifyToken, requireRole(["hotel owner", "admin"]), async (req: Request, res: Response) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.hotelId, userId: req.userId });
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found or not authorized" });
    }
    const booking = await Booking.findOne({ _id: req.params.bookingId, hotelId: req.params.hotelId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    await Booking.findByIdAndDelete(req.params.bookingId);
    res.status(200).json({ message: "Booking cancelled by hotel owner" });
  } catch (error) {
    res.status(500).json({ message: "Unable to cancel booking" });
  }
});

async function uploadImages(imageFiles: Express.Multer.File[]) {
  const uploadPromises = imageFiles.map(async (image) => {
    const b64 = Buffer.from(image.buffer).toString("base64");
    let dataURI = "data:" + image.mimetype + ";base64," + b64;
    const res = await cloudinary.v2.uploader.upload(dataURI);
    return res.url;
  });

  const imageUrls = await Promise.all(uploadPromises);
  return imageUrls;
}

export default router;
