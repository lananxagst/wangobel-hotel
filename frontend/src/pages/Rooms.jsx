import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaBed, FaUsers } from 'react-icons/fa';
import { formatToIDR } from '../utils/currency';
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
          ).map(room => ({
            ...room,
            // Explicitly mark rooms as fully booked if they have 0 available rooms
            isFullyBooked: room.availableRooms <= 0
          }));

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
          const filteredRooms = allRoomsResponse.data.filter(room => room.capacity >= guests)
            .map(room => ({
              ...room,
              // Default isFullyBooked based on the totalRooms property
              isFullyBooked: (room.availableRooms || room.totalRooms || 0) <= 0
            }));
          
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
        <h1 className="text-4xl font-bold text-primary mb-12 text-center">All Type Rooms</h1>
        
        {/* REDESIGNED GRID LAYOUT - Responsif untuk berbagai ukuran layar */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {rooms.map((room) => (
            <div key={room._id} className="bg-white rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full">
              {/* Image Slider - Ukuran yang lebih proporsional */}
              <div className="relative aspect-[4/3] overflow-hidden group">
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  navigation
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  loop={true}
                  className="h-full w-full
                    [&_.swiper-button-next]:text-white [&_.swiper-button-next]:bg-primary/70 [&_.swiper-button-next]:w-10 [&_.swiper-button-next]:h-10 [&_.swiper-button-next]:rounded-full [&_.swiper-button-next]:transition-all [&_.swiper-button-next]:opacity-0 group-hover:[&_.swiper-button-next]:opacity-100 [&_.swiper-button-next]:hover:bg-primary [&_.swiper-button-next]:after:text-sm [&_.swiper-button-next]:after:content-['next'] [&_.swiper-button-next]:right-3 [&_.swiper-button-next]:backdrop-blur-sm
                    [&_.swiper-button-prev]:text-white [&_.swiper-button-prev]:bg-primary/70 [&_.swiper-button-prev]:w-10 [&_.swiper-button-prev]:h-10 [&_.swiper-button-prev]:rounded-full [&_.swiper-button-prev]:transition-all [&_.swiper-button-prev]:opacity-0 group-hover:[&_.swiper-button-prev]:opacity-100 [&_.swiper-button-prev]:hover:bg-primary [&_.swiper-button-prev]:after:text-sm [&_.swiper-button-prev]:after:content-['prev'] [&_.swiper-button-prev]:left-3 [&_.swiper-button-prev]:backdrop-blur-sm
                    [&_.swiper-pagination-bullet]:w-2.5 [&_.swiper-pagination-bullet]:h-2.5 [&_.swiper-pagination-bullet]:bg-white/60 [&_.swiper-pagination-bullet]:transition-all [&_.swiper-pagination-bullet]:rounded-full [&_.swiper-pagination-bullet]:border [&_.swiper-pagination-bullet]:border-primary/20
                    [&_.swiper-pagination-bullet-active]:bg-secondary [&_.swiper-pagination-bullet-active]:border-secondary [&_.swiper-pagination-bullet-active]:scale-125
                    [&_.swiper-pagination]:bottom-4"
                >
                  {room.images && room.images.length > 0 ? (
                    room.images.map((image, index) => (
                      <SwiperSlide key={index} className="relative">
                        <img
                          src={image.url || image}
                          alt={`${room.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/800x600?text=Room+Image';
                          }}
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        
                        {/* Room Type Badge */}
                        <div className="absolute top-4 right-4 bg-primary/80 text-white text-sm font-medium px-3 py-1 rounded-full backdrop-blur-sm">
                          {room.roomType}
                        </div>
                        
                        {/* Availability Badge */}
                        <div className={`absolute top-4 left-4 ${room.isFullyBooked ? 'bg-red-500/90' : 'bg-green-500/90'} text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm`}>
                          {room.isFullyBooked ? 'Fully Booked' : `${room.availableRooms} Available`}
                        </div>
                      </SwiperSlide>
                    ))
                  ) : (
                    <SwiperSlide>
                      <img
                        src="https://placehold.co/800x600?text=No+Images+Available"
                        alt="No room images"
                        className="w-full h-full object-cover"
                      />
                    </SwiperSlide>
                  )}
                </Swiper>
              </div>

              {/* Room Details - Layout yang lebih compact */}
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-bold text-primary line-clamp-1">{room.name}</h2>
                  <div className="flex flex-col items-end text-secondary">
                    <span className="text-xl font-bold">{formatToIDR(room.price)}</span>
                    <span className="text-xs text-gray-500">per night</span>
                  </div>
                </div>

                {/* Description dengan height terbatas */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{room.description}</p>

                {/* Features dengan layout yang lebih efisien */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <FaUsers className="text-primary" />
                    <span>{room.capacity} persons</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <FaBed className="text-primary" />
                    <span>{room.roomType}</span>
                  </div>
                </div>

                {/* Amenities dengan layout lebih compact */}
                <div className="mb-5 mt-auto">
                  <h3 className="text-sm font-semibold text-primary mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities && room.amenities.length > 0 ? (
                      room.amenities.slice(0, 6).map((amenity, index) => (
                        <div
                          key={index}
                          className="px-2 py-0.5 bg-tertiary rounded-full text-xs text-gray-600"
                        >
                          {amenity}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No amenities listed</span>
                    )}
                    {room.amenities && room.amenities.length > 6 && (
                      <div className="px-2 py-0.5 bg-tertiary rounded-full text-xs text-gray-600">
                        +{room.amenities.length - 6} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Book Now Button - Ditingkatkan */}
                <button 
                  onClick={() => {
                    // Only navigate if room is available
                    if (!room.isFullyBooked && room.availableRooms > 0) {
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
                    }
                  }}
                  disabled={room.isFullyBooked || room.availableRooms <= 0}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${(room.isFullyBooked || room.availableRooms <= 0) 
                    ? 'bg-gray-200 cursor-not-allowed text-gray-400 hover:shadow-none' 
                    : 'bg-secondary text-white hover:bg-secondary/90 hover:shadow-lg focus:ring-2 focus:ring-secondary/50'}`}
                >
                  {(room.isFullyBooked || room.availableRooms <= 0) ? 'Room Not Available' : 'Book Now'}
                </button>
                
                {room.isFullyBooked && (
                  <p className="text-xs text-red-500 text-center mt-1">Currently fully booked</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Tampilkan pesan jika tidak ada kamar */}
        {rooms.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h3 className="text-xl font-bold text-primary mb-2">No Rooms Available</h3>
            <p className="text-gray-600">Try changing your search criteria or dates.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms;
