import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaUsers, FaClock, FaMoneyBillWave } from 'react-icons/fa';
import { formatToIDR } from '../utils/currency';

const PENDING_BOOKING_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to force clean all pending bookings
  const forceCleanAllPendingBookings = useCallback(() => {
    console.log('Force cleaning all pending bookings...');
    localStorage.removeItem('pendingBookings');
    setReservations(prev => prev.filter(booking => booking.status !== 'pending'));
  }, []);

  // Function to clean up expired pending bookings
  const cleanupExpiredBookings = useCallback(() => {
    console.log('Running cleanup...');
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
      // If something goes wrong, force clean all pending bookings
      forceCleanAllPendingBookings();
    }
  }, [forceCleanAllPendingBookings]);

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
        // First, force clean all pending bookings
        console.log('Initial cleanup of all pending bookings...');
        forceCleanAllPendingBookings();
        
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
  }, [fetchReservations, cleanupExpiredBookings, forceCleanAllPendingBookings]);

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
                                {reservation.status === 'confirmed' ? 'Paid' :
                                 reservation.status === 'pending' ? 'Pending' :
                                 reservation.status === 'cancelled' ? 'Cancelled' : 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {reservation.status === 'pending' && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => navigate(`/payment?bookingId=${reservation._id}`)}
                            className="bg-secondary text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm hover:bg-secondary/90 transition-all inline-flex items-center gap-2"
                          >
                            <FaMoneyBillWave className="text-lg" />
                            Complete Payment
                          </button>
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
