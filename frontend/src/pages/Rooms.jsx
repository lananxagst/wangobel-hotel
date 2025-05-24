import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaBed, FaUsers } from 'react-icons/fa';
import { formatToIDR } from '../utils/currency';
import { MdOutlineEventAvailable } from 'react-icons/md';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

const Rooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const checkIn = params.get('checkIn');
        const checkOut = params.get('checkOut');
        const guests = parseInt(params.get('guests')) || 1;

        let response;
        
        // If dates are selected, check availability first
        if (checkIn && checkOut) {
          const availabilityResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/rooms`,
            { params: { checkIn, checkOut, guests } }
          );

          // Filter rooms based on capacity
          const availableRooms = availabilityResponse.data.filter(room => 
            room.capacity >= guests
          );

          // Check if any suitable rooms are available
          const hasAvailableRooms = availableRooms.some(room => 
            room.availableRooms > 0
          );

          if (!hasAvailableRooms) {
            const formattedCheckIn = new Date(checkIn).toLocaleDateString();
            if (availabilityResponse.data.length > 0 && availabilityResponse.data.every(room => room.capacity < guests)) {
              toast.error(`No rooms available for ${guests} guests. Please select a smaller group size.`);
            } else {
              toast.error(`No rooms available for check-in date ${formattedCheckIn}`);
            }
          }

          response = { data: availableRooms };
        } else {
          // If no dates selected, just get all rooms but still filter by capacity
          const allRoomsResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/rooms`);
          const filteredRooms = allRoomsResponse.data.filter(room => room.capacity >= guests);
          
          if (filteredRooms.length === 0 && allRoomsResponse.data.length > 0) {
            toast.error(`No rooms available for ${guests} guests. Please select a smaller group size.`);
          }
          
          response = { data: filteredRooms };
        }

        // Set rooms data
        setRooms(response.data);

      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-tertiary flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tertiary py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-primary mb-8 text-center">Our Rooms</h1>
        
        <div className="grid grid-cols-1 gap-8">
          {rooms.map((room) => (
            <div key={room._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Image Slider */}
              <div className="relative h-96 group">
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  navigation
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  loop={true}
                  className="h-full
                    [&_.swiper-button-next]:text-white [&_.swiper-button-next]:bg-primary/80 [&_.swiper-button-next]:w-12 [&_.swiper-button-next]:h-12 [&_.swiper-button-next]:rounded-full [&_.swiper-button-next]:transition-all [&_.swiper-button-next]:opacity-0 group-hover:[&_.swiper-button-next]:opacity-100 [&_.swiper-button-next]:hover:bg-primary [&_.swiper-button-next]:after:text-lg [&_.swiper-button-next]:after:content-['next'] [&_.swiper-button-next]:right-4 [&_.swiper-button-next]:backdrop-blur-sm
                    [&_.swiper-button-prev]:text-white [&_.swiper-button-prev]:bg-primary/80 [&_.swiper-button-prev]:w-12 [&_.swiper-button-prev]:h-12 [&_.swiper-button-prev]:rounded-full [&_.swiper-button-prev]:transition-all [&_.swiper-button-prev]:opacity-0 group-hover:[&_.swiper-button-prev]:opacity-100 [&_.swiper-button-prev]:hover:bg-primary [&_.swiper-button-prev]:after:text-lg [&_.swiper-button-prev]:after:content-['prev'] [&_.swiper-button-prev]:left-4 [&_.swiper-button-prev]:backdrop-blur-sm
                    [&_.swiper-pagination-bullet]:w-3 [&_.swiper-pagination-bullet]:h-3 [&_.swiper-pagination-bullet]:bg-white/60 [&_.swiper-pagination-bullet]:transition-all [&_.swiper-pagination-bullet]:rounded-full [&_.swiper-pagination-bullet]:border [&_.swiper-pagination-bullet]:border-primary/20
                    [&_.swiper-pagination-bullet-active]:bg-primary [&_.swiper-pagination-bullet-active]:border-primary [&_.swiper-pagination-bullet-active]:scale-125
                    [&_.swiper-pagination]:bottom-6"
                >
                  {room.images.map((image, index) => (
                    <SwiperSlide key={index} className="relative">
                      <img
                        src={image.url || image}
                        alt={`${room.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/600x400?text=Room+Image';
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* Room Details */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-primary">{room.name}</h2>
                  <div className="flex items-center text-secondary">
                    <span className="text-2xl font-bold">{formatToIDR(room.price)}</span>
                    <span className="text-sm text-gray-500 ml-1">/night</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">{room.description}</p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaBed className="text-xl text-primary" />
                    <span>Type: {room.roomType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaUsers className="text-xl text-primary" />
                    <span>Max Capacity: {room.capacity} persons</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MdOutlineEventAvailable 
                      className={`text-xl ${room.availableRooms > 0 ? 'text-green-500' : 'text-red-500'}`} 
                    />
                    <span 
                      className={`text-sm font-medium ${room.isFullyBooked ? 'text-red-500' : 'text-green-500'}`}
                    >
                      {room.isFullyBooked ? (
                        'Fully Booked'
                      ) : (
                        `${room.availableRooms} rooms available`
                      )}
                    </span>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-primary mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {room.amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="px-3 py-1 bg-tertiary rounded-full text-sm text-gray-600"
                      >
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Book Now Button */}
                <button 
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    const checkIn = params.get('checkIn');
                    const checkOut = params.get('checkOut');
                    const guests = params.get('guests');

                    // Build URL with existing parameters
                    const bookingUrl = `/book/${room._id}?` + 
                      (checkIn ? `checkIn=${checkIn}&` : '') +
                      (checkOut ? `checkOut=${checkOut}&` : '') +
                      (guests ? `guests=${guests}` : '');

                    navigate(bookingUrl);
                  }}
                  disabled={room.isFullyBooked}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${room.isFullyBooked 
                    ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
                    : 'bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary'}`}
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rooms;
