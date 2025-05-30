import { useState, useContext, useEffect, useRef } from 'react';
import { RoomContext } from '../context/RoomContext';
import { FiEdit2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, setUser } = useContext(RoomContext);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    // Fetch user profile when component mounts
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setUser(response.data.user);
          setFormData({
            name: response.data.user.name || '',
            phone: response.data.user.phone || '',
            address: response.data.user.address || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      }
    };

    fetchProfile();
  }, [setUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    toast.info('Uploading image...', { autoClose: false, toastId: 'uploading' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload melalui backend untuk signed upload
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/upload-photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      const imageUrl = response.data.secure_url;
      
      // Update user profile with new image URL
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, 
        { picture: imageUrl },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setUser(prev => ({ ...prev, picture: imageUrl }));
      toast.dismiss('uploading');
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.dismiss('uploading');
      toast.error('Failed to update profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUser(response.data.user);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-tertiary pt-5">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8 h-full">
          {/* Left Sidebar */}
          <div className="w-full md:w-1/4">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 h-full">
            {/* Profile Image */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              <img
                src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                alt={user?.name}
                className="w-full h-full rounded-full object-cover"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // If image fails to load, use UI Avatars as fallback
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`;
                }}
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                className={`absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white hover:bg-secondary/90 transition-colors shadow-md ${isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}
                disabled={isUploading}
              >
                {isUploading ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <FiEdit2 size={16} />
                )}
              </button>
            </div>
            
            {/* User Name */}
            <h2 className="text-xl font-semibold text-center mb-2 text-primary">{user?.name}</h2>
            <p className="text-text-light text-center mb-6 text-sm">@{user?.name?.toLowerCase().replace(/\s+/g, '')}</p>

            {/* Navigation */}
            <nav className="space-y-2">
              <Link to="/profile" className="block w-full py-2.5 px-4 bg-secondary text-white rounded-md font-medium hover:bg-secondary/90 transition-colors shadow-sm">
                Account
              </Link>
              <Link to="/my-reservations" className="block w-full py-2.5 px-4 text-text-dark rounded-md transition-colors border border-gray-200">
                My Reservations
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 h-full">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-primary">Account Information</h1>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Name</label>
                <div className={`p-3 rounded-md border ${isEditing ? 'bg-white border-secondary' : 'bg-tertiary border-transparent'}`}>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-transparent focus:outline-none"
                    />
                  ) : (
                    user?.name
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Email</label>
                <div className={`p-3 rounded-md border ${isEditing ? 'bg-white border-secondary' : 'bg-tertiary border-transparent'}`}>
                  {isEditing ? (
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full bg-transparent focus:outline-none"
                    />
                  ) : (
                    user?.email
                  )}
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Phone</label>
                <div className={`p-3 rounded-md border ${isEditing ? 'bg-white border-secondary' : 'bg-tertiary border-transparent'}`}>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-transparent focus:outline-none"
                    />
                  ) : (
                    formData.phone || '-'
                  )}
                </div>
              </div>

              {/* Address Field */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Address</label>
                <div className={`p-3 rounded-md border ${isEditing ? 'bg-white border-secondary' : 'bg-tertiary border-transparent'}`}>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full bg-transparent focus:outline-none"
                    />
                  ) : (
                    formData.address || '-'
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isSaving}
                    className={`px-6 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors shadow-sm flex items-center gap-2 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-secondary text-white font-semibold rounded-md hover:bg-secondary/90 transition-colors shadow-sm flex items-center gap-2"
                >
                  <FiEdit2 size={16} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
