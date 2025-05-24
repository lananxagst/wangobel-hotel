import { useLocation, Link } from 'react-router-dom';
import { formatToIDR } from '../utils/currency';
import { FaCheckCircle, FaCalendarAlt, FaUsers, FaEnvelope, FaPhone } from 'react-icons/fa';

const BookingConfirmation = () => {
  const { state } = useLocation();
  const { booking, room } = state || {};

  if (!booking || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">No booking information found</h2>
          <Link to="/" className="mt-4 inline-block text-secondary hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-secondary text-white p-6 text-center">
            <FaCheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
            <p className="mt-2 text-secondary-100">Thank you for choosing our hotel</p>
          </div>

          {/* Booking Details */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Booking Details</h2>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <FaCalendarAlt className="w-5 h-5 mr-3 text-secondary" />
                    <div>
                      <p className="text-sm">Check-in</p>
                      <p className="font-medium text-gray-800">
                        {new Date(booking.checkIn).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaCalendarAlt className="w-5 h-5 mr-3 text-secondary" />
                    <div>
                      <p className="text-sm">Check-out</p>
                      <p className="font-medium text-gray-800">
                        {new Date(booking.checkOut).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaUsers className="w-5 h-5 mr-3 text-secondary" />
                    <div>
                      <p className="text-sm">Guests</p>
                      <p className="font-medium text-gray-800">{booking.guests}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Guest Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <FaUsers className="w-5 h-5 mr-3 text-secondary" />
                    <div>
                      <p className="text-sm">Name</p>
                      <p className="font-medium text-gray-800">{booking.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaEnvelope className="w-5 h-5 mr-3 text-secondary" />
                    <div>
                      <p className="text-sm">Email</p>
                      <p className="font-medium text-gray-800">{booking.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaPhone className="w-5 h-5 mr-3 text-secondary" />
                    <div>
                      <p className="text-sm">Phone</p>
                      <p className="font-medium text-gray-800">{booking.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Details */}
            <div className="mt-8 pt-6 border-t">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Room Details</h2>
              <div className="flex items-start space-x-4">
                <img
                  src={room.images[0]}
                  alt={room.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-bold text-gray-800">{room.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{room.roomType}</p>
                  <p className="text-secondary font-bold mt-2">{formatToIDR(room.price)} / night</p>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            {booking.specialRequests && (
              <div className="mt-6 pt-6 border-t">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Special Requests</h2>
                <p className="text-gray-600">{booking.specialRequests}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex justify-center space-x-4">
              <Link
                to="/"
                className="px-6 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
