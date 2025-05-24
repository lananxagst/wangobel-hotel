import { useState, useEffect, useCallback } from "react";
import PropTypes from 'prop-types';
import axios from "axios";
import { backend_url, currency } from "../constants";
import { toast } from "react-toastify";
import { FaBed } from "react-icons/fa";

const Orders = ({ token }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllBookings = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${backend_url}/api/bookings`,
        { headers: { token } }
      );
      
      if (response.data.success) {
        setBookings(response.data.bookings.reverse());
      } else {
        toast.error(response.data.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateBookingStatus = useCallback(async (bookingId, newStatus) => {
    try {
      const response = await axios.patch(
        `${backend_url}/api/bookings/${bookingId}/status`,
        { status: newStatus },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success('Booking status updated successfully');
        await fetchAllBookings();
      } else {
        toast.error(response.data.message || 'Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error(error.response?.data?.message || 'Failed to update booking status');
    }
  }, [token, fetchAllBookings]);

  useEffect(() => {
    fetchAllBookings();
  }, [token, fetchAllBookings]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'text-green-500';
      case 'checked_in': return 'text-blue-500';
      case 'checked_out': return 'text-gray-500';
      case 'cancelled': return 'text-red-500';
      case 'pending':
      default: return 'text-yellow-500';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 overflow-auto hide-scrollbar">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Room Bookings</h1>
        <div className="flex items-center gap-2">
          <FaBed className="text-xl" />
          <p className="text-lg">{bookings.length} Bookings</p>
        </div>
      </div>

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <div
            key={booking._id}
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between md:block">
                  <h3 className="font-medium">Guest Information</h3>
                  <p className="text-gray-600">{booking.guestName}</p>
                  <p className="text-gray-600">{booking.guestEmail}</p>
                  <p className="text-gray-600">{booking.guestPhone}</p>
                </div>

                <div className="flex justify-between md:block">
                  <h3 className="font-medium">Room Details</h3>
                  <p className="text-gray-600">{booking.roomName}</p>
                  <p className="text-gray-600">Type: {booking.roomType}</p>
                  <p className="text-gray-600">Guests: {booking.numberOfGuests}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between md:block">
                  <h3 className="font-medium">Booking Details</h3>
                  <p className="text-gray-600">
                    Check-in: {new Date(booking.checkIn).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600">
                    Check-out: {new Date(booking.checkOut).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600">
                    Total: {currency}{booking.totalAmount}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <select
                    onChange={(e) => updateBookingStatus(booking._id, e.target.value)}
                    value={booking.status}
                    className={`px-3 py-1.5 border rounded-full outline-none ${getStatusColor(booking.status)}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                    <option value="checked_out">Checked Out</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex justify-between items-center">
              <p>Booked on {new Date(booking.createdAt).toLocaleString()}</p>
              <p>Booking ID: {booking._id}</p>
            </div>
          </div>
        ))}

        {bookings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FaBed className="mx-auto text-4xl mb-2 opacity-50" />
            <p>No bookings found</p>
          </div>
        )}
      </div>
    </div>
  );
};

Orders.propTypes = {
  token: PropTypes.string.isRequired
};

export default Orders;
