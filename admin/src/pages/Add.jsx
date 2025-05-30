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
  // Pastikan price selalu berupa string untuk input
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
  // Pastikan capacity selalu berupa number untuk mencegah NaN
  const [capacity, setCapacity] = useState(2);
  const [amenities, setAmenities] = useState([]);
  const [availability, setAvailability] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Fungsi untuk memastikan input numerik valid
  const handleNumberInput = (value, setter, defaultValue) => {
    if (value === '' || isNaN(Number(value))) {
      setter(defaultValue);
    } else {
      setter(value);
    }
  };

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
        
        // Upload images first - using same approach as original working code
        const imageUrls = {};
        for (const [key, file] of Object.entries(images)) {
          if (file) {
            console.log(`Processing ${key}:`, file);
            const compressedImage = await compressImage(file);
            if (!compressedImage) {
              console.warn(`Failed to compress ${key}`);
              continue;
            }
            
            console.log(`Uploading ${key} to ${backend_url}/api/upload`);
            try {
              const uploadRes = await axios.post(
                `${backend_url}/api/upload`,
                { image: compressedImage },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              
              if (uploadRes.data.success) {
                imageUrls[key] = uploadRes.data.url;
                console.log(`Successfully uploaded ${key}, got URL:`, uploadRes.data.url);
              } else {
                console.warn(`Upload for ${key} was not successful:`, uploadRes.data);
              }
            } catch (uploadError) {
              console.error(`Error uploading ${key}:`, uploadError.message);
              console.error("Full error:", uploadError);
              toast.error(`Failed to upload image ${key}: ${uploadError.message}`);
            }
          }
        }
        
        // Pastikan price dan capacity selalu numerik
        const validPrice = Number(price) || 100; // Default ke 100 jika tidak valid
        const validCapacity = Number(capacity) || 2; // Default ke 2 jika tidak valid
        
        console.log('Image URLs for backend:', imageUrls);
        
        // Create room dengan image URLs - using exact approach from working code
        const roomData = {
          name,
          description,
          price: validPrice,
          roomType,
          capacity: validCapacity,
          amenities,
          isAvailable: availability,
          ...imageUrls // Spread operator to add image1, image2, etc. properties
        };
        
        console.log('Room data being sent to backend (original format):', roomData);

        console.log(`Using backend URL: ${backend_url}`);
        
        // Hapus properti undefined/null untuk menghindari error validasi
        Object.keys(roomData).forEach(key => {
          if (roomData[key] === undefined || roomData[key] === null) {
            delete roomData[key];
          }
        });
        
        // Gunakan format yang sama persis dengan kode yang berhasil
        const response = await axios.post(
          `${backend_url}/api/rooms`,
          roomData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Consider response successful if we get status 201
        if (response.status === 201) {
          console.log('Room creation successful. Response:', response.data);
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
            navigate('/rooms');
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
    <div className="admin-container max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary">Add New Room</h2>
        <p className="text-text-light mt-1">Create a new room listing with details and images</p>
      </div>
      
      <div className="admin-card p-6">
        <form onSubmit={onSubmitHandler} className="space-y-6">
        {loading && (
          <div className="fixed inset-0 bg-primary/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary"></div>
              <div>
                <p className="text-lg font-medium text-primary">Adding room...</p>
                <p className="text-sm text-text-light mt-1">Please wait while we process your request</p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Room Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="admin-input"
              placeholder="e.g., Ocean View Suite 101"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="admin-label">Price per Night</label>
              <input
                type="number"
                value={price}
                onChange={(e) => handleNumberInput(e.target.value, setPrice, "100")}
                className="admin-input"
                required
                min="0"
              />
            </div>

            <div>
              <label className="admin-label">Capacity</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => handleNumberInput(e.target.value, setCapacity, 2)}
                className="admin-input"
                required
                min="1"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary mb-1">Room Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="admin-textarea"
            placeholder="Describe the room's features, atmosphere, and special amenities..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Room Type</label>
            <div className="relative" ref={roomTypeRef}>
              <button
                type="button"
                className="flex justify-between items-center w-full admin-input !py-2.5"
                onClick={() => setIsRoomTypeOpen(!isRoomTypeOpen)}
              >
                <span>{roomType}</span>
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isRoomTypeOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-md shadow-lg overflow-hidden">
                  {roomTypes.map((type) => (
                    <div
                      key={type}
                      className={`px-4 py-2.5 cursor-pointer hover:bg-tertiary transition-colors ${roomType === type ? 'bg-tertiary text-primary font-medium' : 'text-gray-700'}`}
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
          
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Guest Capacity</label>
            <div className="relative">
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                min="1"
                max="10"
                className="admin-input"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">guests</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">Room Amenities</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {availableAmenities.map(amenity => (
              <div 
                key={amenity}
                onClick={() => handleAmenityToggle(amenity)}
                className={`p-2.5 border rounded-md cursor-pointer transition-all ${
                  amenities.includes(amenity) 
                    ? 'border-primary bg-secondary text-primary font-medium' 
                    : 'border-gray-200 hover:bg-secondary/100 hover:text-primary'
                }`}
              >
                <span className="text-sm">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">Room Images</label>
          <p className="text-text-light text-sm mb-3">Upload up to 4 high-quality images of the room</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["image1", "image2", "image3", "image4"].map((imgKey, i) => (
              <label 
                key={i} 
                htmlFor={imgKey}
                className={`relative aspect-square flex items-center justify-center rounded-lg cursor-pointer border-2 transition-all ${images[imgKey] ? 'border-transparent' : 'border-dashed border-gray-300 hover:border-secondary hover:bg-tertiary/80'}`}
              >
                {images[imgKey] ? (
                  <div className="w-full h-full overflow-hidden rounded-lg">
                    <img
                      src={URL.createObjectURL(images[imgKey])}
                      alt={`Room preview ${i+1}`}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                      <span className="text-white opacity-0 hover:opacity-100 font-medium text-sm">Change</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <img src={upload_icon} alt="" className="w-8 h-8 mx-auto mb-2 opacity-70" />
                    <p className="text-xs text-text-light">Image {i+1}</p>
                  </div>
                )}
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

        <div className="bg-tertiary/50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="availability-checkbox"
              checked={availability}
              onChange={(e) => setAvailability(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-secondary focus:ring-secondary"
            />
            <label htmlFor="availability-checkbox" className="flex flex-col cursor-pointer">
              <span className="font-medium text-primary">Room Availability</span>
              <span className="text-sm text-text-light">Room will be immediately available for booking</span>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <button type="submit" className="admin-btn-primary w-full py-3">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Add New Room'
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

Add.propTypes = {
  token: PropTypes.string.isRequired
};

export default Add;
