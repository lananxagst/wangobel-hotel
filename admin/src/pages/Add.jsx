import { useCallback, useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import { useNavigate } from "react-router-dom";
import upload_icon from "../assets/upload_icon.png";
import axios from "axios";
import { backend_url } from "../constants";
import { compressImage } from "../utils/imageUtils";
import { toast } from "react-toastify";

const Add = ({token}) => {
  const navigate = useNavigate();
  const [images, setImages] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("100");
  const [roomType, setRoomType] = useState("Executive");
  const [isRoomTypeOpen, setIsRoomTypeOpen] = useState(false);
  const roomTypeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roomTypeRef.current && !roomTypeRef.current.contains(event.target)) {
        setIsRoomTypeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const [capacity, setCapacity] = useState(2);
  const [amenities, setAmenities] = useState([]);
  const [availability, setAvailability] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");

  const handleImageChange = (e, key) => {
    setImages((prev) => ({ ...prev, [key]: e.target.files[0] }));
  };

  const roomTypes = [
    "Executive",
    "Deluxe",
    "Suite"
  ];

  const availableAmenities = [
    "Wi-Fi",
    "Air Conditioning",
    "TV",
    "Mini Bar",
    "Safe",
    "Coffee Maker",
    "Balcony",
    "Ocean View",
    "Room Service",
    "King Bed"
  ];

  const handleAmenityToggle = (amenity) => {
    setAmenities(prev => 
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const onSubmitHandler = useCallback(
    async (e) => {
      e.preventDefault();
      if (loading) return;
      
      try {
        if (!token) {
          toast.error('Please login first');
          navigate('/');
          return;
        }

        setLoading(true);
        toast.info('Uploading images...', { autoClose: false });
        // Upload images first
        const imageUrls = {};
        for (const [key, file] of Object.entries(images)) {
          if (file) {
            const compressedImage = await compressImage(file);
            if (!compressedImage) continue;
            
            const uploadRes = await axios.post(
              `${backend_url}/api/upload`,
              { image: compressedImage },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (uploadRes.data.success) {
              imageUrls[key] = uploadRes.data.url;
            }
          }
        }

        // Create room with image URLs
        const roomData = {
          name,
          description,
          price: Number(price),
          roomType,
          capacity: Number(capacity),
          amenities,
          isAvailable: availability,
          ...imageUrls
        };

        const response = await axios.post(
          `${backend_url}/api/rooms`,
          roomData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Consider response successful if we get status 201
        if (response.status === 201) {
          toast.dismiss();
          toast.success('Room added successfully!');
          toast.success('Done! Room has been added to the system.');
          setName("");
          setDescription("");
          setPrice("100");
          setRoomType("Executive");
          setCapacity(2);
          setAmenities([]);
          setAvailability(true);
          setImages({ image1: null, image2: null, image3: null, image4: null });
          
          // Redirect to room management after 2 seconds
          setTimeout(() => {
            navigate('/admin/rooms');
          }, 2000);
        } else {
          toast.dismiss();
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error('Error adding room:', error);
        toast.dismiss();
        toast.error(
          error.response?.data?.message ||
            "Something went wrong while adding room"
        );
      } finally {
        setLoading(false);
      }
    },
    [name, description, price, roomType, capacity, amenities, availability, images, token, loading, navigate]
  );

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add Room</h2>
      <form onSubmit={onSubmitHandler} className="space-y-4">
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-lg">Adding room...</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Room Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="e.g., Ocean View Suite 101"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Price per Night</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Check-in Date</label>
          <div className="relative" onClick={() => document.getElementById('checkin').showPicker()}>
            <input
              type="date"
              id="checkin"
              value={checkin}
              onChange={(e) => setCheckin(e.target.value)}
              className="w-full p-2 pl-3 border rounded focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer bg-transparent"
              required
            />
            <svg className="w-5 h-5 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Check-out Date</label>
          <div className="relative" onClick={() => document.getElementById('checkout').showPicker()}>
            <input
              type="date"
              id="checkout"
              value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
              className="w-full p-2 pl-3 border rounded focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer bg-transparent"
              required
            />
            <svg className="w-5 h-5 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-500 h-32"
            placeholder="Describe the room's features and atmosphere..."
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Room Type</label>
            <div className="relative">
              <button
                type="button"
                className="flex justify-between items-center w-full p-2 border rounded bg-white text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={() => setIsRoomTypeOpen(!isRoomTypeOpen)}
              >
                <span>{roomType}</span>
                <svg className="h-4 w-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isRoomTypeOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-md shadow-lg">
                  {roomTypes.map((type) => (
                    <div
                      key={type}
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${roomType === type ? 'bg-gray-100' : ''}`}
                      onClick={() => {
                        setRoomType(type);
                        setIsRoomTypeOpen(false);
                      }}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
              min="1"
              max="10"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amenities</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {availableAmenities.map(amenity => (
              <div 
                key={amenity}
                onClick={() => handleAmenityToggle(amenity)}
                className={`p-2 border rounded cursor-pointer ${
                  amenities.includes(amenity) 
                    ? 'bg-gray-800 text-white' 
                    : 'hover:bg-gray-50'
                }`}
              >
                {amenity}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Room Images</label>
          <div className="flex gap-2 pt-2">
            {["image1", "image2", "image3", "image4"].map((imgKey, i) => (
              <label key={i} htmlFor={imgKey}>
                <img
                  src={images[imgKey] ? URL.createObjectURL(images[imgKey]) : upload_icon}
                  alt=""
                  className="w-16 h-16 aspect-square object-cover ring-1 ring-slate-900/5 rounded-lg"
                />
                <input
                  onChange={(e) => handleImageChange(e, imgKey)}
                  type="file"
                  accept="image/*"
                  id={imgKey}
                  hidden
                />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Availability</label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={availability}
              onChange={(e) => setAvailability(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Room is available for booking</span>
          </div>
        </div>

        <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 w-full transition-colors">
          Add Room
        </button>
      </form>
    </div>
  );
};

Add.propTypes = {
  token: PropTypes.string.isRequired
};

export default Add;
