import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaUsers, FaClock, FaMoneyBillWave, FaHourglassHalf, FaExclamationCircle } from 'react-icons/fa';
import { formatToIDR } from '../utils/currency';
import PropTypes from 'prop-types';

const PENDING_BOOKING_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds

// Timer component to show remaining time for pending bookings
const BookingTimer = ({ createdAt = Date.now() }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [percentage, setPercentage] = useState(100);
  const intervalRef = useRef(null);
  
  // Ensure createdAt is a valid timestamp
  const timestamp = typeof createdAt === 'number' ? createdAt : Date.now();
  
  useEffect(() => {
    // Calculate time remaining
    const calculateTimeLeft = () => {
      const now = Date.now();
      const elapsedTime = now - timestamp;
      const remainingTime = Math.max(0, PENDING_BOOKING_TIMEOUT - elapsedTime);
      const percentRemaining = (remainingTime / PENDING_BOOKING_TIMEOUT) * 100;
      
      setTimeLeft(remainingTime);
      setPercentage(percentRemaining);
      
      // Clear interval when time is up
      if (remainingTime <= 0) {
        clearInterval(intervalRef.current);
      }
    };
    
    // Initial calculation
    calculateTimeLeft();
    
    // Update every second
    intervalRef.current = setInterval(calculateTimeLeft, 1000);
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timestamp]);
  
  // Format time remaining for display
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Get color based on time remaining
  const getTimerColor = () => {
    if (percentage > 66) return 'bg-green-500';
    if (percentage > 33) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center text-sm">
          <FaHourglassHalf className="mr-1 text-secondary" />
          <span className="font-medium">Time Remaining:</span>
        </div>
        <span className={`text-sm font-semibold ${percentage <= 33 ? 'text-red-600' : percentage <= 66 ? 'text-yellow-600' : 'text-green-600'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${getTimerColor()}`} 
          style={{ width: `${percentage}%`, transition: 'width 1s linear' }}
        ></div>
      </div>
      {percentage <= 33 && (
        <div className="flex items-center mt-1 text-red-600 text-xs">
          <FaExclamationCircle className="mr-1" />
          <span>Book will expire soon! Complete payment to secure your reservation.</span>
        </div>
      )}
    </div>
  );
};

// Add PropTypes validation for BookingTimer
BookingTimer.propTypes = {
  createdAt: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ])
};

