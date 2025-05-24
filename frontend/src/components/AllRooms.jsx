import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaBed, FaUsers, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { formatToIDR } from '../utils/currency';

const backend_url = import.meta.env.VITE_BACKEND_URL;

const capacityOptions = [
  { value: '1', label: '1+ Person' },
  { value: '2', label: '2+ People' },
  { value: '3', label: '3+ People' },
  { value: '4', label: '4+ People' }
];

const AllRooms = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests');
  // Function to handle room type selection
  const handleRoomTypeSelect = (type) => {
    // If clicking the same type again, reset to 'all'
    const newType = filters.roomType === type ? 'all' : type;
    setFilters(prev => ({ ...prev, roomType: newType }));
    setIsRoomTypeOpen(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Reset room type filter when searching
    if (e.target.value !== '') {
      setFilters(prev => ({ ...prev, roomType: 'all' }));
    }
  };

  const handleCapacitySelect = (capacity) => {
    // If clicking the same capacity again, reset to 'all'
    const newCapacity = filters.capacity === capacity ? 'all' : capacity;
    setFilters(prev => ({ ...prev, capacity: newCapacity, roomType: 'all' }));
    setIsCapacityOpen(false);
  };
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRoomTypeOpen, setIsRoomTypeOpen] = useState(false);
  const [isCapacityOpen, setIsCapacityOpen] = useState(false);
  const [availableRoomTypes, setAvailableRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const roomTypeRef = useRef(null);
  const capacityRef = useRef(null);
  const [filters, setFilters] = useState({
    roomType: 'all',
    capacity: 'all'
  });

  // Fetch rooms with availability
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        // Add date parameters to the request if they exist
        const queryParams = new URLSearchParams();
        if (checkIn) queryParams.append('checkIn', checkIn);
        if (checkOut) queryParams.append('checkOut', checkOut);
        
        const response = await axios.get(`${backend_url}/api/rooms?${queryParams}`);
        const roomsData = response.data;

        // Filter rooms based on guest capacity if guests parameter exists
        const filteredByGuests = guests 
          ? roomsData.filter(room => room.capacity >= parseInt(guests))
          : roomsData;

        setRooms(filteredByGuests);
        setFilteredRooms(filteredByGuests);

        // Extract unique room types
        const types = [...new Set(filteredByGuests.map(room => room.roomType))];
        setAvailableRoomTypes(types);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [checkIn, checkOut, guests]);

   

   


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roomTypeRef.current && !roomTypeRef.current.contains(event.target)) {
        setIsRoomTypeOpen(false);
      }
      if (capacityRef.current && !capacityRef.current.contains(event.target)) {
        setIsCapacityOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const roomTypes = useMemo(() => ['Executive', 'Deluxe', 'Suite'], []);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        console.log('Fetching rooms from:', `${backend_url}/api/rooms`);
        const { data } = await axios.get(`${backend_url}/api/rooms`);
        console.log('Received data:', data);
        const roomsData = Array.isArray(data) ? data : [];
        console.log('Processed roomsData:', roomsData);
        setRooms(roomsData);
        setFilteredRooms(roomsData);
        setAvailableRoomTypes(roomTypes);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        console.error('Error details:', error.response?.data || error.message);
        setRooms([]);
        setFilteredRooms([]);
        setAvailableRoomTypes([]);
      }
    };
    fetchRooms();
  }, [roomTypes]);

  useEffect(() => {
    let result = [...rooms];

    // Apply search
    if (searchTerm) {
      result = result.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.roomType !== 'all') {
      result = result.filter(room => room.roomType === filters.roomType);
    }

    if (filters.capacity !== 'all') {
      result = result.filter(room => room.capacity >= parseInt(filters.capacity));
    }

    setFilteredRooms(result);
  }, [searchTerm, filters, rooms]);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-secondary mb-2 tracking-widest uppercase">ALL ROOMS</p>
          <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4">Luxury Rooms</h2>
          <p className="text-text-light text-base max-w-2xl mx-auto">
            Find your perfect room for a comfortable stay
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-8 border border-gray-100 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="flex items-center bg-extra-light p-3 border border-gray-100">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search rooms..."
                className="bg-transparent w-full outline-none"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            {/* Room Type Filter */}
            <div className="relative flex items-center bg-extra-light p-3 border border-gray-100">
              <FaBed className="text-gray-400 mr-2" />
              <div className="relative w-full" ref={roomTypeRef}>
                <button
                  type="button"
                  className="flex justify-between items-center w-full bg-transparent text-text-dark cursor-pointer focus:outline-none"
                  onClick={() => setIsRoomTypeOpen(!isRoomTypeOpen)}
                >
                  <span>{filters.roomType === 'all' ? 'All Room Types' : filters.roomType}</span>
                  <svg className="h-4 w-4 text-text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isRoomTypeOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-md shadow-lg">
                    <div
                      className={`px-4 py-2 cursor-pointer hover:bg-extra-light ${filters.roomType === 'all' ? 'bg-extra-light' : ''}`}
                      onClick={() => {
                        setFilters({...filters, roomType: 'all'});
                        setIsRoomTypeOpen(false);
                      }}
                    >
                      All Room Types
                    </div>
                    {availableRoomTypes.map((type) => (
                      <div
                        key={type}
                        className={`px-4 py-2 cursor-pointer hover:bg-extra-light ${filters.roomType === type ? 'bg-extra-light text-secondary font-medium' : ''}`}
                        onClick={() => handleRoomTypeSelect(type)}
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Capacity Filter */}
            <div className="relative flex items-center bg-extra-light p-3 border border-gray-100">
              <FaUsers className="text-gray-400 mr-2" />
              <div className="relative w-full" ref={capacityRef}>
                <button
                  type="button"
                  className="flex justify-between items-center w-full bg-transparent text-text-dark cursor-pointer focus:outline-none"
                  onClick={() => setIsCapacityOpen(!isCapacityOpen)}
                >
                  <span>
                    {filters.capacity === 'all' ? 'Any Capacity' :
                     filters.capacity === '1' ? '1+ Person' :
                     `${filters.capacity}+ People`}
                  </span>
                  <svg className="h-4 w-4 text-text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isCapacityOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-md shadow-lg">
                    <div
                      className={`px-4 py-2 cursor-pointer hover:bg-extra-light ${filters.capacity === 'all' ? 'bg-extra-light' : ''}`}
                      onClick={() => {
                        setFilters({...filters, capacity: 'all'});
                        setIsCapacityOpen(false);
                      }}
                    >
                      Any Capacity
                    </div>
                    {capacityOptions.map(option => (
                      <div
                        key={option.value}
                        className={`px-4 py-2 cursor-pointer hover:bg-extra-light ${filters.capacity === option.value ? 'bg-extra-light text-secondary font-medium' : ''}`}
                        onClick={() => handleCapacitySelect(option.value)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Room Cards */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading rooms...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No rooms match your criteria
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roomTypes.map((type) => {
              const roomOfType = filteredRooms.find(room => room.roomType === type);
              if (!roomOfType) return null;
              
              return (
                <div 
                  key={roomOfType._id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/book/${roomOfType._id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/book/${roomOfType._id}`)}
                >
                  <div className="relative">
                    <img
                      src={roomOfType.images?.[0]?.url || '/placeholder-room.jpg'}
                      alt={roomOfType.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-secondary">
                      {formatToIDR(roomOfType.price)} / night
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{roomOfType.name}</h3>
                      <p className="text-gray-600 mt-1 line-clamp-2">{roomOfType.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <FaBed className="text-secondary" />
                        <span>{roomOfType.roomType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-secondary" />
                        <span>Up to {roomOfType.capacity} guests</span>
                      </div>
                    </div>

                    <div 
                      className="w-full py-2.5 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors font-medium text-center cursor-pointer"
                    >
                      Book Now
                    </div>
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        )}
      </div>
    </section>
  );
};

export default AllRooms;
