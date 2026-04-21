import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ConsultantManagementSystem = () => {
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const token = userInfo?.token || localStorage.getItem('token');

  const [activeTab, setActiveTab] = useState('search-hire');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search + hire states
  const [selectedExpertise, setSelectedExpertise] = useState('');
  const [consultants, setConsultants] = useState([]);
  const [searched, setSearched] = useState(false);
  const [hireForm, setHireForm] = useState({
    consultantId: '',
    projectName: '',
    projectDescription: '',
    startDate: '',
    endDate: ''
  });

  // Hire requests states
  const [hireRequests, setHireRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  // Suggestions states
  const [assignments, setAssignments] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [updatingSuggestionKey, setUpdatingSuggestionKey] = useState('');

  // Ranking states
  const [leaderboard, setLeaderboard] = useState([]);
  const [rankFilter, setRankFilter] = useState('');
  const [rankFilteredConsultants, setRankFilteredConsultants] = useState([]);

  const EXPERTISE_OPTIONS = ['Networking', 'Graphics', 'Research', 'AI Infrastructure'];

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (userInfo?.role !== 'university') {
      setError('Access denied. Universities only.');
      return;
    }

    fetchHireRequests();
    fetchAssignments();
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConsultants = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setSearched(true);

    try {
      const url = selectedExpertise
        ? `${API_URL}/api/university/search-consultants?expertise=${encodeURIComponent(selectedExpertise)}`
        : `${API_URL}/api/university/search-consultants`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConsultants(response.data.consultants || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch consultants');
    } finally {
      setLoading(false);
    }
  };

  const fetchHireRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/hire/university/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHireRequests(response.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch hire requests');
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/labs/optimization/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(response.data.assignments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch project assignments');
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/consultant-ranking/leaderboard?limit=50&offset=0`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaderboard(response.data.leaderboard || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch leaderboard');
    }
  };

  const handleCreateHireRequest = async (e) => {
    e.preventDefault();

    if (!hireForm.consultantId || !hireForm.projectName || !hireForm.startDate || !hireForm.endDate) {
      setError('Please fill all required hire request fields.');
      return;
    }

    if (new Date(hireForm.endDate) <= new Date(hireForm.startDate)) {
      setError('End date must be after start date.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(
        `${API_URL}/api/hire/create`,
        hireForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Hire request created successfully.');
      setHireForm({ consultantId: '', projectName: '', projectDescription: '', startDate: '', endDate: '' });
      fetchHireRequests();
      setActiveTab('hire-requests');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create hire request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelHireRequest = async (requestId) => {
    if (!window.confirm('Cancel this hire request?')) return;

    try {
      await axios.post(
        `${API_URL}/api/hire/${requestId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Hire request cancelled successfully.');
      fetchHireRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel hire request');
    }
  };

  const filteredHireRequests = useMemo(() => {
    if (statusFilter === 'all') return hireRequests;
    return hireRequests.filter((r) => r.status === statusFilter);
  }, [hireRequests, statusFilter]);

  const uniqueProjects = useMemo(() => {
    const map = new Map();
    assignments.forEach((assignment) => {
      const project = assignment.projectId;
      if (project?._id && !map.has(project._id)) {
        map.set(project._id, {
          id: project._id,
          name: project.labName || assignment.projectName || 'Unnamed Project'
        });
      }
    });
    return Array.from(map.values());
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    if (selectedProjectId === 'all') return assignments;
    return assignments.filter((a) => a.projectId?._id === selectedProjectId);
  }, [assignments, selectedProjectId]);

  const handleSuggestionReview = async (assignmentId, suggestionIndex, status) => {
    const note = window.prompt(
      status === 'Approved' ? 'Optional approval note:' : 'Optional rejection reason:',
      ''
    );

    const key = `${assignmentId}-${suggestionIndex}-${status}`;
    setUpdatingSuggestionKey(key);
    setError('');
    setSuccess('');

    try {
      await axios.put(
        `${API_URL}/api/labs/optimization/assignment/${assignmentId}/suggestion/${suggestionIndex}/review`,
        {
          status,
          approvalNotes: status === 'Approved' ? note : undefined,
          rejectionReason: status === 'Rejected' ? note : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Suggestion ${status === 'Approved' ? 'accepted' : 'rejected'} successfully.`);
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update suggestion status');
    } finally {
      setUpdatingSuggestionKey('');
    }
  };

  const handleFilterByRank = async () => {
    if (!rankFilter) {
      setRankFilteredConsultants([]);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/consultant-ranking/rank/${encodeURIComponent(rankFilter)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRankFilteredConsultants(response.data.consultants || []);
    } catch (err) {
      setRankFilteredConsultants([]);
      setError(err.response?.data?.message || 'Failed to filter consultants by rank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consultant Management System</h1>
          <p className="text-sm text-gray-600 mt-1">
            Central system for consultant search, hiring, request tracking, suggestion review, and ranking.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800"
        >
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded border border-green-300 bg-green-50 text-green-700">{success}</div>
      )}

      <div className="mb-6 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'search-hire', label: 'Search & Hire' },
            { key: 'hire-requests', label: 'My Hire Requests' },
            { key: 'suggestions', label: 'Project Suggestions' },
            { key: 'ranking', label: 'Ranking' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-md border ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'search-hire' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Consultants</h2>
            <div className="space-y-3">
              <select
                value={selectedExpertise}
                onChange={(e) => setSelectedExpertise(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Expertise Areas</option>
                {EXPERTISE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              <button
                onClick={fetchConsultants}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searched && (
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
                {consultants.length === 0 ? (
                  <p className="text-sm text-gray-500">No consultants found.</p>
                ) : (
                  consultants.map((consultant) => (
                    <div key={consultant._id} className="border border-gray-200 rounded-md p-3">
                      <p className="font-semibold text-gray-900">{consultant.name}</p>
                      <p className="text-sm text-gray-600">{consultant.email}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Expertise: {consultant.consultantInfo?.expertise?.join(', ') || 'N/A'}
                      </p>
                      <button
                        onClick={() => setHireForm((prev) => ({ ...prev, consultantId: consultant._id }))}
                        className="mt-2 px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                      >
                        Select for Hire
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Hire Request</h2>
            <form onSubmit={handleCreateHireRequest} className="space-y-3">
              <input
                type="text"
                placeholder="Consultant ID *"
                value={hireForm.consultantId}
                onChange={(e) => setHireForm((prev) => ({ ...prev, consultantId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Project Name *"
                value={hireForm.projectName}
                onChange={(e) => setHireForm((prev) => ({ ...prev, projectName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <textarea
                rows="3"
                placeholder="Project Description"
                value={hireForm.projectDescription}
                onChange={(e) => setHireForm((prev) => ({ ...prev, projectDescription: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={hireForm.startDate}
                  onChange={(e) => setHireForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="date"
                  value={hireForm.endDate}
                  onChange={(e) => setHireForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Submitting...' : 'Submit Hire Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'hire-requests' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex flex-wrap gap-2 mb-4">
            {['all', 'pending', 'accepted', 'rejected', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredHireRequests.length === 0 ? (
              <p className="text-gray-500">No hire requests found.</p>
            ) : (
              filteredHireRequests.map((request) => (
                <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{request.projectName}</p>
                      <p className="text-sm text-gray-600">
                        Consultant: {request.consultantId?.name || 'Unknown'} ({request.consultantId?.email || 'N/A'})
                      </p>
                      <p className="text-sm text-gray-600">Status: {request.status}</p>
                    </div>

                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleCancelHireRequest(request._id)}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full max-w-xl px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Projects</option>
              {uniqueProjects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {filteredAssignments.length === 0 ? (
              <p className="text-gray-500">No assignments found.</p>
            ) : (
              filteredAssignments.map((assignment) => (
                <div key={assignment._id} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-900">
                    {assignment.projectId?.labName || assignment.projectName || 'Unnamed Project'}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Consultant: {assignment.consultantId?.name || 'N/A'}
                  </p>

                  {assignment.configurationSuggestions?.length > 0 ? (
                    <div className="space-y-3">
                      {assignment.configurationSuggestions.map((suggestion, index) => {
                        const approveKey = `${assignment._id}-${index}-Approved`;
                        const rejectKey = `${assignment._id}-${index}-Rejected`;
                        const isPending = suggestion.status === 'Pending';

                        return (
                          <div key={suggestion._id || index} className="border border-gray-100 rounded-md p-3 bg-gray-50">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-gray-900">{suggestion.title}</p>
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white border border-gray-200">
                                {suggestion.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{suggestion.description}</p>

                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleSuggestionReview(assignment._id, index, 'Approved')}
                                disabled={!isPending || updatingSuggestionKey === approveKey || updatingSuggestionKey === rejectKey}
                                className={`px-3 py-1.5 text-sm rounded-md text-white ${
                                  isPending ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {updatingSuggestionKey === approveKey ? 'Accepting...' : 'Accept'}
                              </button>
                              <button
                                onClick={() => handleSuggestionReview(assignment._id, index, 'Rejected')}
                                disabled={!isPending || updatingSuggestionKey === approveKey || updatingSuggestionKey === rejectKey}
                                className={`px-3 py-1.5 text-sm rounded-md text-white ${
                                  isPending ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {updatingSuggestionKey === rejectKey ? 'Rejecting...' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No suggestions yet.</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'ranking' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2">
            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Filter by Rank (optional)</option>
              <option value="General Consultant">General Consultant</option>
              <option value="Certified Consultant">Certified Consultant</option>
              <option value="Professional Consultant">Professional Consultant</option>
            </select>

            <button
              onClick={handleFilterByRank}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-700 px-4 py-3">#</th>
                  <th className="text-left text-xs font-semibold text-gray-700 px-4 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-700 px-4 py-3">Rank</th>
                  <th className="text-left text-xs font-semibold text-gray-700 px-4 py-3">Points</th>
                  <th className="text-left text-xs font-semibold text-gray-700 px-4 py-3">Rating</th>
                </tr>
              </thead>
              <tbody>
                {(rankFilteredConsultants.length > 0
                  ? rankFilteredConsultants.map((c, i) => ({
                      rank: i + 1,
                      name: c.name,
                      experienceLevel: c.rank,
                      points: c.points,
                      rating: c.rating
                    }))
                  : leaderboard
                ).map((consultant) => (
                  <tr key={`${consultant.rank}-${consultant.name}`} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm text-gray-900">{consultant.rank}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{consultant.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{consultant.experienceLevel}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-700">{consultant.points}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{consultant.rating || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantManagementSystem;
