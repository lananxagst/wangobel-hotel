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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1">
        <div className="flex items-center text-sm mb-1 sm:mb-0">
          <FaHourglassHalf className="mr-1 text-secondary flex-shrink-0" />
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
        <div className="flex items-start sm:items-center mt-1 text-red-600 text-xs">
          <FaExclamationCircle className="mr-1 mt-1 sm:mt-0 flex-shrink-0" />
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

  // Helper function to get user email from various sources
  const getUserEmail = useCallback(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!userData || !userData.email) return '';
      return userData.email.toLowerCase().trim();
    } catch (error) {
      console.error('Error getting user email:', error);
      return '';
    }
  }, []);

  // Helper function to get pending bookings for current user
  const getUserPendingBookings = useCallback(() => {
    const userEmail = getUserEmail();
    if (!userEmail) {
      console.warn('No user email found, cannot get pending bookings');
      return [];
    }

    // Get bookings from user-specific storage
    const userKey = `pendingBookings_${userEmail}`;
    let userBookings = [];
    try {
      userBookings = JSON.parse(localStorage.getItem(userKey) || '[]');
      console.log(`Found ${userBookings.length} bookings in user storage: ${userKey}`);
    } catch (error) {
      console.error(`Error parsing user storage ${userKey}:`, error);
      localStorage.removeItem(userKey);
    }

    // Also check global storage for backward compatibility
    let globalBookings = [];
    try {
      const allBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
      globalBookings = allBookings.filter(booking => {
        if (!booking || !booking.guestEmail) return false;
        return booking.guestEmail.toLowerCase().trim() === userEmail;
      });
      console.log(`Found ${globalBookings.length} user bookings in global storage`);
    } catch (error) {
      console.error('Error parsing global pendingBookings:', error);
    }

    // Merge bookings, preventing duplicates
    const mergedBookings = [...userBookings];
    globalBookings.forEach(globalBooking => {
      // Only add if not already in user storage
      const isDuplicate = userBookings.some(b => b._id === globalBooking._id);
      if (!isDuplicate) {
        mergedBookings.push(globalBooking);
        console.log('Adding unique booking from global storage:', globalBooking._id);
      }
    });

    return mergedBookings;
  }, [getUserEmail]);

  // Function to clean invalid pending bookings
  const cleanInvalidPendingBookings = useCallback(() => {
    console.log('Cleaning invalid pending bookings...');
    const userEmail = getUserEmail();
    if (!userEmail) return;

    const userKey = `pendingBookings_${userEmail}`;
    console.log(`Cleaning invalid bookings from ${userKey}`);

    // Clean user-specific bookings
    try {
      const pendingBookings = JSON.parse(localStorage.getItem(userKey) || '[]');
      const validBookings = pendingBookings.filter(booking => {
        return booking && 
               typeof booking === 'object' && 
               booking._id && 
               booking.roomId && 
               booking.checkIn && 
               booking.checkOut;
      });
      localStorage.setItem(userKey, JSON.stringify(validBookings));
      console.log(`Cleaned ${pendingBookings.length - validBookings.length} invalid bookings`);
    } catch (error) {
      console.error(`Error cleaning ${userKey}:`, error);
    }

    // Also clean global pendingBookings for backward compatibility
    try {
      const allBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
      const validAllBookings = allBookings.filter(booking => {
        return booking && 
               typeof booking === 'object' && 
               booking._id && 
               booking.roomId && 
               booking.checkIn && 
               booking.checkOut;
      });
      localStorage.setItem('pendingBookings', JSON.stringify(validAllBookings));
    } catch (error) {
      console.error('Error cleaning global pendingBookings:', error);
    }
  }, [getUserEmail]);

  // Function to clean up expired pending bookings
  const cleanupExpiredBookings = useCallback(() => {
    console.log('Running expired bookings cleanup...');
    const userEmail = getUserEmail();
    if (!userEmail) return;

    const userKey = `pendingBookings_${userEmail}`;
    console.log(`Checking expired bookings in ${userKey}`);

    try {
      // Process user-specific bookings
      const pendingBookings = JSON.parse(localStorage.getItem(userKey) || '[]');
      const now = Date.now();
      const validBookings = [];
      const expiredBookings = [];

      pendingBookings.forEach(booking => {
        if (!booking || typeof booking !== 'object') return;

        // If booking doesn't have a timestamp, create one for future cleanup
        if (!booking.createdAt) {
          booking.createdAt = Date.now() - (2 * 60 * 1000);
        }

        // Check if booking has expired (3 minutes timeout)
        if ((now - booking.createdAt) > PENDING_BOOKING_TIMEOUT) {
          console.log('Found expired booking:', booking._id);
          expiredBookings.push(booking);
        } else {
          validBookings.push(booking);
        }
      });

      // Save updated list
      localStorage.setItem(userKey, JSON.stringify(validBookings));
      if (expiredBookings.length > 0) {
        console.log(`Removed ${expiredBookings.length} expired bookings from ${userKey}`);
        
        // If expired bookings were found, update reservations state
        setReservations(prev => {
          const newReservations = prev.filter(res => {
            // Keep all confirmed bookings
            if (res.status !== 'pending') return true;

            // For pending bookings, check if it's NOT in expiredBookings
            return !expiredBookings.some(eb => eb._id === res._id);
          });
          return newReservations;
        });
      }

      // Also update global pendingBookings
      const allBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
      const updatedGlobalBookings = allBookings.filter(booking => {
        if (!booking || !booking.createdAt) return false;
        return (now - booking.createdAt) <= PENDING_BOOKING_TIMEOUT;
      });
      localStorage.setItem('pendingBookings', JSON.stringify(updatedGlobalBookings));
    } catch (error) {
      console.error('Error in cleanupExpiredBookings:', error);
    }
  }, [getUserEmail]);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to view your reservations');
        navigate('/login');
        return;
      }
      
      // Get user email - using our helper function
      const userEmail = getUserEmail();
      if (!userEmail) {
        toast.error('User profile incomplete. Please login again.');
        navigate('/login');
        return;
      }
      
      console.log('Using user email for API request:', userEmail);
      
      // Fetch confirmed bookings from backend using email
      let confirmedBookings = [];
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/bookings/user-email/${encodeURIComponent(userEmail)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        confirmedBookings = response.data.bookings || [];
        console.log('Confirmed bookings from server:', confirmedBookings);
      } catch (apiError) {
        console.error('Error fetching confirmed bookings:', apiError);
        toast.error('Could not fetch confirmed bookings: ' + 
          (apiError.response?.data?.message || apiError.message || ''));
        // Continue to show pending bookings even if confirmed bookings fail
      }
      
      // Create a set of unique identifiers for confirmed bookings
      // Using more reliable identifiers that include roomId, checkIn, checkOut, and guestEmail
      const confirmedBookingIds = confirmedBookings.map(booking => {
        return `${booking.roomId}_${booking.checkIn}_${booking.checkOut}_${booking.user?.email || ''}`.toLowerCase();
      });
      
      console.log('Confirmed booking identifiers:', confirmedBookingIds);

      // Get pending bookings using our helper function
      const pendingBookings = getUserPendingBookings();
      console.log(`Found ${pendingBookings.length} pending bookings for ${userEmail}`);
      
      // Filter pending bookings to only show those that aren't already confirmed
      const userPendingBookings = pendingBookings.filter(booking => {
        // Skip invalid bookings
        if (!booking || !booking.guestEmail || !booking.roomId || !booking.checkIn || !booking.checkOut) {
          console.warn('Skipping invalid booking:', booking);
          return false;
        }
        
        // Check if this booking exists in confirmed bookings
        // Using the same identifier format as above for consistent comparison
        const guestEmail = booking.guestEmail ? booking.guestEmail.toLowerCase() : '';
        const bookingKey = `${booking.roomId}_${booking.checkIn}_${booking.checkOut}_${guestEmail}`.toLowerCase();
        const isAlreadyConfirmed = confirmedBookingIds.includes(bookingKey);
        
        console.log(`Checking if booking ${booking._id} is confirmed: ${isAlreadyConfirmed}`);
        console.log(`Using key: ${bookingKey}`);
        
        if (isAlreadyConfirmed) {
          console.log(`Booking ${booking._id} is already confirmed and will be filtered out`);
          return false;
        }
        
        return true;
      });
      
      console.log(`After filtering, ${userPendingBookings.length} pending bookings remain`);
      
      // Additional cleanup: Remove any confirmed bookings from localStorage
      // This ensures localStorage stays in sync with backend data
      try {
        // Get both global and user-specific pending bookings
        const userKey = `pendingBookings_${userEmail}`;
        const allPendingBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
        const userPendingBookingsFromStorage = JSON.parse(localStorage.getItem(userKey) || '[]');
        
        // Filter out any bookings that are already confirmed in both locations
        const filteredGlobalBookings = allPendingBookings.filter(booking => {
          if (!booking || !booking.roomId || !booking.checkIn || !booking.checkOut || !booking.guestEmail) return true;
          
          const guestEmail = booking.guestEmail.toLowerCase();
          const bookingKey = `${booking.roomId}_${booking.checkIn}_${booking.checkOut}_${guestEmail}`.toLowerCase();
          return !confirmedBookingIds.includes(bookingKey);
        });
        
        const filteredUserBookings = userPendingBookingsFromStorage.filter(booking => {
          if (!booking || !booking.roomId || !booking.checkIn || !booking.checkOut || !booking.guestEmail) return true;
          
          const guestEmail = booking.guestEmail.toLowerCase();
          const bookingKey = `${booking.roomId}_${booking.checkIn}_${booking.checkOut}_${guestEmail}`.toLowerCase();
          return !confirmedBookingIds.includes(bookingKey);
        });
        
        // Update localStorage with cleaned lists
        if (allPendingBookings.length !== filteredGlobalBookings.length) {
          console.log(`Removed ${allPendingBookings.length - filteredGlobalBookings.length} confirmed bookings from global storage`);
          localStorage.setItem('pendingBookings', JSON.stringify(filteredGlobalBookings));
        }
        
        if (userPendingBookingsFromStorage.length !== filteredUserBookings.length) {
          console.log(`Removed ${userPendingBookingsFromStorage.length - filteredUserBookings.length} confirmed bookings from user-specific storage`);
          localStorage.setItem(userKey, JSON.stringify(filteredUserBookings));
        }
      } catch (error) {
        console.error('Error cleaning confirmed bookings from localStorage:', error);
      }
      
      console.log('User pending bookings after filtering:', userPendingBookings);

      // Ensure each booking has a unique ID and required fields
      const processedBookings = [...userPendingBookings, ...confirmedBookings].map(booking => ({
        ...booking,
        _id: booking._id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        roomName: booking.roomName || booking.room?.name || 'Room',
        status: booking.status || 'pending'
      }));

      console.log('Final reservation list:', processedBookings);
      setReservations(processedBookings);
      setLoading(false);
    } catch (error) {
      console.error('Fatal error in fetchReservations:', error);
      toast.error('Failed to load reservations: ' + (error.message || ''));

      // Fallback: just show pending bookings
      try {
        // Get user email using our helper
        const userEmail = getUserEmail();
        if (!userEmail) {
          setReservations([]);
          setLoading(false);
          return;
        }
        
        console.log('Fallback: showing only pending bookings');
        
        // Get pending bookings using our helper
        const pendingBookings = getUserPendingBookings();
        console.log(`Fallback: found ${pendingBookings.length} pending bookings`);
        
        // Make sure all bookings have required fields
        const processedBookings = pendingBookings.map(booking => ({
          ...booking,
          _id: booking._id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          roomName: booking.roomName || 'Room',
          status: 'pending'
        }));
        
        setReservations(processedBookings);
      } catch (fallbackError) {
        console.error('Error in fallback booking retrieval:', fallbackError);
        // If all else fails, just show empty reservations
        setReservations([]);
      }
      
      setLoading(false);
    }
  }, [navigate, getUserPendingBookings, getUserEmail]);

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
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 text-center">My Reservations</h1>
          <p className="text-base md:text-lg text-gray-600 text-center">Manage your hotel bookings and reservations</p>
        </div>
      </div>

        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          {reservations.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center border border-gray-100">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCalendarAlt className="text-2xl text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Reservations Found</h3>
              <p className="text-gray-500 mb-6">Start your journey by booking your first stay with us</p>
              <button
                onClick={() => navigate('/rooms')}
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
                <div className="p-4 md:p-6">
                  {/* Header with Room Name, Status and Booking ID */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1">
                        {reservation.roomName}
                      </h3>
                      <div className="text-xs md:text-sm text-gray-500 truncate w-full">
                        Booking ID: <span className="font-mono">{reservation._id.substring(0, 15)}...</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap ${getStatusColor(reservation.status)}`}>
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </span>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Check-in - Check-out */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-3 bg-tertiary p-3 rounded-lg">
                        <FaCalendarAlt className="text-primary text-lg flex-shrink-0" />
                        <div className="w-full">
                          <div className="text-sm text-gray-500">Check-in - Check-out</div>
                          <div className="font-medium text-gray-900 text-sm md:text-base flex flex-col md:flex-row md:items-center">
                            <span>{formatDate(reservation.checkIn)}</span>
                            <span className="hidden md:inline mx-2 text-gray-400">-</span>
                            <span className="md:hidden text-gray-400 my-1">to</span>
                            <span>{formatDate(reservation.checkOut)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guest Count */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-3 bg-tertiary p-3 rounded-lg">
                        <FaUsers className="text-primary text-lg flex-shrink-0" />
                        <div className="w-full">
                          <div className="text-sm text-gray-500">Guests</div>
                          <div className="font-medium text-gray-900">{reservation.numberOfGuests} Guests</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Total Amount */}
                        <div className="col-span-1">
                          <div className="flex items-center gap-3 bg-tertiary p-3 rounded-lg">
                            <FaMoneyBillWave className="text-primary text-lg flex-shrink-0" />
                            <div className="w-full">
                              <div className="text-sm text-gray-500">Total Amount</div>
                              <div className="font-semibold text-gray-900 text-sm md:text-base">{formatToIDR(reservation.totalAmount)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Payment Status */}
                        <div className="col-span-1">
                          <div className="flex items-center gap-3 bg-tertiary p-3 rounded-lg">
                            <FaClock className="text-primary text-lg flex-shrink-0" />
                            <div className="w-full">
                              <div className="text-sm text-gray-500">Payment Status</div>
                              <div className={
                                `font-semibold text-sm md:text-base ${
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
                          <div className="flex justify-center md:justify-end mt-4">
                            <button
                              onClick={() => navigate(`/payment?bookingId=${reservation._id}`)}
                              className="w-full md:w-auto bg-secondary text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm hover:bg-secondary/90 transition-all inline-flex items-center justify-center md:justify-start gap-2"
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