// Add default props
BookingTimer.defaultProps = {
  createdAt: Date.now()
};

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  // Function to clean invalid pending bookings
  const cleanInvalidPendingBookings = useCallback(() => {
    console.log('Cleaning invalid pending bookings...');
    const pendingBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
    const validBookings = pendingBookings.filter(booking => {
      return booking && 
             typeof booking === 'object' && 
             booking._id && 
             booking.roomId && 
             booking.checkIn && 
             booking.checkOut;
    });
    localStorage.setItem('pendingBookings', JSON.stringify(validBookings));
  }, []);

  // Function to clean up expired pending bookings
  const cleanupExpiredBookings = useCallback(() => {
    console.log('Running expired bookings cleanup...');
    try {
      let pendingBookings = [];
      try {
        pendingBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
      } catch (e) {
        console.error('Error parsing pendingBookings:', e);
        localStorage.removeItem('pendingBookings');
        return;
      }

      const now = Date.now();
      let hasInvalidData = false;
      
      // Validate and clean up bookings
      const validBookings = pendingBookings.filter(booking => {
        // Check for invalid data structure
        if (!booking || typeof booking !== 'object') {
          hasInvalidData = true;
          return false;
        }

        // Check for required fields
        if (!booking._id || !booking.roomId || !booking.checkIn || !booking.checkOut) {
          console.log('Removing invalid booking:', booking);
          return false;
        }

        // Remove old bookings without timestamp
        if (!booking.createdAt) {
          console.log(`Removing old booking without timestamp: ${booking._id}`);
          return false;
        }

        // Check for expired bookings
        const isExpired = now - booking.createdAt > PENDING_BOOKING_TIMEOUT;
        if (isExpired) {
          console.log(`Removing expired booking: ${booking._id}`);
          return false;
        }

        return true;
      });

      // If we found invalid data, make sure to clean it up
      if (hasInvalidData) {
        console.log('Found invalid data in pendingBookings, cleaning up...');
      }

      // Always update localStorage and UI to ensure consistency
      localStorage.setItem('pendingBookings', JSON.stringify(validBookings));
      setReservations(prev => {
        const newReservations = prev.filter(res => {
          // Keep all confirmed bookings
          if (res.status && res.status !== 'pending') return true;
          // Only keep valid pending bookings
          return validBookings.some(vb => vb._id === res._id);
        });
        return newReservations;
      });
    } catch (error) {
      console.error('Error in cleanupExpiredBookings:', error);
      // If something goes wrong, just clean invalid bookings
      cleanInvalidPendingBookings();
    }
  }, [cleanInvalidPendingBookings]);

  const fetchReservations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const userId = JSON.parse(localStorage.getItem('user'))._id;
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bookings/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Get confirmed bookings from database
      const confirmedBookings = response.data.bookings;
      
      // Log the booking data structure for debugging
      console.log('Confirmed bookings from server:', confirmedBookings);
      
      const confirmedBookingIds = confirmedBookings.map(booking => booking.roomId + booking.checkIn + booking.checkOut);

      // Get pending bookings from localStorage
      const pendingBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
      const userPendingBookings = pendingBookings.filter(booking => {
        // Filter by user email
        const isUsersBooking = booking.guestEmail === JSON.parse(localStorage.getItem('user')).email;
        
        // Check if this booking exists in confirmed bookings
        const bookingKey = booking.roomId + booking.checkIn + booking.checkOut;
        const notConfirmed = !confirmedBookingIds.includes(bookingKey);
        
        return isUsersBooking && notConfirmed;
      });

      // Ensure each booking has a unique ID and required fields
      const processedBookings = [...userPendingBookings, ...confirmedBookings].map(booking => ({
        ...booking,
        _id: booking._id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        roomName: booking.roomName || booking.room?.name || 'Room',
        status: booking.status || 'pending'
      }));

      setReservations(processedBookings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Failed to load reservations');

      // If API call fails, only show pending bookings
      const pendingBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
      const userPendingBookings = pendingBookings.filter(booking => 
        booking.guestEmail === JSON.parse(localStorage.getItem('user')).email
      );
      setReservations(userPendingBookings);
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // First, clean any invalid bookings
        console.log('Initial cleanup of invalid bookings...');
        cleanInvalidPendingBookings();
        
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Then fetch fresh data
        console.log('Fetching fresh reservations...');
        await fetchReservations();
      } catch (error) {
        console.error('Error during initialization:', error);
      }
    };

    // Run initial setup
    initializeData();

    // Set up periodic cleanup
    console.log('Setting up periodic cleanup...');
    const cleanupInterval = setInterval(cleanupExpiredBookings, 5000); // Check every 5 seconds

    // Cleanup interval on component unmount
    return () => {
      console.log('Cleaning up component...');
      clearInterval(cleanupInterval);
    };
  }, [fetchReservations, cleanupExpiredBookings, cleanInvalidPendingBookings]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-tertiary py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tertiary">
      {/* Header */}
      <div className="bg-tertiary">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">My Reservations</h1>
          <p className="text-lg text-gray-600 text-center">Manage your hotel bookings and reservations</p>
        </div>
      </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {reservations.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center border border-gray-100">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCalendarAlt className="text-2xl text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Reservations Found</h3>
              <p className="text-gray-500 mb-6">Start your journey by booking your first stay with us</p>
              <button
                onClick={() => navigate('/')}
                className="bg-secondary text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm hover:bg-secondary/90 transition-all inline-flex items-center gap-2"
              >
                <FaCalendarAlt className="text-lg" />
                Book a Room
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {reservations.map((reservation) => (
                <div
                  key={reservation._id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all"
                >
                <div className="p-6">
                  {/* Header with Room Name, Status and Booking ID */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {reservation.roomName}
                      </h3>
                      <div className="text-sm text-gray-500">
                        Booking ID: <span className="font-mono">{reservation._id}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </span>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Check-in - Check-out */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-3 bg-tertiary p-3 rounded-lg">
                        <FaCalendarAlt className="text-primary text-lg" />
                        <div>
                          <div className="text-sm text-gray-500">Check-in - Check-out</div>
                          <div className="font-medium text-gray-900">
                            {formatDate(reservation.checkIn)}
                            <span className="mx-2 text-gray-400">-</span>
                            {formatDate(reservation.checkOut)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guest Count */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-3 bg-tertiary p-3 rounded-lg">
                        <FaUsers className="text-primary text-lg" />
                        <div>
                          <div className="text-sm text-gray-500">Guests</div>
                          <div className="font-medium text-gray-900">{reservation.numberOfGuests} Guests</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Total Amount */}
                        <div className="col-span-1">
                          <div className="flex items-center gap-3 bg-tertiary p-3 rounded-lg">
                            <FaMoneyBillWave className="text-primary text-lg" />
                            <div>
                              <div className="text-sm text-gray-500">Total Amount</div>
                              <div className="font-semibold text-gray-900">{formatToIDR(reservation.totalAmount)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Payment Status */}
                        <div className="col-span-1">
                          <div className="flex items-center gap-3 bg-tertiary p-3 rounded-lg">
                            <FaClock className="text-primary text-lg" />
                            <div>
                              <div className="text-sm text-gray-500">Payment Status</div>
                              <div className={
                                `font-semibold ${
                                  reservation.status === 'confirmed' ? 'text-green-600' : 
                                  reservation.status === 'pending' ? 'text-yellow-600' : 
                                  'text-red-600'
                                }`
                              }>
                                {(() => {
                                  // Tampilkan data booking di console untuk debugging
                                  console.log('BOOKING DATA:', reservation);
                                  
                                  // Jika status confirmed & metode cash, tampilkan "Pay Cash at Hotel"
                                  if (reservation.status === 'confirmed') {
                                    // Check semua kemungkinan indikator pembayaran cash
                                    if (reservation.paymentDetails?.method === 'cash' ||
                                        reservation.paymentDetails?.paymentType === 'cash_on_arrival' ||
                                        reservation.paymentDetails?.status === 'Pay at Hotel') {
                                      return 'Pay Cash at Hotel';
                                    }
                                    return 'Paid';
                                  }
                                  
                                  // Status lainnya
                                  if (reservation.status === 'pending') return 'Pending';
                                  if (reservation.status === 'cancelled') return 'Cancelled';
                                  return 'Unknown';
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {reservation.status === 'pending' && (
                        <div className="mt-4">
                          {/* Timer component with fallback for createdAt */}
                          <BookingTimer createdAt={reservation.createdAt || (reservation._id && parseInt(reservation._id.split('-')[1]))} />
                          
                          {/* Complete Payment Button */}
                          <div className="flex justify-end mt-4">
                            <button
                              onClick={() => navigate(`/payment?bookingId=${reservation._id}`)}
                              className="bg-secondary text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm hover:bg-secondary/90 transition-all inline-flex items-center gap-2"
                            >
                              <FaMoneyBillWave className="text-lg" />
                              Complete Payment
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReservations;
