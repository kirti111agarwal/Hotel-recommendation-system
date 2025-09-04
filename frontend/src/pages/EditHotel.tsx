import { useMutation, useQuery } from "react-query";
import { useParams, useNavigate } from "react-router-dom";
import * as apiClient from "../api-client";
import ManageHotelForm from "../forms/ManageHotelForm/ManageHotelForm";
import { useAppContext } from "../contexts/AppContext";

const EditHotel = () => {
  const { hotelId } = useParams();
  const { showToast } = useAppContext();
  const navigate = useNavigate();

  const { data: hotel } = useQuery(
    "fetchMyHotelById",
    () => apiClient.fetchMyHotelById(hotelId || ""),
    {
      enabled: !!hotelId,
    }
  );

  const { mutate, isLoading } = useMutation(apiClient.updateMyHotelById, {
    onSuccess: () => {
      showToast({ message: "Hotel Saved!", type: "SUCCESS" });
      // Redirect to My Hotels page after successful hotel update
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
      `Are you sure you want to update this hotel?\n\n` +
      `Hotel Name: ${hotelName}\n` +
      `Location: ${hotelCity}, ${hotelCountry}\n` +
      `Price per Night: Rs${pricePerNight}\n\n` +
      `This will update the hotel details and may affect existing bookings.`
    );
    
    if (isConfirmed) {
      mutate(hotelFormData);
    }
  };

  return (
    <ManageHotelForm hotel={hotel} onSave={handleSave} isLoading={isLoading} />
  );
};

export default EditHotel;
