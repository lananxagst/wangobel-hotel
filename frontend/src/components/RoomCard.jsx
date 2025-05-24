import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FaBed, FaUsers, FaStar } from 'react-icons/fa';
import { formatToIDR } from '../utils/currency';

const RoomCard = ({ room }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <img
        src={room.images[0]?.url || '/placeholder-room.jpg'}
        alt={room.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
        <div className="flex items-center gap-4 mb-2 text-gray-600">
          <div className="flex items-center gap-1">
            <FaBed />
            <span>{room.roomType}</span>
          </div>
          <div className="flex items-center gap-1">
            <FaUsers />
            <span>Up to {room.capacity} guests</span>
          </div>
        </div>
        <div className="flex items-center gap-1 mb-3">
          <FaStar className="text-yellow-400" />
          <span>{room.rating.toFixed(1)}</span>
          <span className="text-gray-500">({room.numReviews} reviews)</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold">
            {formatToIDR(room.price)}
            <span className="text-sm text-gray-500">/night</span>
          </div>
          <Link
            to={`/rooms/${room._id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

RoomCard.propTypes = {
  room: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired
      })
    ).isRequired,
    roomType: PropTypes.string.isRequired,
    capacity: PropTypes.number.isRequired,
    rating: PropTypes.number.isRequired,
    numReviews: PropTypes.number.isRequired,
    price: PropTypes.number.isRequired
  }).isRequired
};

export default RoomCard;
