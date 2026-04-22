import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyHireRequests = () => {
  const navigate = useNavigate();
  const [hireRequests, setHireRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, accepted, rejected

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  const token = localStorage.getItem('token');
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Fetch hire requests on component mount
  useEffect(() => {
    if (userInfo?.role === 'university') {
      fetchHireRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.role]);

  // Filter requests when status filter changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredRequests(hireRequests);
    } else {
      setFilteredRequests(hireRequests.filter(r => r.status === statusFilter));
    }
  }, [statusFilter, hireRequests]);

  const fetchHireRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/api/hire/university/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHireRequests(response.data.requests || []);
    } catch (err) {
      console.error('Error fetching hire requests:', err);
      setError('Failed to load hire requests');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this hire request?')) {
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/hire/${requestId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHireRequests(prev => 
        prev.map(r => r._id === requestId ? { ...r, status: 'cancelled' } : r)
      );
    } catch (err) {
      console.error('Error cancelling request:', err);
      setError(err.response?.data?.message || 'Failed to cancel request');
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

  const countByStatus = {
    pending: hireRequests.filter(r => r.status === 'pending').length,
    accepted: hireRequests.filter(r => r.status === 'accepted').length,
    rejected: hireRequests.filter(r => r.status === 'rejected').length,
    cancelled: hireRequests.filter(r => r.status === 'cancelled').length
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">My Hire Requests</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/hire-consultant')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
          >
            + New Hire Request
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
      <div className="max-w-6xl mx-auto p-6 mt-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Status Filters */}
        <div className="mb-6 flex gap-3 flex-wrap">
          {['all', 'pending', 'accepted', 'rejected', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-500'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && ` (${countByStatus[status] || 0})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 font-semibold">Loading...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No hire requests found</p>
            <p className="text-gray-500 text-sm mt-2">
              {statusFilter === 'all' 
                ? 'Start by creating a new hire request'
                : `No ${statusFilter} hire requests`}
            </p>
            <button
              onClick={() => navigate('/hire-consultant')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Create Hire Request
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <HireRequestCard
                key={request._id}
                request={request}
                onCancel={handleCancelRequest}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Hire Request Card Component
const HireRequestCard = ({ request, onCancel }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-orange-50', border: 'border-orange-500', badge: 'bg-orange-100 text-orange-800' };
      case 'accepted':
        return { bg: 'bg-green-50', border: 'border-green-500', badge: 'bg-green-100 text-green-800' };
      case 'rejected':
        return { bg: 'bg-red-50', border: 'border-red-500', badge: 'bg-red-100 text-red-800' };
      case 'cancelled':
        return { bg: 'bg-gray-50', border: 'border-gray-500', badge: 'bg-gray-100 text-gray-800' };
      default:
        return { bg: 'bg-blue-50', border: 'border-blue-500', badge: 'bg-blue-100 text-blue-800' };
    }
  };

  const colors = getStatusColor(request.status);

  return (
    <div className={`${colors.bg} rounded-lg shadow-md p-6 border-l-4 ${colors.border}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{request.projectName}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Consultant: <span className="font-semibold">{request.consultantId?.name || 'Unknown'}</span>
          </p>
          <p className="text-sm text-gray-600">
            Email: {request.consultantId?.email || 'N/A'} | 
            Expertise: {request.consultantId?.consultantInfo?.expertise?.join(", ") || 'N/A'}
          </p>
        </div>
        <span className={`px-3 py-1 ${colors.badge} rounded-full text-xs font-semibold`}>
          {request.status.toUpperCase()}
        </span>
      </div>

      {request.projectDescription && (
        <div className="mb-4 p-3 bg-white rounded border border-gray-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Description:</span> {request.projectDescription}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
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
        <div>
          <p className="text-xs text-gray-600">Duration</p>
          <p className="text-sm font-semibold text-gray-900">
            {Math.ceil((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24))} days
          </p>
        </div>
      </div>

      {request.respondedAt && (
        <div className="mb-4 p-2 bg-white rounded border-l-2 border-blue-500">
          <p className="text-xs text-gray-600">Response</p>
          <p className="text-sm text-gray-900">
            {request.responseMessage || '(No message provided)'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(request.respondedAt).toLocaleString()}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        {request.status === 'pending' && (
          <button
            onClick={() => onCancel(request._id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
          >
            Cancel Request
          </button>
        )}
        {request.status === 'accepted' && (
          <>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Open Chat
            </button>
            <button
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
            >
              View Details
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MyHireRequests;
