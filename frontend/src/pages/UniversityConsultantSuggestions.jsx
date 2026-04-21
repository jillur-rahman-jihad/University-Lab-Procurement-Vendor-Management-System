import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UniversityConsultantSuggestions = () => {
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const token = userInfo?.token || localStorage.getItem('token');

  const [assignments, setAssignments] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [updatingKey, setUpdatingKey] = useState('');

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(`${API_URL}/api/labs/optimization/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAssignments(response.data.assignments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch hired consultant assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (userInfo?.role !== 'university') {
      setError('Access denied. Universities only.');
      setLoading(false);
      return;
    }

    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleReviewSuggestion = async (assignmentId, suggestionIndex, status) => {
    const actionText = status === 'Approved' ? 'approve' : 'reject';
    const detail = window.prompt(
      status === 'Approved'
        ? 'Optional approval note:'
        : 'Optional rejection reason:',
      ''
    );

    const key = `${assignmentId}-${suggestionIndex}-${status}`;
    setUpdatingKey(key);
    setError('');
    setSuccessMessage('');

    try {
      await axios.put(
        `${API_URL}/api/labs/optimization/assignment/${assignmentId}/suggestion/${suggestionIndex}/review`,
        {
          status,
          approvalNotes: status === 'Approved' ? detail : undefined,
          rejectionReason: status === 'Rejected' ? detail : undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccessMessage(`Suggestion ${actionText}d successfully.`);
      await fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${actionText} suggestion`);
    } finally {
      setUpdatingKey('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hired Consultants & Suggestions</h1>
          <p className="text-sm text-gray-600 mt-1">
            View project-wise hired consultants and accept/reject their suggestions.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-md border border-red-300 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 rounded-md border border-green-300 bg-green-50 text-green-700">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Project</label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full max-w-xl px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Projects</option>
          {uniqueProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-600">
          Loading assignments...
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-600">
          No hired consultant assignments found for the selected project.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAssignments.map((assignment) => (
            <div key={assignment._id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {assignment.projectId?.labName || assignment.projectName || 'Unnamed Project'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Consultant: <span className="font-medium">{assignment.consultantId?.name || 'N/A'}</span>
                    {' '}({assignment.consultantId?.email || 'No email'})
                  </p>
                  <p className="text-sm text-gray-600">
                    Assignment Status: <span className="font-medium">{assignment.assignmentStatus}</span>
                  </p>
                </div>

                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 w-fit">
                  Suggestions: {assignment.configurationSuggestions?.length || 0}
                </span>
              </div>

              {assignment.configurationSuggestions?.length > 0 ? (
                <div className="space-y-4">
                  {assignment.configurationSuggestions.map((suggestion, suggestionIndex) => {
                    const isPending = suggestion.status === 'Pending';
                    const approveKey = `${assignment._id}-${suggestionIndex}-Approved`;
                    const rejectKey = `${assignment._id}-${suggestionIndex}-Rejected`;

                    return (
                      <div key={suggestion._id || suggestionIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{suggestion.title}</h3>
                            <p className="text-sm text-gray-700 mt-1">{suggestion.description}</p>
                          </div>

                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full w-fit ${
                            suggestion.status === 'Approved'
                              ? 'bg-green-100 text-green-700'
                              : suggestion.status === 'Rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {suggestion.status}
                          </span>
                        </div>

                        <div className="grid gap-2 md:grid-cols-3 text-sm text-gray-600 mb-3">
                          <p><span className="font-medium">Category:</span> {suggestion.category}</p>
                          <p><span className="font-medium">Priority:</span> {suggestion.priority}</p>
                          <p><span className="font-medium">Budget Impact:</span> {suggestion.estimatedBudgetImpact ?? 0}</p>
                        </div>

                        {suggestion.rejectionReason && (
                          <p className="text-sm text-red-600 mb-3">
                            <span className="font-medium">Rejection Reason:</span> {suggestion.rejectionReason}
                          </p>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleReviewSuggestion(assignment._id, suggestionIndex, 'Approved')}
                            disabled={!isPending || updatingKey === approveKey || updatingKey === rejectKey}
                            className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
                              !isPending
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {updatingKey === approveKey ? 'Approving...' : 'Accept'}
                          </button>

                          <button
                            onClick={() => handleReviewSuggestion(assignment._id, suggestionIndex, 'Rejected')}
                            disabled={!isPending || updatingKey === approveKey || updatingKey === rejectKey}
                            className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
                              !isPending
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                          >
                            {updatingKey === rejectKey ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No suggestions submitted by this consultant yet.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UniversityConsultantSuggestions;
