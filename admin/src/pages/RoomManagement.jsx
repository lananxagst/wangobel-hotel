import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaStar, FaRegStar } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { backend_url } from '../constants';
import { compressImage } from '../utils/imageUtils';

const RoomManagement = ({ token }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: '',
    capacity: 2,
    roomType: 'Executive',
    amenities: [],
    images: [],
    newImages: []
  });

  const roomTypes = [
    'Executive',
    'Deluxe',
    'Suite'
  ];

  const availableAmenities = [
    'Wi-Fi',
    'Air Conditioning',
    'TV',
    'Mini Bar',
    'Safe',
    'Coffee Maker',
    'Balcony',
    'Ocean View',
    'Room Service',
    'King Bed'
  ];

  const fetchRooms = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backend_url}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(data);
    } catch (err) {
      toast.error('Error fetching rooms: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    setDeletingRoomId(roomId);
    try {
      await axios.delete(`${backend_url}/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Room deleted successfully');
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting room');
    } finally {
      setDeletingRoomId(null);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setEditFormData({
      name: room.name,
      description: room.description,
      price: room.price,
      capacity: room.capacity,
      roomType: room.roomType,
      amenities: room.amenities || [],
      images: room.images || [],
      newImages: []
    });
    setShowEditModal(true);
  };

  const handleImageDelete = (index) => {
    setEditFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleNewImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const compressedFiles = await Promise.all(
      files.map(async (file) => {
        return await compressImage(file);
      })
    );
    setEditFormData(prev => ({
      ...prev,
      newImages: [...prev.newImages, ...compressedFiles]
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setEditFormData(prev => {
      const amenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities };
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    try {
      // Upload new images if any
      const newImageUploadPromises = editFormData.newImages.map(async (image) => {
        const formData = new FormData();
        formData.append('file', image);
        formData.append('upload_preset', 'wangobel');

        const res = await axios.post(
          'https://api.cloudinary.com/v1_1/your-cloud-name/image/upload',
          formData
        );

        return {
          public_id: res.data.public_id,
          url: res.data.secure_url
        };
      });

      const uploadedNewImages = await Promise.all(newImageUploadPromises);

      const updatedRoom = {
        name: editFormData.name,
        description: editFormData.description,
        price: Number(editFormData.price),
        capacity: Number(editFormData.capacity),
        roomType: editFormData.roomType,
        amenities: editFormData.amenities,
        images: [...editFormData.images, ...uploadedNewImages]
      };

      await axios.put(
        `${backend_url}/api/rooms/${editingRoom._id}`,
        updatedRoom,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Room updated successfully');
      setShowEditModal(false);
      fetchRooms();
    } catch (err) {
      toast.error('Error updating room: ' + (err.response?.data?.message || err.message));
    }
  };

  const toggleFeatured = async (roomId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:4000/api/rooms/${roomId}`,
        { featured: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Room status updated');
      fetchRooms();
    } catch (err) {
      toast.error('Error updating room status: ' + err.message);
    }
  };



  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Room List</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={room.images[0]?.url || '/placeholder-room.jpg'}
              alt={room.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{room.name}</h3>
                <button
                  onClick={() => toggleFeatured(room._id, room.featured)}
                  className="text-yellow-400 hover:text-yellow-500"
                  title={room.featured ? 'Remove from featured' : 'Add to featured'}
                >
                  {room.featured ? <FaStar /> : <FaRegStar />}
                </button>
              </div>
              <p className="text-gray-600 mb-2">{room.roomType}</p>
              <p className="text-gray-800 font-bold mb-2">${room.price}/night</p>
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => handleDelete(room._id)}
                  className="flex items-center gap-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deletingRoomId === room._id}
                >
                  {deletingRoomId === room._id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash />
                      Delete
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleEdit(room)}
                  className="flex items-center gap-2 text-gray-800 hover:text-gray-900"
                >
                  <FaEdit />
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Room</h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price per Night</label>
                  <input
                    type="number"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <input
                    type="number"
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Room Type</label>
                <select
                  value={editFormData.roomType}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, roomType: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                >
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editFormData.amenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="rounded border-gray-300"
                      />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Images</label>
                <div className="grid grid-cols-4 gap-4">
                  {editFormData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Room ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageDelete(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Add New Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleNewImageChange}
                  className="mt-1 block w-full"
                />
                {editFormData.newImages.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-4">
                    {editFormData.newImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

RoomManagement.propTypes = {
  token: PropTypes.string.isRequired
};

export default RoomManagement;
