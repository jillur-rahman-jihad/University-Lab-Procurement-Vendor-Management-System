import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConsultantProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/consultants/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photoFile) {
      setError('Please select a photo');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('profilePhoto', photoFile);

    try {
      const response = await axios.post(`${API_URL}/api/consultants/upload-photo`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setProfile(response.data.user);
      setPhotoFile(null);
      setPhotoPreview(null);
      setSuccess('Photo uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to upload photo: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6">Consultant Profile</h1>

      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="p-3 mb-4 bg-green-100 text-green-700 rounded">{success}</div>}

      {profile && (
        <div className="space-y-6">
          {/* Profile Photo Section */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Profile Photo</h2>
            <div className="flex items-center gap-6">
              <div>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-lg object-cover" />
                ) : profile.consultantInfo?.profilePhoto ? (
                  <img src={`${API_URL}${profile.consultantInfo.profilePhoto}`} alt="Profile" className="w-32 h-32 rounded-lg object-cover" />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No photo</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <form onSubmit={handlePhotoUpload}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <button
                    type="submit"
                    disabled={uploading || !photoFile}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-2">
              <p><strong>Name:</strong> {profile.name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Phone:</strong> {profile.phone || 'N/A'}</p>
            </div>
          </div>

          {/* Consultant Info */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Consultant Information</h2>
            <div className="space-y-2">
              <p><strong>Experience Level:</strong> {profile.consultantInfo?.experienceLevel || 'N/A'}</p>
              <p><strong>Completed Projects:</strong> {profile.consultantInfo?.completedProjects || 0}</p>
              <p><strong>Rating:</strong> {profile.consultantInfo?.rating || 0} ⭐</p>
              <p><strong>Availability:</strong> {profile.consultantInfo?.availability ? '✓ Available' : '✗ Not Available'}</p>
              <p><strong>Expertise:</strong> {profile.consultantInfo?.expertise?.join(', ') || 'Not specified'}</p>
              <p><strong>Bio:</strong> {profile.consultantInfo?.bio || 'No bio added'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantProfile;
