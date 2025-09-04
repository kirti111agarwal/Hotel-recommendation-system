const Footer = () => {
  return (
    <div className="bg-[#5F9EA0] text-white py-10">
      <div className="container mx-auto flex justify-between items-center">
        <span className="p- text-3xl text-pink-1000 font-bold tracking-tight">
          PrimeStays
        </span>
        <span className="text-white font-bold tracking-tight flex gap-4">
          <p className="cursor-pointer">Privacy Policy</p>
          <p className="cursor-pointer">Terms of Service</p>
        </span>
      </div>
    </div>
  );
};

export default Footer;
