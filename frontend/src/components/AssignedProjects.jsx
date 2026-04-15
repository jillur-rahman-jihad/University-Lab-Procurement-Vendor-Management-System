import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssignedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [success, setSuccess] = useState(null);

  const [suggestionForm, setSuggestionForm] = useState({
    title: '',
    description: '',
    category: 'Performance',
    estimatedBudgetImpact: 0,
    performanceImprovement: '',
    priority: 'Medium'
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const stored = localStorage.getItem('userInfo');
  let token = null;
  try {
    token = stored ? JSON.parse(stored).token : null;
  } catch (e) {
    token = null;
  }

  const CATEGORIES = ["Performance", "Budget", "Security", "Maintenance", "Other"];
  const PRIORITIES = ["Low", "Medium", "High", "Critical"];

  useEffect(() => {
    fetchAssignedProjects();
  }, []);

  const fetchAssignedProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/consultants/assigned-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data.projects);
      setLoading(false);
    } catch (err) {
      setError('Failed to load assigned projects');
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (assignmentId) => {
    try {
      const response = await axios.get(`${API_URL}/api/consultants/assigned-projects/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedProject(response.data);
      await fetchSuggestions(assignmentId);
    } catch (err) {
      setError('Failed to load project details');
    }
  };

  const fetchSuggestions = async (assignmentId) => {
    try {
      const response = await axios.get(`${API_URL}/api/consultants/assigned-projects/${assignmentId}/suggestions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuggestions(response.data.suggestions);
    } catch (err) {
      console.error('Failed to load suggestions');
    }
  };

  const handleAddSuggestion = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/consultants/assigned-projects/${selectedProject._id}/suggestions`,
        suggestionForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuggestions([...suggestions, response.data.suggestion]);
      setSuggestionForm({
        title: '',
        description: '',
        category: 'Performance',
        estimatedBudgetImpact: 0,
        performanceImprovement: '',
        priority: 'Medium'
      });
      setShowSuggestionForm(false);
      setSuccess('Suggestion added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add suggestion: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteSuggestion = async (suggestionId) => {
    if (!selectedProject) return;

    if (!window.confirm('Are you sure you want to delete this suggestion?')) return;

    try {
      await axios.delete(
        `${API_URL}/api/consultants/assigned-projects/${selectedProject._id}/suggestions/${suggestionId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuggestions(suggestions.filter(s => s._id !== suggestionId));
      setSuccess('Suggestion deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete suggestion');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-gray-600';
      case 'Approved': return 'text-green-600';
      case 'Rejected': return 'text-red-600';
      case 'Implemented': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) return <div className="p-4">Loading assigned projects...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6">Assigned Lab Projects</h1>

      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="p-3 mb-4 bg-green-100 text-green-700 rounded">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {projects.length > 0 ? (
              projects.map(project => (
                <div
                  key={project._id}
                  onClick={() => fetchProjectDetails(project._id)}
                  className={`p-3 rounded-lg cursor-pointer border-2 transition ${
                    selectedProject?._id === project._id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400 bg-gray-50'
                  }`}
                >
                  <p className="font-semibold text-sm">{project.projectName}</p>
                  <p className="text-xs text-gray-600">{project.universityId?.name}</p>
                  <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                    project.assignmentStatus === 'Completed' ? 'bg-green-200' :
                    project.assignmentStatus === 'In Progress' ? 'bg-blue-200' :
                    'bg-yellow-200'
                  }`}>
                    {project.assignmentStatus}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No assigned projects</p>
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="space-y-6">
              {/* Project Information */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h2 className="text-2xl font-semibold mb-3">{selectedProject.projectName}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">University</p>
                    <p className="font-semibold">{selectedProject.universityId?.name}</p>
                    <p className="text-sm text-gray-600">{selectedProject.universityId?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold">{selectedProject.assignmentStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assigned Date</p>
                    <p className="font-semibold">{new Date(selectedProject.assignedDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Budget</p>
                    <p className="font-semibold">${selectedProject.performanceMetrics?.currentBudget || selectedProject.performanceMetrics?.initialBudget || 'N/A'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-800">{selectedProject.description}</p>
                </div>
              </div>

              {/* Configuration Suggestions Section */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Configuration Suggestions</h3>
                  <button
                    onClick={() => setShowSuggestionForm(!showSuggestionForm)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    {showSuggestionForm ? 'Cancel' : '+ Add Suggestion'}
                  </button>
                </div>

                {/* Add Suggestion Form */}
                {showSuggestionForm && (
                  <form onSubmit={handleAddSuggestion} className="bg-blue-50 p-4 rounded-lg mb-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={suggestionForm.title}
                        onChange={(e) => setSuggestionForm({ ...suggestionForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Upgrade CPU for better performance"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={suggestionForm.description}
                        onChange={(e) => setSuggestionForm({ ...suggestionForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Detailed explanation of the suggestion..."
                        rows="3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={suggestionForm.category}
                          onChange={(e) => setSuggestionForm({ ...suggestionForm, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          value={suggestionForm.priority}
                          onChange={(e) => setSuggestionForm({ ...suggestionForm, priority: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {PRIORITIES.map(pri => <option key={pri} value={pri}>{pri}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Est. Budget Impact ($)</label>
                        <input
                          type="number"
                          value={suggestionForm.estimatedBudgetImpact}
                          onChange={(e) => setSuggestionForm({ ...suggestionForm, estimatedBudgetImpact: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Performance Gain</label>
                        <input
                          type="text"
                          value={suggestionForm.performanceImprovement}
                          onChange={(e) => setSuggestionForm({ ...suggestionForm, performanceImprovement: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 30% faster"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Submit Suggestion
                    </button>
                  </form>
                )}

                {/* Suggestions List */}
                <div className="space-y-3">
                  {suggestions.length > 0 ? (
                    suggestions.map(suggestion => (
                      <div key={suggestion._id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{suggestion.title}</h4>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(suggestion.priority)}`}>
                                {suggestion.priority}
                              </span>
                              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                                {suggestion.category}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(suggestion.status)}`}>
                                {suggestion.status}
                              </span>
                            </div>
                          </div>
                          {suggestion.status === 'Pending' && (
                            <button
                              onClick={() => handleDeleteSuggestion(suggestion._id)}
                              className="text-red-600 hover:text-red-800 text-sm font-semibold"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{suggestion.description}</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          {suggestion.estimatedBudgetImpact && (
                            <p><strong>Budget Impact:</strong> ${suggestion.estimatedBudgetImpact}</p>
                          )}
                          {suggestion.performanceImprovement && (
                            <p><strong>Performance Gain:</strong> {suggestion.performanceImprovement}</p>
                          )}
                          <p><strong>Added:</strong> {new Date(suggestion.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No suggestions yet. Add one to optimize this project!</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <p>Select a project to view details and manage suggestions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignedProjects;
