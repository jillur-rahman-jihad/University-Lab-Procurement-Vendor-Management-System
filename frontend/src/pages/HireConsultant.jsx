import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HireConsultant = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    consultantId: '',
    projectName: '',
    projectDescription: '',
    startDate: '',
    endDate: ''
  });

  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Fetch available consultants on component mount
  useEffect(() => {
    fetchAvailableConsultants();
  }, []);

  const fetchAvailableConsultants = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/university/search-consultants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsultants(response.data.consultants || []);
    } catch (err) {
      console.error('Error fetching consultants:', err);
      setError('Failed to load available consultants');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null); // Clear error when user starts typing
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.consultantId || !formData.projectName || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/hire/create`,
        {
          consultantId: formData.consultantId,
          projectName: formData.projectName,
          projectDescription: formData.projectDescription,
          startDate: formData.startDate,
          endDate: formData.endDate
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage(`Hire request sent successfully to ${response.data.hireRequest.consultantId.name}!`);
      setFormData({
        consultantId: '',
        projectName: '',
        projectDescription: '',
        startDate: '',
        endDate: ''
      });

      // Redirect to hire requests after 2 seconds
      setTimeout(() => {
        navigate('/my-hire-requests');
      }, 2000);
    } catch (err) {
      console.error('Error creating hire request:', err);
      setError(err.response?.data?.message || 'Failed to create hire request');
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo || userInfo.role !== 'university') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 font-semibold">Access Denied. Universities only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">Hire a Consultant</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition font-medium"
          >
            Back
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6 mt-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create a Hire Request</h2>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-600 text-green-700">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Select Consultant */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Consultant <span className="text-red-600">*</span>
              </label>
              <select
                name="consultantId"
                value={formData.consultantId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Choose a consultant --</option>
                {consultants.map((consultant) => (
                  <option key={consultant._id} value={consultant._id}>
                    {consultant.name} - {consultant.consultantInfo?.expertise?.join(", ") || "No expertise"}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {consultants.length} available consultants
              </p>
            </div>

            {/* Project Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                placeholder="e.g., Network Infrastructure Setup"
                maxLength="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Project Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Description
              </label>
              <textarea
                name="projectDescription"
                value={formData.projectDescription}
                onChange={handleInputChange}
                placeholder="Describe the project in detail..."
                rows="4"
                maxLength="500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.projectDescription.length}/500 characters
              </p>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Sending...' : 'Send Hire Request'}
              </button>
              <button
                type="button"
                onClick={() => setFormData({
                  consultantId: '',
                  projectName: '',
                  projectDescription: '',
                  startDate: '',
                  endDate: ''
                })}
                className="flex-1 px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
              >
                Clear
              </button>
            </div>
          </form>

          {/* Back to Dashboard */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/search-consultants')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Consultant Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HireConsultant;
