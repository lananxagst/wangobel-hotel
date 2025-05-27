import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaUsers, FaCreditCard, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { formatToIDR, convertToMidtransAmount } from '../utils/currency';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const BookingPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    return {
      checkIn: params.get('checkIn') || '',
      checkOut: params.get('checkOut') || '',
      guests: parseInt(params.get('guests')) || 1,
      name: '',
      email: '',
      phone: '',
      specialRequests: ''
    };
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState(null);

  const [errors, setErrors] = useState({});

  // Fetch room details when component mounts
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/rooms/${roomId}`);
        setRoom(response.data);
      } catch (error) {
        console.error('Error fetching room:', error);
        navigate('/');
      }
    };
    fetchRoom();
  }, [roomId, navigate]);

  const checkRoomAvailability = async (checkIn) => {
    try {
      if (!roomId || !checkIn) {
        setErrors(prev => ({ ...prev, availability: '' }));
        return;
      }
      
      // Format tanggal ke YYYY-MM-DD di UTC
      const checkInDate = new Date(checkIn);
      // Set ke UTC midnight untuk konsistensi dengan backend
      const utcDate = new Date(Date.UTC(
        checkInDate.getFullYear(),
        checkInDate.getMonth(),
        checkInDate.getDate()
      ));
      // Format tanggal untuk API request
      const formattedDate = utcDate.toISOString().split('T')[0];
      
      console.log('Checking availability for:', {
        checkIn: formattedDate,
        localDate: utcDate.toLocaleDateString()
      });
      
      // Tambahkan timestamp untuk menghindari caching
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${backendUrl}/api/rooms/${roomId}?checkIn=${formattedDate}&_t=${timestamp}`,
        {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Room availability response:', data); // Debug log
      
      // Update room data
      setRoom(data);
      
      // Check availability
      const isAvailable = data.availableRooms && data.availableRooms > 0;
      console.log('Room availability:', {
        isAvailable,
        availableRooms: data.availableRooms,
        totalRooms: data.totalRooms
      });
      
      if (!isAvailable) {
        const errorMessage = `No rooms available for check-in date ${utcDate.toLocaleDateString()}`;
        console.log('Setting error:', errorMessage);
        setErrors(prev => ({
          ...prev,
          availability: errorMessage
        }));
      } else {
        console.log('Clearing availability error');
        setErrors(prev => ({
          ...prev,
          availability: ''
        }));
      }
    } catch (error) {
      console.error('Error checking room availability:', error);
      toast.error('Error checking room availability');
      setErrors(prev => ({
        ...prev,
        availability: 'Error checking room availability'
      }));
    }
  };

  const isRoomAvailable = () => {
    return room && room.availableRooms && room.availableRooms > 0;
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Cek ketersediaan kamar saat tanggal check-in berubah
    if (name === 'checkIn') {
      await checkRoomAvailability(value);
    }

    // Validasi tanggal
    if (name === 'checkIn' || name === 'checkOut') {
      const checkIn = name === 'checkIn' ? value : bookingData.checkIn;
      const checkOut = name === 'checkOut' ? value : bookingData.checkOut;
      
      // Jika ini adalah perubahan check-in date, cek ketersediaan terlebih dahulu
      if (name === 'checkIn') {
        await checkRoomAvailability(value);
      }

      // Jika salah satu tanggal belum diisi, tidak perlu validasi lebih lanjut
      if (!checkIn || !checkOut) return;

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      checkInDate.setHours(0, 0, 0, 0);
      checkOutDate.setHours(0, 0, 0, 0);
      
      // Validasi check-out harus setelah check-in
      if (checkOutDate <= checkInDate) {
        if (name === 'checkIn') {
          // Reset check-out date jika check-in date berubah dan membuat check-out invalid
          setBookingData(prev => ({
            ...prev,
            checkOut: ''
          }));
        }
        setErrors(prev => ({
          ...prev,
          checkOut: 'Check-out date must be after check-in date'
        }));
        return;
      } else {
        // Clear check-out error jika tanggal valid
        setErrors(prev => ({
          ...prev,
          checkOut: ''
        }));
      }
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!bookingData.checkIn) {
        newErrors.checkIn = 'Check-in date is required';
      }
      if (!bookingData.checkOut) {
        newErrors.checkOut = 'Check-out date is required';
      } else {
        const checkIn = new Date(bookingData.checkIn);
        const checkOut = new Date(bookingData.checkOut);
        if (checkOut <= checkIn) {
          newErrors.checkOut = 'Check-out date must be after check-in date';
        }
      }
      if (!bookingData.guests) {
        newErrors.guests = 'Number of guests is required';
      }
      
      // Validasi ketersediaan kamar
      if (!room || room.availableRooms <= 0) {
        newErrors.availability = 'No rooms available for the selected dates';
      }
    } else if (step === 2) {
      if (!bookingData.name) newErrors.name = 'Name is required';
      if (!bookingData.email) newErrors.email = 'Email is required';
      if (!bookingData.phone) newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    // Re-check availability if on dates step
    if (currentStep === 1) {
      await checkRoomAvailability(bookingData.checkIn);
      if (!isRoomAvailable()) {
        toast.error('This room is no longer available for the selected dates');
        return;
      }
    }
    
    // Validate step
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setLoading(true);
      setErrors({});

      // Get token dari localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to make a booking');
        navigate('/login', { state: { from: `/book/${roomId}` } });
        return;
      }

      // Re-check room availability
      await checkRoomAvailability(bookingData.checkIn);
      if (!room || room.availableRooms <= 0) {
        toast.error('Sorry, this room is no longer available for the selected dates');
        return;
      }

      // Calculate total amount
      const checkInDate = new Date(bookingData.checkIn);
      const checkOutDate = new Date(bookingData.checkOut);
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      const totalInK = nights * room.price; // Calculate total in K (e.g., 2 nights * 100K = 200K)
      const totalAmountMidtrans = convertToMidtransAmount(totalInK); // Convert to actual rupiah for Midtrans (200K -> 200000)

      // Create booking data with consistent ID format and timestamp
      const bookingId = `BOOK-${Date.now()}`;
      const tempBooking = {
        _id: bookingId,
        createdAt: Date.now(), // Add timestamp for auto-cleanup
        roomId: roomId,
        roomName: room.name,
        roomType: room.roomType,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        numberOfGuests: bookingData.guests,
        guestName: bookingData.name,
        guestEmail: bookingData.email,
        guestPhone: bookingData.phone,
        specialRequests: bookingData.specialRequests,
        totalAmount: totalInK, // Store amount in K for display
        totalAmountMidtrans: totalAmountMidtrans, // Store full rupiah amount for Midtrans
        status: 'pending',

        paymentMethod: 'midtrans'
      };

      // Save to localStorage
      const pendingBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
      pendingBookings.push(tempBooking);
      localStorage.setItem('pendingBookings', JSON.stringify(pendingBookings));

      // Navigate to payment page
      navigate('/payment', {
        state: {
          bookingData: tempBooking,
          totalAmount: tempBooking.totalAmount
        }
      });
    } catch (error) {
      console.error('Error processing booking:', error);
      toast.error(error.response?.data?.message || 'Failed to process booking');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Dates & Guests', icon: FaCalendarAlt },
    { number: 2, title: 'Guest Details', icon: FaUsers },
    { number: 3, title: 'Confirmation', icon: FaCreditCard }
  ];

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <FaClock className="animate-spin text-3xl text-secondary" />
          <span className="text-gray-600 font-medium">Loading room details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Book Your Stay</h1>
          <p className="text-gray-600 mt-2">Complete your booking in 3 simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-12 px-4">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex-1 relative">
                {index > 0 && (
                  <div 
                    className={`absolute w-[calc(100%-40px)] h-1 top-5 -left-[calc(50%-20px)] ${currentStep > step.number ? 'bg-secondary' : 'bg-gray-200'}`}
                  />
                )}
                <div className="relative flex flex-col items-center group">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${currentStep === step.number ? 'bg-secondary text-white ring-4 ring-secondary/30' : 
                        currentStep > step.number ? 'bg-secondary text-white' : 
                        'bg-white text-gray-400 border-2 border-gray-300'}`}
                  >
                    <step.icon className="w-4 h-4" />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-gray-800">
                    {step.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 lg:px-8 flex flex-col lg:flex-row gap-8">
          {/* Booking Form */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-lg p-8 h-full">
              <div className="space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-4 mb-6">
                      <h2 className="text-xl font-semibold text-gray-800">Select Your Dates</h2>
                      <p className="text-gray-500 text-sm mt-1">Choose your check-in and check-out dates</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                        <input
                          type="date"
                          name="checkIn"
                          value={bookingData.checkIn}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-gray-900 placeholder-gray-500"
                          required
                        />
                        {errors.checkIn && (
                          <p className="mt-1 text-sm text-red-500">{errors.checkIn}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                        <input
                          type="date"
                          name="checkOut"
                          value={bookingData.checkOut}
                          onChange={handleInputChange}
                          min={bookingData.checkIn ? new Date(new Date(bookingData.checkIn).getTime() + 86400000).toISOString().split('T')[0] : new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-gray-900 placeholder-gray-500"
                          required
                        />
                        {errors.checkOut && (
                          <p className="mt-1 text-sm text-red-500">{errors.checkOut}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                      <select
                        name="guests"
                        value={bookingData.guests}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-gray-900"
                        required
                      >
                      {errors.guests && (
                        <p className="mt-1 text-sm text-red-500">{errors.guests}</p>
                      )}
                        {[...Array(room.capacity)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} {i === 0 ? 'Guest' : 'Guests'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800">Guest Information</h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={bookingData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                        required
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={bookingData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                        required
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={bookingData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                      <textarea
                        name="specialRequests"
                        value={bookingData.specialRequests}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4 bg-gray-100 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800">Booking Summary</h3>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">Guest Information</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Full Name</span>
                            <span className="font-medium">{bookingData.name}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Email</span>
                            <span className="font-medium">{bookingData.email}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Phone</span>
                            <span className="font-medium">{bookingData.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">Booking Details</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Check In</span>
                            <span className="font-medium">{new Date(bookingData.checkIn).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Check Out</span>
                            <span className="font-medium">{new Date(bookingData.checkOut).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Guests</span>
                            <span className="font-medium">{bookingData.guests} {bookingData.guests === 1 ? 'Guest' : 'Guests'}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Room Type</span>
                            <span className="font-medium">{room.roomType}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium">Total</span>
                          <span className="text-secondary font-semibold text-xl">{formatToIDR(room.price)} / night</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tampilkan pesan error ketersediaan */}
                {errors.availability && (
                  <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.availability}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                    >
                      Back
                    </button>
                  )}
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={currentStep === 1 && (!bookingData.checkIn || errors.availability || !room || !room.availableRooms || room.availableRooms <= 0)}
                      className={`ml-auto px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all ${currentStep === 1 && (!bookingData.checkIn || errors.availability || !room || !room.availableRooms || room.availableRooms <= 0)
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-secondary text-white hover:bg-secondary/90 shadow-secondary/30'}`}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={handleConfirmBooking}
                      disabled={loading}
                      className="ml-auto px-6 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Confirm Booking'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Room Details Sidebar */}
          <div className="w-full lg:w-[380px]">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-4">
              <div className="relative h-[240px]">
                <img 
                  src={room?.images?.[0]?.url || '/placeholder-room.jpg'} 
                  alt={room?.name || 'Room'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <h3 className="text-2xl font-bold text-white">{room?.name}</h3>
                  <div className="flex items-center mt-2">
                    <FaUsers className="w-4 h-4 text-white/80 mr-2" />
                    <span className="text-white/90">Up to {room?.capacity} guests</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600">{room?.description}</p>
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Room Amenities</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {room?.amenities?.map((amenity, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <span className="w-2 h-2 bg-secondary rounded-full mr-2" />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-bold text-secondary"> {formatToIDR(room?.price)}</span>
                      <span className="text-gray-600 ml-1">/ night</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
