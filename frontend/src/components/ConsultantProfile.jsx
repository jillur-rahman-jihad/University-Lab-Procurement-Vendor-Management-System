import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ConsultantProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editBio, setEditBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [editExpertise, setEditExpertise] = useState(false);
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [editExperienceLevel, setEditExperienceLevel] = useState(false);
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState('');
  const [editStatistics, setEditStatistics] = useState(false);
  const [completedDeployments, setCompletedDeployments] = useState(0);
  const [responseTime, setResponseTime] = useState(24);
  const [editAvailability, setEditAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  
  const fileInputRef = useRef(null);

  const EXPERTISE_OPTIONS = ["Networking", "Graphics", "Research", "AI Infrastructure"];
  const EXPERIENCE_LEVEL_OPTIONS = ["General", "Certified", "Professional"];

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const stored = localStorage.getItem('userInfo');
  let token = null;
  try {
    token = stored ? JSON.parse(stored).token : null;
  } catch (e) {
    token = null;
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/consultants/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setBioText(response.data.consultantInfo?.bio || '');
      setSelectedExpertise(response.data.consultantInfo?.expertise || []);
      setSelectedExperienceLevel(response.data.consultantInfo?.experienceLevel || '');
      setCompletedDeployments(response.data.consultantInfo?.completedLabDeployments || 0);
      setResponseTime(response.data.consultantInfo?.averageResponseTime || 24);
      setIsAvailable(response.data.consultantInfo?.availability !== false);
      setLoading(false);
    } catch (err) {
      console.error('Profile fetch error:', err.response?.data || err.message);
      console.error('Token:', token);
      console.error('API URL:', API_URL);
      setError('Failed to load profile: ' + (err.response?.data?.message || err.message));
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

  const handlePhotoCancel = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePhotoDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your profile photo?')) {
      return;
    }

    try {
      const response = await axios.patch(`${API_URL}/api/consultants/profile`, 
        { profilePhoto: null },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setProfile(response.data.user);
      setSuccess('Profile photo deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete photo: ' + (err.response?.data?.message || err.message));
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

  const handleBioSave = async () => {
    try {
      const response = await axios.patch(`${API_URL}/api/consultants/profile`, 
        { bio: bioText },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setProfile(response.data.user);
      setEditBio(false);
      setSuccess('Bio updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update bio: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleBioCancel = () => {
    setBioText(profile.consultantInfo?.bio || '');
    setEditBio(false);
  };

  const handleExpertiseToggle = (expertise) => {
    setSelectedExpertise(prev =>
      prev.includes(expertise)
        ? prev.filter(e => e !== expertise)
        : [...prev, expertise]
    );
  };

  const handleExpertiseSave = async () => {
    try {
      const response = await axios.patch(`${API_URL}/api/consultants/profile`, 
        { expertise: selectedExpertise },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setProfile(response.data.user);
      setEditExpertise(false);
      setSuccess('Expertise updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update expertise: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExpertiseCancel = () => {
    setSelectedExpertise(profile.consultantInfo?.expertise || []);
    setEditExpertise(false);
  };

  const handleExperienceLevelSave = async () => {
    try {
      const response = await axios.patch(`${API_URL}/api/consultants/profile`, 
        { experienceLevel: selectedExperienceLevel },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setProfile(response.data.user);
      setEditExperienceLevel(false);
      setSuccess('Experience level updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update experience level: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExperienceLevelCancel = () => {
    setSelectedExperienceLevel(profile.consultantInfo?.experienceLevel || '');
    setEditExperienceLevel(false);
  };

  const handleStatisticsSave = async () => {
    try {
      const response = await axios.patch(`${API_URL}/api/consultants/profile`, 
        { completedLabDeployments: completedDeployments, averageResponseTime: responseTime },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setProfile(response.data.user);
      setEditStatistics(false);
      setSuccess('Statistics updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update statistics: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleStatisticsCancel = () => {
    setCompletedDeployments(profile.consultantInfo?.completedLabDeployments || 0);
    setResponseTime(profile.consultantInfo?.averageResponseTime || 24);
    setEditStatistics(false);
  };

  const handleAvailabilitySave = async () => {
    try {
      const response = await axios.patch(`${API_URL}/api/consultants/profile`, 
        { availability: isAvailable },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setProfile(response.data.user);
      setEditAvailability(false);
      setSuccess('Availability updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update availability: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAvailabilityCancel = () => {
    setIsAvailable(profile.consultantInfo?.availability !== false);
    setEditAvailability(false);
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
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      disabled={uploading || !photoFile}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    <button
                      type="button"
                      onClick={handlePhotoCancel}
                      disabled={uploading || !photoFile}
                      className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 disabled:bg-gray-300"
                    >
                      Cancel
                    </button>
                    {profile.consultantInfo?.profilePhoto && !photoFile && (
                      <button
                        type="button"
                        onClick={handlePhotoDelete}
                        disabled={uploading}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                      >
                        Delete Photo
                      </button>
                    )}
                  </div>
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

          {/* Consultant Info - Experience Level */}
          <div className="border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Experience Level</h2>
              <button
                onClick={() => setEditExperienceLevel(!editExperienceLevel)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                {editExperienceLevel ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editExperienceLevel ? (
              <div>
                <div className="space-y-2 mb-4">
                  {EXPERIENCE_LEVEL_OPTIONS.map(level => (
                    <label key={level} className="flex items-center">
                      <input
                        type="radio"
                        name="experienceLevel"
                        value={level}
                        checked={selectedExperienceLevel === level}
                        onChange={(e) => setSelectedExperienceLevel(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="ml-3 text-gray-700 cursor-pointer">{level}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExperienceLevelSave}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save Level
                  </button>
                  <button
                    onClick={handleExperienceLevelCancel}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-lg font-semibold text-blue-600">
                  {profile.consultantInfo?.experienceLevel || 'Not Set'}
                </p>
              </div>
            )}
          </div>

          {/* Profile Statistics */}
          <div className="border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Profile Statistics</h2>
              <button
                onClick={() => setEditStatistics(!editStatistics)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                {editStatistics ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editStatistics ? (
              <div>
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Completed Lab Deployments</label>
                    <input
                      type="number"
                      value={completedDeployments}
                      onChange={(e) => setCompletedDeployments(parseInt(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Average Response Time (hours)</label>
                    <input
                      type="number"
                      value={responseTime}
                      onChange={(e) => setResponseTime(parseInt(e.target.value))}
                      min="0"
                      max="168"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleStatisticsSave}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save Statistics
                  </button>
                  <button
                    onClick={handleStatisticsCancel}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span><strong>Completed Lab Deployments:</strong></span>
                  <span className="text-lg font-semibold text-blue-600">{profile.consultantInfo?.completedLabDeployments || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Overall Rating:</strong></span>
                  <span className="text-lg font-semibold text-blue-600">{profile.consultantInfo?.rating || 0} ⭐</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Average Response Time:</strong></span>
                  <span className="text-lg font-semibold text-blue-600">{profile.consultantInfo?.averageResponseTime || 24} hours</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Current Availability:</strong></span>
                  <span className={`text-lg font-semibold ${profile.consultantInfo?.availability ? 'text-green-600' : 'text-red-600'}`}>
                    {profile.consultantInfo?.availability ? '✓ Available' : '✗ Not Available'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Availability Toggle Section */}
          <div className="border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Availability Status</h2>
              <button
                onClick={() => setEditAvailability(!editAvailability)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                {editAvailability ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editAvailability ? (
              <div>
                <div className="space-y-4 mb-4">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <button
                        onClick={() => setIsAvailable(!isAvailable)}
                        className={`relative w-16 h-8 rounded-full transition-colors ${
                          isAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                            isAvailable ? 'translate-x-8' : 'translate-x-1'
                          }`}
                        ></div>
                      </button>
                      <span className="ml-4 text-lg font-semibold">
                        {isAvailable ? '✓ Available' : '✗ Not Available'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    Toggle to update your availability status. Available consultants can receive project assignments.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAvailabilitySave}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save Availability
                  </button>
                  <button
                    onClick={handleAvailabilityCancel}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    Current Status:
                  </span>
                  <span className={`text-xl font-bold ${profile.consultantInfo?.availability ? 'text-green-600' : 'text-red-600'}`}>
                    {profile.consultantInfo?.availability ? '✓ Available' : '✗ Not Available'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* University Reviews Section */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Reviews from Universities</h2>
            <div className="space-y-4">
              {profile.consultantInfo?.reviews && profile.consultantInfo.reviews.length > 0 ? (
                profile.consultantInfo.reviews.map((review, idx) => (
                  <div key={idx} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-blue-900">{review.universityName}</h3>
                      <span className="text-yellow-500 font-semibold">{review.rating} ⭐</span>
                    </div>
                    <p className="text-gray-700">{review.reviewText}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(review.date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No reviews yet. Complete deployments to earn reviews from universities.</p>
              )}
            </div>
          </div>

          {/* Areas of Expertise Section */}
          <div className="border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Areas of Expertise</h2>
              <button
                onClick={() => setEditExpertise(!editExpertise)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                {editExpertise ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {editExpertise ? (
              <div>
                <div className="space-y-2 mb-4">
                  {EXPERTISE_OPTIONS.map(expt => (
                    <label key={expt} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedExpertise.includes(expt)}
                        onChange={() => handleExpertiseToggle(expt)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="ml-3 text-gray-700 cursor-pointer">{expt}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExpertiseSave}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save Expertise
                  </button>
                  <button
                    onClick={handleExpertiseCancel}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                {profile.consultantInfo?.expertise && profile.consultantInfo.expertise.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.consultantInfo.expertise.map(expt => (
                      <span key={expt} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {expt}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No expertise areas selected yet. Click Edit to add your areas of expertise.</p>
                )}
              </div>
            )}
          </div>

          {/* Detailed Bio Section */}
          <div className="border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Detailed Bio</h2>
              <button
                onClick={() => setEditBio(!editBio)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                {editBio ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {editBio ? (
              <div>
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  placeholder="Write your detailed bio here..."
                  rows="6"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength="1000"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleBioSave}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save Bio
                  </button>
                  <button
                    onClick={handleBioCancel}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">{bioText.length}/1000 characters</p>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {profile.consultantInfo?.bio || 'No bio added yet. Click Edit to add your bio.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantProfile;
