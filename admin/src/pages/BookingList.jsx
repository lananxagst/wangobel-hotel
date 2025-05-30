import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { FaCalendarAlt, FaExclamationCircle, FaCreditCard, FaMoneyBill } from 'react-icons/fa';

const backend_url = import.meta.env.VITE_BACKEND_URL;

const BookingList = ({ token }) => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 640);
  
  // Generate array of 7 days for desktop view
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => addDays(currentWeekStart, index));
  }, [currentWeekStart]);
  
  // Mobile view will show 3 consecutive days based on currentWeekStart
  // This ensures next/prev navigation works on mobile too
  const mobileDays = useMemo(() => {
    return Array.from({ length: 3 }).map((_, index) => addDays(currentWeekStart, index));
  }, [currentWeekStart]);
  
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch bookings directly from the API
      const response = await axios.get(`${backend_url}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Booking API Response:', response.data);
      
      // Process bookings data - handle both array format and {success, bookings} format
      let bookingsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          bookingsData = response.data;
        } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
          bookingsData = response.data.bookings;
        }
      }
      
      // Transform dates dari string ke Date objects
      const bookingsWithDates = bookingsData.map(booking => ({
        ...booking,
        checkIn: booking.checkIn ? parseISO(booking.checkIn) : new Date(),
        checkOut: booking.checkOut ? parseISO(booking.checkOut) : new Date()
      }));
      
      setBookings(bookingsWithDates);
      console.log('Processed bookings:', bookingsWithDates.length);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Error fetching bookings: ' + (error.response?.data?.message || error.message));
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  const fetchRooms = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backend_url}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(data);
    } catch (error) {
      toast.error('Error fetching rooms: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, [fetchBookings, fetchRooms]);
  
  const getStatusClass = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'checked_in': return 'bg-green-100 border-green-400 text-green-800';
      case 'checked_out': return 'bg-gray-100 border-gray-400 text-gray-800';
      case 'cancelled': return 'bg-red-100 border-red-400 text-red-800';
      case 'pending': return 'bg-blue-100 border-blue-400 text-blue-800';
      default: return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };
  
  const getPaymentStatusText = (booking) => {
    if (!booking) return '';
    
    if (booking.status === 'confirmed') {
      // Check if payment method is cash
      if (booking.paymentDetails?.method === 'cash') {
        return 'Pay Cash at Hotel';
      }
      return 'Paid';
    } else if (booking.status === 'pending') {
      return 'Pending Payment';
    } else if (booking.status === 'cancelled') {
      return 'Cancelled';
    }
    
    return booking.status;
  };
  
  const getPaymentStatusIcon = (booking) => {
    if (!booking) return null;
    
    if (booking.status === 'confirmed') {
      if (booking.paymentDetails?.method === 'cash') {
        return <FaMoneyBill className="mr-1 text-green-600" />;
      }
      return <FaCreditCard className="mr-1 text-green-600" />;
    }
    
    return null;
  };
  
  // Group bookings by room type and assign consistent room numbers for multi-day bookings
  const bookingsByRoomType = useMemo(() => {
    if (!bookings.length || !rooms.length) return {};
    
    console.log('Processing', bookings.length, 'bookings for', rooms.length, 'rooms');
    
    // Create map of roomId -> roomType
    const roomTypeMap = {};
    rooms.forEach(room => {
      roomTypeMap[room._id] = room.roomType;
    });

    // Group bookings by room type
    const result = {};
    bookings.forEach(booking => {
      // Safely extract room ID
      const roomId = typeof booking.room === 'object' ? booking.room._id : booking.room;
      const roomType = roomTypeMap[roomId] || 'Unknown';
      
      if (!result[roomType]) {
        result[roomType] = [];
      }
      
      // Make sure the dates are valid
      let checkInDate = new Date(booking.checkIn);
      let checkOutDate = new Date(booking.checkOut);
      
      // Safety check - ensure dates are valid
      if (isNaN(checkInDate.getTime())) {
        console.error('Invalid check-in date for booking', booking._id, booking.checkIn);
        checkInDate = new Date(); // Fallback to today
      }
      
      if (isNaN(checkOutDate.getTime())) {
        console.error('Invalid check-out date for booking', booking._id, booking.checkOut);
        checkOutDate = new Date(); // Fallback to today
      }
      
      // Normalize times to midnight for consistent comparison
      checkInDate.setHours(0, 0, 0, 0);
      checkOutDate.setHours(0, 0, 0, 0);
      
      // Add fixed assignedRoomNumber property to each booking
      result[roomType].push({
        ...booking,
        // We'll set this to a number 1-5 later
        assignedRoomNumber: null, 
        // Store normalized dates
        checkInDate,
        checkOutDate
      });
      
      console.log(`Booking ${booking._id} period:`, {
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0]
      });
    });
    
    // Assign consistent room numbers for each booking's entire stay
    Object.keys(result).forEach(roomType => {
      // Sort bookings by check-in date for fair allocation
      const sortedBookings = [...result[roomType]].sort((a, b) => {
        return a.checkInDate - b.checkInDate;
      });
      
      // Track which room numbers are occupied during which periods
      const roomOccupancy = [
        [], // Room #1 occupancy periods [[startDate, endDate], ...]
        [], // Room #2 occupancy periods
        [], // Room #3 occupancy periods
        [], // Room #4 occupancy periods
        []  // Room #5 occupancy periods
      ];
      
      // For each booking, find a room that's available for its entire stay
      sortedBookings.forEach(booking => {
        let assignedRoom = null;
        
        // Debug log
        console.log(`Assigning room for booking ${booking._id}:`, {
          checkIn: booking.checkInDate.toISOString().split('T')[0],
          checkOut: booking.checkOutDate.toISOString().split('T')[0]
        });
        
        // Try each room number (1-5)
        for (let roomNum = 1; roomNum <= 5; roomNum++) {
          const roomIndex = roomNum - 1;
          
          // Check if this room is available for the entire booking period
          // Using hotel standard: A guest occupies a room from check-in date until (but not including) check-out date
          const isRoomAvailable = !roomOccupancy[roomIndex].some(period => {
            // If period[1] is check-out date and booking.checkInDate is the same day, there's NO overlap
            // If booking.checkOutDate is check-out date and period[0] is the same day, there's NO overlap
            const noOverlap = period[1] <= booking.checkInDate || period[0] >= booking.checkOutDate;
            return !noOverlap; // We want to know if there IS overlap
          });
          
          if (isRoomAvailable) {
            // Assign this room number to the booking for its entire stay
            booking.assignedRoomNumber = roomNum;
            // Add this booking period to the room's occupancy
            roomOccupancy[roomIndex].push([booking.checkInDate, booking.checkOutDate]);
            assignedRoom = roomNum;
            console.log(`Assigned booking ${booking._id} to room #${roomNum}`);
            break;
          }
        }
        
        // If no room was available for the entire stay, assign to room #1 (fallback)
        if (assignedRoom === null) {
          booking.assignedRoomNumber = 1;
          roomOccupancy[0].push([booking.checkInDate, booking.checkOutDate]);
          console.warn(`Couldn't find available room for booking ${booking._id}, assigned to room #1`);
        }
      });
      
      result[roomType] = sortedBookings;
    });
    
    return result;
  }, [bookings, rooms]);
  
  // Get all unique room types
  const uniqueRoomTypes = useMemo(() => {
    return [...new Set(rooms.map(room => room.roomType))];
  }, [rooms]);
  
  // Debug: Count total number of rendered bookings
  const [renderedBookingsCount, setRenderedBookingsCount] = useState(0);

  // Get booking for a specific room type, room number, and date
  const getBookingForRoomOnDate = useCallback((roomType, roomNumber, date) => {
    // If no bookings for this room type, return empty
    if (!bookingsByRoomType[roomType]) return null;
    
    // Format date to compare (normalize to midnight UTC for consistent comparison)
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Find a booking that:
    // 1. Is assigned to this room number
    // 2. Has a date range that includes the target date
    // 3. Following hotel standard: check-in date is included, but check-out date is NOT included
    const booking = bookingsByRoomType[roomType].find(b => {
      // Normalize dates for comparison
      const checkInDate = new Date(b.checkInDate);
      checkInDate.setHours(0, 0, 0, 0);
      
      const checkOutDate = new Date(b.checkOutDate);
      checkOutDate.setHours(0, 0, 0, 0);
      
      // Standard hotel logic: Guest stays from check-in date UNTIL check-out date (not including check-out date)
      // Example: Check-in May 29, Check-out May 30 = Only staying on May 29
      const isDateOccupied = targetDate >= checkInDate && targetDate < checkOutDate;
      
      // Remove excessive debug logging in production
      // console.log(`Checking booking ${b._id} in room ${roomNumber}:`, {
      //   assigned: b.assignedRoomNumber === roomNumber,
      //   targetDate: targetDate.toISOString().split('T')[0],
      //   checkIn: checkInDate.toISOString().split('T')[0],
      //   checkOut: checkOutDate.toISOString().split('T')[0],
      //   isOccupied: isDateOccupied
      // });
      
      return b.assignedRoomNumber === roomNumber && isDateOccupied;
    });
    
    return booking || null;
  }, [bookingsByRoomType]);
  
  // Calculate total unique bookings rendered
  useEffect(() => {
    // Set to track unique booking IDs
    const renderedBookingIds = new Set();
    
    uniqueRoomTypes.forEach(roomType => {
      for (let roomNumber = 1; roomNumber <= 5; roomNumber++) {
        weekDays.forEach(day => {
          const booking = getBookingForRoomOnDate(roomType, roomNumber, day);
          if (booking) {
            renderedBookingIds.add(booking._id);
          }
        });
      }
    });
    
    const uniqueCount = renderedBookingIds.size;
    setRenderedBookingsCount(uniqueCount);
    console.log(`Total unique bookings rendered: ${uniqueCount} out of ${bookings.length}`);
  }, [bookings, uniqueRoomTypes, weekDays, getBookingForRoomOnDate]);
  
  // Add resize event listener to detect mobile/desktop view changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigateToPreviousWeek = () => {
    // On mobile: move back 3 days, on desktop: move back 7 days
    const daysToMove = isMobileView ? -3 : -7;
    setCurrentWeekStart(prevDate => addDays(prevDate, daysToMove));
  };
  
  const navigateToNextWeek = () => {
    // On mobile: move forward 3 days, on desktop: move forward 7 days
    const daysToMove = isMobileView ? 3 : 7;
    setCurrentWeekStart(prevDate => addDays(prevDate, daysToMove));
  };
  
  const navigateToCurrentWeek = () => {
    // For both mobile and desktop: reset to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentWeekStart(today);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
        <span className="ml-3 text-lg text-gray-600">Loading bookings...</span>
      </div>
    );
  }
  
  return (
    <div className="admin-container px-2 sm:px-4 max-w-7xl mx-auto overflow-y-auto min-h-screen pb-10">
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary">Room Bookings</h2>
          <p className="text-text-light text-sm sm:text-base mt-1">Manage your hotel room bookings</p>
        </div>
        
        <div className="flex justify-center items-center gap-2 mt-3 md:mt-0 w-full md:w-auto">
          <button
            onClick={navigateToPreviousWeek}
            className="admin-btn-outline p-2 flex-shrink-0"
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={navigateToCurrentWeek}
            className="admin-btn-outline flex items-center justify-center px-2 sm:px-3 py-2 flex-grow-0"
          >
            <FaCalendarAlt className="mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base hidden sm:inline">Current Week</span>
            <span className="text-sm inline sm:hidden">Today</span>
          </button>
          
          <button
            onClick={navigateToNextWeek}
            className="admin-btn-outline p-2 flex-shrink-0"
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-1 sm:gap-0">
        <div className="text-xs sm:text-sm text-gray-500">
          Total bookings: <span className="font-semibold text-primary">{bookings.length}</span>
        </div>
        <div className="text-xs sm:text-sm text-gray-500">
          Visible bookings: <span className="font-semibold text-primary">{renderedBookingsCount}</span>
        </div>
      </div>

      {/* DESKTOP VIEW - Visible on sm breakpoint and above */}
      <div className="bg-white rounded-lg shadow overflow-hidden hidden sm:block">
        {/* Scrollable container for booking table */}
        <div className="overflow-x-auto pb-1">
          {/* Header with days of the week */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-4 font-medium bg-tertiary/90 border-r sticky left-0 z-10">
              Room
            </div>
            {weekDays.map((day, index) => (
              <div 
                key={index} 
                className={`p-4 font-medium text-center ${isSameDay(day, new Date()) ? 'bg-secondary' : 'bg-tertiary/90'}`}
              >
                {format(day, 'EEE, dd/MM')}
              </div>
            ))}
          </div>
          
          {/* Room Type sections with 5 rooms each */}
          {uniqueRoomTypes.length === 0 ? (
            <div className="p-8 text-center">
              <FaExclamationCircle className="mx-auto mb-2 text-3xl text-gray-400" />
              <p>No room types found. Please add rooms first.</p>
            </div>
          ) : (
            <div>
              {uniqueRoomTypes.map((roomType) => (
                <div key={roomType} className="mb-8">
                  {/* Room Type Header */}
                  <div className="bg-tertiary text-primary p-3 font-bold">
                    {roomType} Room Type
                  </div>
                  
                  {/* 5 Rooms of this type */}
                  {[1, 2, 3, 4, 5].map((roomNumber) => (
                    <div key={`${roomType}-${roomNumber}`} className="grid grid-cols-8 border-b">
                      {/* Room info cell */}
                      <div className="p-3 border-r flex flex-col justify-center">
                        <div className="font-medium text-primary">{roomType} Room</div>
                        <div className="text-sm text-secondary font-semibold">Room #{roomNumber}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {rooms.find(r => r.roomType === roomType)?.capacity || 0} guests
                        </div>
                      </div>
                      
                      {/* Days of the week */}
                      {weekDays.map((day, dayIndex) => {
                        const booking = getBookingForRoomOnDate(roomType, roomNumber, day);
                        const hasBooking = booking !== null;
                        
                        return (
                          <div 
                            key={dayIndex} 
                            className={`p-2 border-r ${hasBooking ? 'bg-yellow-50' : ''}`}
                          >
                            {hasBooking ? (
                              <div className={`rounded-md border p-2 ${getStatusClass(booking.status || 'confirmed')}`}>
                                <div className="font-medium text-sm">{booking.guestName}</div>
                                <div className="text-xs">BID: {booking.bookingId}</div>
                                <div className="flex items-center text-xs mt-1">
                                  {getPaymentStatusIcon(booking)}
                                  <span>{getPaymentStatusText(booking)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full min-h-[80px] flex items-center justify-center text-gray-400">
                                <span>Available</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE VIEW - Only visible below sm breakpoint */}
      <div className="bg-white rounded-lg shadow overflow-hidden sm:hidden">
        {/* Header with just 3 days */}
        <div className="grid grid-cols-4 border-b">
          <div className="p-3 font-medium bg-tertiary/90 border-r">
            Room
          </div>
          {mobileDays.map((day, index) => (
            <div 
              key={index} 
              className={`p-2 font-medium text-center ${isSameDay(day, new Date()) ? 'bg-secondary' : 'bg-tertiary/90'}`}
            >
              <div className="text-xs">{format(day, 'EEE')}</div>
              <div className="text-xs">{format(day, 'dd/MM')}</div>
            </div>
          ))}
        </div>
        
        {/* Room Type sections with 5 rooms each */}
        {uniqueRoomTypes.length === 0 ? (
          <div className="p-4 text-center">
            <FaExclamationCircle className="mx-auto mb-2 text-xl text-gray-400" />
            <p className="text-sm">No room types found</p>
          </div>
        ) : (
          <div>
            {uniqueRoomTypes.map((roomType) => (
              <div key={roomType} className="mb-4">
                {/* Room Type Header */}
                <div className="bg-tertiary text-primary p-2 text-sm font-bold">
                  {roomType} Room Type
                </div>
                
                {/* 5 Rooms of this type */}
                {[1, 2, 3, 4, 5].map((roomNumber) => (
                  <div key={`${roomType}-${roomNumber}`} className="grid grid-cols-4 border-b">
                    {/* Room info cell */}
                    <div className="p-2 border-r flex flex-col justify-center">
                      <div className="font-medium text-xs text-primary">{roomType} 0{roomNumber}</div>
                      {/* <div className="text-xs text-secondary font-semibold">#{roomNumber}</div> */}
                    </div>
                    
                    {/* Only 3 days for mobile */}
                    {mobileDays.map((day, dayIndex) => {
                      const booking = getBookingForRoomOnDate(roomType, roomNumber, day);
                      const hasBooking = booking !== null;
                      
                      return (
                        <div 
                          key={dayIndex} 
                          className={`p-1 border-r ${hasBooking ? 'bg-yellow-50' : ''}`}
                        >
                          {hasBooking ? (
                            <div className={`rounded-md border p-1 ${getStatusClass(booking.status || 'confirmed')}`}>
                              <div className="font-medium text-xs truncate">{booking.guestName}</div>
                              <div className="flex items-center text-[10px] mt-0.5 truncate">
                                {getPaymentStatusIcon(booking)}
                                <span className="truncate">{getPaymentStatusText(booking)}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full min-h-[60px] flex items-center justify-center text-gray-400 text-xs py-4">
                              <span>Available</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Color legend for booking status */}
      <div className="p-2 sm:p-4 bg-tertiary/90 border-t">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
          <div>
            <div className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">Payment Status:</div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center">
                <FaCreditCard className="text-green-600 mr-1 text-xs sm:text-sm" />
                <span className="text-[10px] sm:text-xs">Paid</span>
              </div>
              <div className="flex items-center">
                <FaMoneyBill className="text-green-600 mr-1 text-xs sm:text-sm" />
                <span className="text-[10px] sm:text-xs">Pay Cash at Hotel</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

BookingList.propTypes = {
  token: PropTypes.string.isRequired
};

export default BookingList;
