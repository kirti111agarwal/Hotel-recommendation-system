import { useMutation } from "react-query";
import ManageHotelForm from "../forms/ManageHotelForm/ManageHotelForm";
import { useAppContext } from "../contexts/AppContext";
import * as apiClient from "../api-client";
import { useNavigate } from "react-router-dom";

const AddHotel = () => {
  const { showToast } = useAppContext();
  const navigate = useNavigate();

  const { mutate, isLoading } = useMutation(apiClient.addMyHotel, {
    onSuccess: () => {
      showToast({ message: "Hotel Saved!", type: "SUCCESS" });
      // Redirect to My Hotels page after successful hotel addition
      navigate("/my-hotels");
    },
    onError: () => {
      showToast({ message: "Error Saving Hotel", type: "ERROR" });
    },
  });

  const handleSave = (hotelFormData: FormData) => {
    const hotelName = hotelFormData.get("name") as string;
    const hotelCity = hotelFormData.get("city") as string;
    const hotelCountry = hotelFormData.get("country") as string;
    const pricePerNight = hotelFormData.get("pricePerNight") as string;
    
    const isConfirmed = window.confirm(
      `Are you sure you want to add this hotel?\n\n` +
      `Hotel Name: ${hotelName}\n` +
      `Location: ${hotelCity}, ${hotelCountry}\n` +
      `Price per Night: ₨${pricePerNight}\n\n` +
      `This will add the hotel to your portfolio and make it available for bookings.`
    );
    
    if (isConfirmed) {
      mutate(hotelFormData);
    }
  };

  return <ManageHotelForm onSave={handleSave} isLoading={isLoading} />;
};

export default AddHotel;
