import { useState, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import heroImage from '../assets/wg-kolamrenang.jpeg';

const Hero = () => {
  const navigate = useNavigate();
  const [selectedGuests, setSelectedGuests] = useState('1');
  const [checkinDate, setCheckinDate] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  const guestRef = useRef(null);
  
  // Fungsi untuk mengarahkan langsung ke halaman rooms dengan parameter tanggal dan jumlah tamu
  const navigateToRooms = () => {
    // Format tanggal untuk URL parameter
    const formattedCheckIn = checkinDate;
    const formattedCheckOut = checkoutDate;
    const guests = selectedGuests;
    
    // Navigasi ke halaman rooms dengan parameter
    navigate(`/rooms?checkIn=${formattedCheckIn}&checkOut=${formattedCheckOut}&guests=${guests}`);
  };

  const getNextDay = (date) => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return next.toISOString().split('T')[0];
  };

  const handleCheckinChange = (e) => {
    const newCheckinDate = e.target.value;
    setCheckinDate(newCheckinDate);
    
    // If checkout date is not at least one day after new checkin date, reset it
    if (checkoutDate && getNextDay(newCheckinDate) > checkoutDate) {
      setCheckoutDate('');
    }
  };

  const handleCheckoutChange = (e) => {
    const newCheckoutDate = e.target.value;
    if (!checkinDate) {
      alert('Please select check-in date first');
      e.target.value = ''; // Reset input
      return;
    }
    const minCheckoutDate = getNextDay(checkinDate);
    if (newCheckoutDate < minCheckoutDate) {
      alert('Check-out date must be at least one day after check-in date');
      e.target.value = ''; // Reset input
      return;
    }
    setCheckoutDate(newCheckoutDate);
  };


  return (
    <div className="relative">
      <section className="relative min-h-screen bg-primary">
        {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4 pb-32 pt-20 md:pt-20">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 leading-tight">
          The Perfect<br />Base For You
        </h1>
        <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto px-2">
          Experience luxury and comfort in our carefully curated spaces
        </p>
        <Link 
          to="/rooms"
          className="inline-block bg-secondary hover:bg-secondary/90 text-primary font-bold py-3 md:py-4 px-8 md:px-10 rounded-none transition-colors font-header tracking-wider uppercase text-sm"
        >
          Take A Tour
        </Link>
      </div>

      {/* Booking Form */}
      <div className="absolute left-0 right-0 bottom-0 transform translate-y-1/2 z-20 px-4">
        <div className="bg-white p-4 md:p-6 rounded-lg w-full max-w-4xl mx-auto shadow-lg">
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6" onSubmit={(e) => {
            e.preventDefault();
            
            // Validate dates
            if (!checkinDate || !checkoutDate) {
              toast.error('Please select both check-in and check-out dates');
              return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedCheckin = new Date(checkinDate);
            selectedCheckin.setHours(0, 0, 0, 0);

            if (selectedCheckin < today) {
              toast.error('Check-in date cannot be in the past');
              return;
            }

            const selectedCheckout = new Date(checkoutDate);
            if (selectedCheckout <= selectedCheckin) {
              toast.error('Check-out date must be after check-in date');
              return;
            }
            
            // Langsung arahkan ke halaman rooms
            navigateToRooms();
          }}>
            <div className="md:col-span-1">
              <div className="relative">
                <input
                  id="checkin"
                  type="date"
                  value={checkinDate}
                  onChange={handleCheckinChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-sm md:text-base"
                  placeholder="Check in"
                  required
                />
                <label className="absolute -top-2.5 left-2 bg-white px-2 text-xs md:text-sm font-medium text-gray-600">
                  Check in
                </label>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="relative">
                <input
                  id="checkout"
                  type="date"
                  value={checkoutDate}
                  onChange={handleCheckoutChange}
                  min={checkinDate ? getNextDay(checkinDate) : new Date().toISOString().split('T')[0]}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-sm md:text-base"
                  placeholder="Check out"
                  required
                />
                <label className="absolute -top-2.5 left-2 bg-white px-2 text-xs md:text-sm font-medium text-gray-600">
                  Check out
                </label>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="relative" ref={guestRef}>
                <select
                  value={selectedGuests}
                  onChange={(e) => setSelectedGuests(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all appearance-none text-sm md:text-base"
                  required
                >
                  <option value="1">1 Person</option>
                  <option value="2">2 People</option>
                  <option value="3">3 People</option>
                  <option value="4">4 People</option>
                </select>
                <label className="absolute -top-2.5 left-2 bg-white px-2 text-xs md:text-sm font-medium text-gray-600">
                  Guest
                </label>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90 text-primary font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg transition-colors text-sm md:text-base"
              >
                Check Availability
              </button>
            </div>
          </form>
        </div>
      </div>
      </section>
    </div>
  );
};

export default Hero;
