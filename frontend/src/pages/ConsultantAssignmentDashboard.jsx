import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ConsultantAssignmentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'active'
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Fetch data on component mount and tab change
  useEffect(() => {
    if (userInfo?.role === 'consultant') {
      fetchData();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'pending') {
        const response = await axios.get(`${API_URL}/api/hire/consultant/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPendingRequests(response.data.requests || []);
      } else {
        const response = await axios.get(`${API_URL}/api/hire/consultant/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setActiveAssignments(response.data.assignments || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setError(null);
      const response = await axios.post(
        `${API_URL}/api/hire/${requestId}/accept`,
        { responseMessage: 'I accept this hire request' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage('Hire request accepted successfully!');
      
      // Remove from pending and refresh
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
      
      setTimeout(() => {
        setSuccessMessage(null);
        fetchData();
      }, 2000);
    } catch (err) {
      console.error('Error accepting request:', err);
      setError(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reasonMessage = prompt('Why are you rejecting this request? (optional)');
    
    try {
      setError(null);
      await axios.post(
        `${API_URL}/api/hire/${requestId}/reject`,
        { responseMessage: reasonMessage || 'Request rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage('Hire request rejected');
      
      // Remove from pending and refresh
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
      
      setTimeout(() => {
        setSuccessMessage(null);
        fetchData();
      }, 2000);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err.response?.data?.message || 'Failed to reject request');
    }
  };

  if (!userInfo || userInfo.role !== 'consultant') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 font-semibold">Access Denied. Consultants only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">My Assignments</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
        >
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6 mt-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-600 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'pending'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'active'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Assignments ({activeAssignments.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 font-semibold">Loading...</p>
          </div>
        ) : activeTab === 'pending' ? (
          <PendingRequestsTab
            requests={pendingRequests}
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
          />
        ) : (
          <ActiveAssignmentsTab assignments={activeAssignments} />
        )}
      </div>
    </div>
  );
};

// Pending Requests Tab Component
const PendingRequestsTab = ({ requests, onAccept, onReject }) => {
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-600 text-lg">No pending hire requests</p>
        <p className="text-gray-500 text-sm mt-2">Requests from universities will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{request.projectName}</h3>
              <p className="text-sm text-gray-600 mt-1">
                From: <span className="font-semibold">{request.universityId?.name || 'Unknown'}</span>
              </p>
              <p className="text-sm text-gray-600">
                Email: {request.universityId?.email || 'N/A'}
              </p>
            </div>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
              PENDING
            </span>
          </div>

          {request.projectDescription && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Description:</span> {request.projectDescription}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-600">Start Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(request.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">End Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(request.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Duration: {Math.ceil((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24))} days
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => onAccept(request._id)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Accept
            </button>
            <button
              onClick={() => onReject(request._id)}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Active Assignments Tab Component
const ActiveAssignmentsTab = ({ assignments }) => {
  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-600 text-lg">No active assignments</p>
        <p className="text-gray-500 text-sm mt-2">Accept pending requests to create active assignments</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <div key={assignment._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{assignment.projectName}</h3>
              <p className="text-sm text-gray-600 mt-1">
                University: <span className="font-semibold">{assignment.universityId?.name || 'Unknown'}</span>
              </p>
              <p className="text-sm text-gray-600">
                Contact: {assignment.universityId?.email || 'N/A'} | {assignment.universityId?.phone || 'N/A'}
              </p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
              ACCEPTED
            </span>
          </div>

          {assignment.projectDescription && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Description:</span> {assignment.projectDescription}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-600">Start Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(assignment.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">End Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(assignment.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Duration: {Math.ceil((new Date(assignment.endDate) - new Date(assignment.startDate)) / (1000 * 60 * 60 * 24))} days
          </p>

          <div className="mt-4 flex gap-3">
            <button
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Open Chat
            </button>
            <button
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
            >
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConsultantAssignmentDashboard;
