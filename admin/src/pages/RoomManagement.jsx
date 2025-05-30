import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { backend_url } from '../constants';
import { compressImage } from '../utils/imageUtils';

const RoomManagement = ({ token }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [updatingRoom, setUpdatingRoom] = useState(false);
  const [editFormData, setEditFormData] = useState({
    roomNumber: '',
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
      roomNumber: room.roomNumber,
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
    console.log(`Deleting image at index ${index}`);
    setEditFormData(prev => {
      // Dapatkan array gambar baru dengan item yang dihapus
      const updatedImages = prev.images.filter((_, i) => i !== index);
      console.log('Images after deletion:', updatedImages);
      
      return {
        ...prev,
        images: updatedImages
      };
    });
  };

  const handleNewImageChange = async (e) => {
    // Gunakan pendekatan yang sama seperti di Add.jsx
    const files = Array.from(e.target.files);
    
    // Kita tidak perlu mengompres di sini, hanya simpan file asli
    // Kompresi akan dilakukan saat upload
    setEditFormData(prev => ({
      ...prev,
      newImages: [...prev.newImages, ...files]
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
    setUpdatingRoom(true);
    console.log('Starting room update with image upload');

    try {
      // =====================================================================
      // PERBAIKAN: Memastikan gambar yang dihapus benar-benar hilang
      // =====================================================================
      
      // 1. Upload gambar baru dan dapatkan URL mereka dalam format {imageKey: url}
      const imageUrls = {};
      
      // Log state saat ini untuk debugging
      console.log('Current edit form state:', editFormData);
      console.log('Jumlah gambar lama yang tersisa:', editFormData.images.length);

      // Pertama, simpan gambar yang sudah ada - HANYA jika memang masih ada di state
      // Ini memastikan gambar yang sudah dihapus (dengan handleImageDelete) tidak akan dipertahankan
      if (editFormData.images && editFormData.images.length > 0) {
        // Gunakan nomor indeks yang berurutan untuk gambar yang tersisa
        editFormData.images.forEach((img, index) => {
          if (img && img.url && typeof img.url === 'string') {
            // Penting: gunakan indeks berurutan untuk menghindari kekosongan
            imageUrls[`image${index + 1}`] = img.url;
            console.log(`Preserved remaining image${index + 1}:`, img.url);
          }
        });
      }

      // Tambahkan logging untuk memastikan imageUrls sudah benar
      console.log('Existing images that will be kept:', imageUrls);
      
      // Kemudian, upload gambar baru (jika ada)
      if (editFormData.newImages && editFormData.newImages.length > 0) {
        console.log(`Processing ${editFormData.newImages.length} new images`);
        
        // Mulai indeks dari jumlah gambar yang sudah ada + 1
        let newImageIndex = Object.keys(imageUrls).length + 1;
        
        for (let i = 0; i < editFormData.newImages.length; i++) {
          const file = editFormData.newImages[i];
          if (!file) continue;
          
          console.log(`Compressing new image ${i + 1}/${editFormData.newImages.length}`);
          const compressedImage = await compressImage(file);
          if (!compressedImage) {
            console.warn(`Image ${i + 1} compression failed, skipping`);
            continue;
          }
          
          try {
            console.log(`Uploading compressed image ${i + 1} to backend`);
            // Gunakan format yang sama persis dengan Add.jsx
            const uploadRes = await axios.post(
              `${backend_url}/api/upload`,
              { image: compressedImage },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (uploadRes.data.success) {
              // Ekstrak URL, pastikan berupa string
              let imageUrl = uploadRes.data.url;
              if (typeof imageUrl === 'object') {
                // Coba ekstrak string URL jika hasilnya objek
                imageUrl = imageUrl.secure_url || imageUrl.url || imageUrl.src || '';
              }
              
              if (typeof imageUrl === 'string' && imageUrl) {
                const key = `image${newImageIndex}`;
                imageUrls[key] = imageUrl;
                console.log(`Added new uploaded image as ${key}:`, imageUrl);
                newImageIndex++;
              }
            }
          } catch (uploadError) {
            console.error(`Error uploading new image ${i + 1}:`, uploadError);
          }
        }
      }
      
      console.log('Final image URLs structure:', imageUrls);
      
      // PERBAIKAN PENTING: Tambahkan flag untuk menunjukkan bahwa gambar telah diperbarui
      // Ini memberitahu backend bahwa array gambar telah berubah dan harus diperbarui
      const updatedRoom = {
        roomNumber: editFormData.roomNumber,
        name: editFormData.name,
        description: editFormData.description,
        price: Number(editFormData.price) || 100, // Default ke 100 jika tidak valid
        capacity: Number(editFormData.capacity) || 2, // Default ke 2 jika tidak valid
        roomType: editFormData.roomType,
        amenities: editFormData.amenities,
        imagesUpdated: true, // Flag untuk memberitahu backend bahwa gambar berubah
        // KUNCI SUKSES: Gunakan spread operator seperti di Add.jsx
        ...imageUrls
      };
      
      // Jika tidak ada gambar sama sekali (semua dihapus), tambahkan flag khusus
      if (Object.keys(imageUrls).length === 0) {
        updatedRoom.clearImages = true; // Instruksi ke backend untuk menghapus semua gambar
        console.log('All images were removed, adding clearImages flag');
      }
      
      // Hapus properti undefined/null untuk menghindari error validasi
      Object.keys(updatedRoom).forEach(key => {
        if (updatedRoom[key] === undefined || updatedRoom[key] === null) {
          delete updatedRoom[key];
        }
      });
      
      console.log('Sending updated room data to backend (original format):', updatedRoom);

      // Kirim data ke backend dengan format yang telah disesuaikan
      const response = await axios.put(
        `${backend_url}/api/rooms/${editingRoom._id}`,
        updatedRoom,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Backend update response:', response.data);
      toast.success('Room updated successfully');
      toast.info('Email notifications are being sent to subscribers');
      
      // Reset state
      setEditingRoom(null);
      setEditFormData({
        roomNumber: '',
        name: '',
        description: '',
        price: '',
        capacity: 2,
        roomType: 'Executive',
        amenities: [],
        images: [],
        newImages: []
      });
      setShowEditModal(false);
      
      // Tunggu sebentar sebelum fetch untuk memastikan backend selesai memproses
      setTimeout(() => {
        fetchRooms();
      }, 1000);
    } catch (err) {
      console.error('Room update error:', err);
      toast.error('Error updating room: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingRoom(false);
    }
  };





  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
        <span className="ml-3 text-lg text-gray-600">Loading rooms...</span>
      </div>
    );
  }

  return (
    <div className="admin-container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Room Management</h1>
          <p className="text-text-light mt-1">Manage your hotel rooms and properties</p>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-medium">{rooms.length}</span> rooms available
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room._id} className="admin-card group hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="relative overflow-hidden">
              <img
                src={room.images[0]?.url || '/placeholder-room.jpg'}
                alt={room.name}
                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                <span className="text-primary">{room.roomType}</span>
              </div>
            </div>
            
            <div className="p-5">
              <div className="mb-3">
                <h3 className="text-xl font-bold text-primary">{room.name}</h3>
                <p className="text-text-light text-sm mt-1">Room Capacity {room.capacity}</p>
              </div>
              
              <div className="flex items-center space-x-2 my-3">
                <span className="text-secondary font-bold text-lg">IDR {room.price.toLocaleString()}K</span>
                <span className="text-text-light">/night</span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {room.amenities && room.amenities.slice(0, 3).map((amenity, index) => (
                  <span key={index} className="bg-tertiary text-text-light text-xs px-2 py-1 rounded-full">{amenity}</span>
                ))}
                {room.amenities && room.amenities.length > 3 && (
                  <span className="bg-tertiary text-text-light text-xs px-2 py-1 rounded-full">+{room.amenities.length - 3} more</span>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleDelete(room._id)}
                  className="admin-btn-danger flex items-center gap-2 !py-1.5 !px-3 text-sm"
                  disabled={deletingRoomId === room._id}
                >
                  {deletingRoomId === room._id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <FaTrash size={14} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleEdit(room)}
                  className="btn-yellow flex items-center gap-2 !py-1.5 !px-3 text-sm"
                >
                  <FaEdit size={14} />
                  <span>Edit Details</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-primary/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-primary">Edit Room</h2>
              <p className="text-text-light mt-1">Update room details and information</p>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Room Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="admin-input"
                  placeholder="Enter room name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Room Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="admin-input min-h-[100px]"
                  placeholder="Describe the room features and highlights"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Price per Night (IDR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">IDR</span>
                    <input
                      type="number"
                      value={editFormData.price}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="admin-input !pl-12"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Room Capacity</label>
                  <input
                  type="number"
                  value={editFormData.capacity}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  className="admin-input"
                  placeholder="2"
                  required
                />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Room Type</label>
                <select
                  value={editFormData.roomType}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, roomType: e.target.value }))}
                  className="admin-input"
                  required
                >
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">Room Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {availableAmenities.map((amenity) => (
                    <label 
                      key={amenity} 
                      className={`flex items-center space-x-2 p-2 border rounded-md cursor-pointer transition-all ${editFormData.amenities.includes(amenity) ? 'border-secondary bg-tertiary' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={editFormData.amenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="rounded border-gray-300 text-secondary focus:ring-secondary"
                      />
                      <span className="text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">Current Room Images</label>
                {editFormData.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                    {editFormData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square overflow-hidden rounded-lg">
                          <img
                            src={image.url}
                            alt={`Room ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleImageDelete(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-light text-sm italic">No images available for this room</p>
                )}
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-primary mb-2">Add New Images</label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="room-images" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-tertiary hover:bg-tertiary/80 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 5MB)</p>
                    </div>
                    <input 
                      id="room-images" 
                      type="file" 
                      multiple 
                      onChange={handleNewImageChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </label>
                </div>
                {editFormData.newImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-primary font-medium mb-2">{editFormData.newImages.length} new image(s) selected</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: Math.min(editFormData.newImages.length, 5) }).map((_, i) => (
                        <div key={i} className="w-12 h-12 bg-tertiary rounded-md flex items-center justify-center">
                          <span className="text-xs text-gray-600">Image {i+1}</span>
                        </div>
                      ))}
                      {editFormData.newImages.length > 5 && (
                        <div className="w-12 h-12 bg-tertiary rounded-md flex items-center justify-center">
                          <span className="text-xs text-gray-600">+{editFormData.newImages.length - 5}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="admin-btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary relative"
                  disabled={updatingRoom}
                >
                  {updatingRoom ? (
                    <>
                      <span className="opacity-0">Update Room</span>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <FaSpinner className="animate-spin text-white" />
                      </span>
                    </>
                  ) : 'Update Room'}
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
