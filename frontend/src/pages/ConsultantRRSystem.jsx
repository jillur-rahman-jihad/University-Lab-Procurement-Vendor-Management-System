import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ConsultantRRSystem = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [leaderboard, setLeaderboard] = useState([]);
  const [consultantStats, setConsultantStats] = useState(null);
  const [selectedConsultantId, setSelectedConsultantId] = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [consultantsByRank, setConsultantsByRank] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  let userInfo = null;
  try {
    userInfo = JSON.parse(localStorage.getItem('userInfo'));
  } catch (e) {
    userInfo = null;
  }

  const token = userInfo?.token || localStorage.getItem('token');
  const userRole = userInfo?.role || localStorage.getItem('userRole');

  // Check access on component mount
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const allowedRoles = ['consultant', 'university'];
    if (!allowedRoles.includes(userRole)) {
      setAccessDenied(true);
    }
  }, [token, userRole, navigate]);

  // Fetch leaderboard
  const fetchLeaderboard = async (limit = 10, offset = 0) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/leaderboard?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaderboard(response.data.leaderboard);
      setError('');
    } catch (err) {
      setError('Failed to fetch leaderboard: ' + err.message);
    }
    setLoading(false);
  };

  // Fetch consultant ranking
  const fetchConsultantRanking = async (consultantId) => {
    if (!consultantId) {
      setError('Please select a consultant');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/ranking/${consultantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsultantStats(response.data.consultant);
      setError('');
    } catch (err) {
      setError('Failed to fetch consultant ranking: ' + err.message);
    }
    setLoading(false);
  };

  // Fetch consultants by rank
  const fetchConsultantsByRank = async (rank) => {
    if (!rank) {
      setError('Please select a rank');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/rank/${rank}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsultantsByRank(response.data.consultants);
      setError('');
    } catch (err) {
      setError('Failed to fetch consultants by rank: ' + err.message);
    }
    setLoading(false);
  };

  // Record lab completion
  const handleRecordLabCompletion = async () => {
    if (!selectedConsultantId) {
      setError('Please select a consultant');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/record-lab-completion`, {
        consultantId: selectedConsultantId,
        labProjectId: 'lab-' + new Date().getTime()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Lab completion recorded: +' + response.data.consultant.pointsEarned + ' points');
      fetchConsultantRanking(selectedConsultantId);
      setError('');
    } catch (err) {
      setError('Failed to record lab completion: ' + err.message);
    }
    setLoading(false);
  };

  // Record budget optimization
  const handleRecordBudgetOptimization = async () => {
    if (!selectedConsultantId) {
      setError('Please select a consultant');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/record-budget-optimization`, {
        consultantId: selectedConsultantId,
        amountSaved: 5000,
        description: 'Cost optimization in lab procurement'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Budget optimization recorded: +' + response.data.pointsEarned + ' points');
      fetchConsultantRanking(selectedConsultantId);
      setError('');
    } catch (err) {
      setError('Failed to record budget optimization: ' + err.message);
    }
    setLoading(false);
  };

  // Record timely deployment
  const handleRecordTimelyDeployment = async () => {
    if (!selectedConsultantId) {
      setError('Please select a consultant');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/record-timely-deployment`, {
        consultantId: selectedConsultantId,
        projectId: 'project-' + new Date().getTime()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Timely deployment recorded: +' + response.data.pointsEarned + ' points');
      fetchConsultantRanking(selectedConsultantId);
      setError('');
    } catch (err) {
      setError('Failed to record timely deployment: ' + err.message);
    }
    setLoading(false);
  };

  // Add rating
  const handleAddRating = async () => {
    if (!selectedConsultantId) {
      setError('Please select a consultant');
      return;
    }
    const rating = prompt('Enter rating (1-5):');
    if (!rating || rating < 1 || rating > 5) {
      setError('Invalid rating');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/update-rating`, {
        consultantId: selectedConsultantId,
        rating: parseInt(rating),
        review: 'Great work on the project',
        universityId: 'university-' + new Date().getTime()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pointsEarned = response.data.consultant.pointsEarned;
      setSuccessMessage(`Rating added${pointsEarned > 0 ? ': +' + pointsEarned + ' points' : ''}`);
      fetchConsultantRanking(selectedConsultantId);
      setError('');
    } catch (err) {
      setError('Failed to add rating: ' + err.message);
    }
    setLoading(false);
  };

  // Get performance stats
  const handleGetPerformanceStats = async () => {
    if (!selectedConsultantId) {
      setError('Please select a consultant');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/${selectedConsultantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsultantStats(response.data.performanceMetrics);
      setError('');
    } catch (err) {
      setError('Failed to fetch performance stats: ' + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const rankBadgeColor = (rank) => {
    switch (rank) {
      case 'Professional':
      case 'Professional Consultant':
        return 'bg-yellow-500';
      case 'Certified':
      case 'Certified Consultant':
        return 'bg-blue-500';
      case 'General':
      case 'General Consultant':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mt-16 text-center">
            <div className="inline-block bg-red-100 border-2 border-red-400 rounded-lg p-8">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
              <p className="text-gray-700 mb-6">This system can only be accessed by Consultants and University users.</p>
              <p className="text-gray-600 mb-6">Your current role: <span className="font-semibold text-gray-900">{userRole}</span></p>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Consultant Rating & Ranking System</h1>
          <p className="text-gray-600">Manage consultant performance points and rankings</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b">
          <div className="flex space-x-4">
            {['leaderboard', 'consultant-ranking', 'filter-by-rank', 'actions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-4 border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading && <div className="text-center py-8 text-gray-600">Loading...</div>}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && !loading && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Rank</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Level</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Points</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Reviews</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Labs Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leaderboard.map((consultant) => (
                  <tr key={consultant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-bold text-gray-900">{consultant.rank}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{consultant.name}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${rankBadgeColor(consultant.experienceLevel)}`}>
                        {consultant.experienceLevel}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-blue-600">{consultant.points}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{consultant.rating || 'N/A'}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{consultant.reviewsCount || 0}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{consultant.completedLabDeployments || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Consultant Ranking Tab */}
        {activeTab === 'consultant-ranking' && !loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Consultant</label>
              <input
                type="text"
                value={selectedConsultantId}
                onChange={(e) => setSelectedConsultantId(e.target.value)}
                placeholder="Enter Consultant ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => fetchConsultantRanking(selectedConsultantId)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Fetch Ranking
              </button>
            </div>

            {consultantStats && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-lg font-semibold text-gray-900">{consultantStats.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Current Rank</p>
                  <p className={`text-lg font-semibold text-white px-3 py-1 rounded w-fit ${rankBadgeColor(consultantStats.currentRank)}`}>
                    {consultantStats.currentRank}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Total Points</p>
                  <p className="text-2xl font-bold text-blue-600">{consultantStats.totalPoints}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Points to Next Rank</p>
                  <p className="text-lg font-semibold text-gray-900">{consultantStats.pointsToNextRank}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-lg font-semibold text-yellow-500">{'⭐ ' + consultantStats.rating}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Reviews Count</p>
                  <p className="text-lg font-semibold text-gray-900">{consultantStats.reviewsCount}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Labs Completed</p>
                  <p className="text-lg font-semibold text-gray-900">{consultantStats.completedLabDeployments}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-lg font-semibold text-gray-900">{consultantStats.averageResponseTime}h</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter by Rank Tab */}
        {activeTab === 'filter-by-rank' && !loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Rank</label>
              <select
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a rank...</option>
                <option value="General Consultant">General Consultant</option>
                <option value="Certified Consultant">Certified Consultant</option>
                <option value="Professional Consultant">Professional Consultant</option>
              </select>
              <button
                onClick={() => fetchConsultantsByRank(rankFilter)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Filter Consultants
              </button>
            </div>

            {consultantsByRank.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Points</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Rating</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Labs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {consultantsByRank.map((consultant) => (
                      <tr key={consultant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">{consultant.name}</td>
                        <td className="px-6 py-3 text-sm font-semibold text-blue-600">{consultant.points}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">{consultant.rating || 'N/A'}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">{consultant.completedLabDeployments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && !loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Consultant</label>
              <input
                type="text"
                value={selectedConsultantId}
                onChange={(e) => setSelectedConsultantId(e.target.value)}
                placeholder="Enter Consultant ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleRecordLabCompletion}
                className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Record Lab Completion (+10 pts)
              </button>
              <button
                onClick={handleAddRating}
                className="px-4 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium"
              >
                Add Rating/Review
              </button>
              <button
                onClick={handleRecordBudgetOptimization}
                className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Record Budget Optimization (+8 pts)
              </button>
              <button
                onClick={handleRecordTimelyDeployment}
                className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
              >
                Record Timely Deployment (+7 pts)
              </button>
              <button
                onClick={handleGetPerformanceStats}
                className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
              >
                View Performance Stats
              </button>
            </div>

            {consultantStats && (
              <div className="mt-8 bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Rank</p>
                    <p className="text-lg font-semibold text-gray-900">{consultantStats.currentRank}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Points</p>
                    <p className="text-lg font-semibold text-blue-600">{consultantStats.totalPoints}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">% to Next Rank</p>
                    <p className="text-lg font-semibold text-gray-900">{consultantStats.percentToNextRank}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className="text-lg font-semibold text-yellow-500">⭐ {consultantStats.averageRating}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantRRSystem;
