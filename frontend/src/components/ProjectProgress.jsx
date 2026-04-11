import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProjectProgress = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('milestones'); // milestones, documentation, progress

  const [documents, setDocuments] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docDescription, setDocDescription] = useState('');
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);

  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    notes: ''
  });

  const [editingMilestone, setEditingMilestone] = useState(null);
  const [progressForm, setProgressForm] = useState({
    completionPercentage: 0,
    estimatedDaysRemaining: 0
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/consultants/assigned-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data.projects);
      setLoading(false);
    } catch (err) {
      setError('Failed to load projects');
      setLoading(false);
    }
  };

  const selectProject = async (project) => {
    setSelectedProject(project);
    await Promise.all([
      fetchDocuments(project._id),
      fetchMilestones(project._id),
      fetchProgressSummary(project._id)
    ]);
  };

  const fetchDocuments = async (assignmentId) => {
    try {
      const response = await axios.get(`${API_URL}/api/consultants/assigned-projects/${assignmentId}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data.documents);
    } catch (err) {
      console.error('Failed to load documents');
    }
  };

  const fetchMilestones = async (assignmentId) => {
    try {
      const response = await axios.get(`${API_URL}/api/consultants/assigned-projects/${assignmentId}/milestones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMilestones(response.data.milestones);
    } catch (err) {
      console.error('Failed to load milestones');
    }
  };

  const fetchProgressSummary = async (assignmentId) => {
    try {
      const response = await axios.get(`${API_URL}/api/consultants/assigned-projects/${assignmentId}/progress-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgressSummary(response.data.summary);
      setProgressForm({
        completionPercentage: response.data.summary.overallProgress?.completionPercentage || 0,
        estimatedDaysRemaining: response.data.summary.overallProgress?.estimatedDaysRemaining || 0
      });
    } catch (err) {
      console.error('Failed to load progress summary');
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!selectedProject || !e.target.files[0]) return;

    setUploadingDoc(true);
    const formData = new FormData();
    formData.append('documentation', e.target.files[0]);
    formData.append('description', docDescription);

    try {
      await axios.post(
        `${API_URL}/api/consultants/assigned-projects/${selectedProject._id}/documents`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        }
      );

      setDocDescription('');
      e.target.reset();
      await fetchDocuments(selectedProject._id);
      setSuccess('Document uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!selectedProject || !window.confirm('Delete this document?')) return;

    try {
      await axios.delete(
        `${API_URL}/api/consultants/assigned-projects/${selectedProject._id}/documents/${docId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchDocuments(selectedProject._id);
      setSuccess('Document deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      await axios.post(
        `${API_URL}/api/consultants/assigned-projects/${selectedProject._id}/milestones`,
        milestoneForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMilestoneForm({ title: '', description: '', dueDate: '', notes: '' });
      setShowMilestoneForm(false);
      await fetchMilestones(selectedProject._id);
      setSuccess('Milestone added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add milestone');
    }
  };

  const handleUpdateMilestone = async (milestoneId) => {
    if (!selectedProject || !editingMilestone) return;

    try {
      await axios.patch(
        `${API_URL}/api/consultants/assigned-projects/${selectedProject._id}/milestones/${milestoneId}`,
        editingMilestone,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditingMilestone(null);
      await fetchMilestones(selectedProject._id);
      await fetchProgressSummary(selectedProject._id);
      setSuccess('Milestone updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update milestone');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!selectedProject || !window.confirm('Delete this milestone?')) return;

    try {
      await axios.delete(
        `${API_URL}/api/consultants/assigned-projects/${selectedProject._id}/milestones/${milestoneId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchMilestones(selectedProject._id);
      setSuccess('Milestone deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete milestone');
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedProject) return;

    try {
      await axios.patch(
        `${API_URL}/api/consultants/assigned-projects/${selectedProject._id}/progress`,
        progressForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchProgressSummary(selectedProject._id);
      setSuccess('Progress updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update progress');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-gray-100 text-gray-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-4">Loading projects...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6">Project Progress & Documentation</h1>

      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="p-3 mb-4 bg-green-100 text-green-700 rounded">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Projects List */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {projects.length > 0 ? (
              projects.map(project => (
                <div
                  key={project._id}
                  onClick={() => selectProject(project)}
                  className={`p-3 rounded-lg cursor-pointer border-2 transition ${
                    selectedProject?._id === project._id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400 bg-gray-50'
                  }`}
                >
                  <p className="font-semibold text-sm">{project.projectName}</p>
                  <p className="text-xs text-gray-600">{project.universityId?.name}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No projects</p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedProject ? (
            <div className="space-y-6">
              {/* Progress Summary */}
              {progressSummary && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-l-4 border-blue-600">
                  <h3 className="text-xl font-semibold mb-4">Project Progress Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Overall Completion</p>
                      <p className="text-3xl font-bold text-blue-600">{progressSummary.overallProgress?.completionPercentage || 0}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Milestone Progress</p>
                      <p className="text-3xl font-bold text-green-600">{progressSummary.milestoneCompletionPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Milestones</p>
                      <p className="text-2xl font-bold">{progressSummary.completedMilestones}/{progressSummary.totalMilestones}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Documentation Files</p>
                      <p className="text-2xl font-bold">{progressSummary.documentationCount}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Navigation */}
              <div className="flex gap-4 border-b">
                {['milestones', 'documentation', 'progress'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-4 border-b-2 font-semibold transition capitalize ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Milestones Tab */}
              {activeTab === 'milestones' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {showMilestoneForm ? 'Cancel' : '+ Add Milestone'}
                  </button>

                  {showMilestoneForm && (
                    <form onSubmit={handleAddMilestone} className="bg-blue-50 p-4 rounded-lg space-y-3">
                      <input
                        type="text"
                        placeholder="Milestone Title"
                        value={milestoneForm.title}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <textarea
                        placeholder="Description"
                        value={milestoneForm.description}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="2"
                      />
                      <input
                        type="date"
                        value={milestoneForm.dueDate}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Add Milestone
                      </button>
                    </form>
                  )}

                  <div className="space-y-3">
                    {milestones.length > 0 ? (
                      milestones.map(milestone => (
                        <div key={milestone._id} className="border rounded-lg p-4 bg-gray-50">
                          {editingMilestone?._id === milestone._id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdateMilestone(milestone._id);
                              }}
                              className="space-y-3"
                            >
                              <input
                                type="text"
                                value={editingMilestone.title}
                                onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded"
                              />
                              <select
                                value={editingMilestone.status}
                                onChange={(e) => setEditingMilestone({ ...editingMilestone, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded"
                              >
                                {['Pending', 'In Progress', 'Completed', 'Delayed'].map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <div>
                                <label className="text-sm">Progress:</label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={editingMilestone.progress}
                                  onChange={(e) => setEditingMilestone({ ...editingMilestone, progress: parseInt(e.target.value) })}
                                  className="w-full"
                                />
                                <p className="text-sm">{editingMilestone.progress}%</p>
                              </div>
                              <div className="flex gap-2">
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
                                <button
                                  type="button"
                                  onClick={() => setEditingMilestone(null)}
                                  className="px-4 py-2 bg-gray-400 text-white rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">{milestone.title}</h4>
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(milestone.status)}`}>
                                  {milestone.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{milestone.description}</p>
                              <div className="mb-3">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">Progress</span>
                                  <span className="text-sm font-medium">{milestone.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${milestone.progress}%` }}></div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mb-3">Due: {new Date(milestone.dueDate).toLocaleDateString()}</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingMilestone(milestone)}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMilestone(milestone._id)}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No milestones yet</p>
                    )}
                  </div>
                </div>
              )}

              {/* Documentation Tab */}
              {activeTab === 'documentation' && (
                <div className="space-y-4">
                  <form onSubmit={handleDocumentUpload} className="bg-blue-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                        onChange={(e) => {}}
                        className="w-full"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Document Description (optional)"
                        value={docDescription}
                        onChange={(e) => setDocDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                      <button
                        type="submit"
                        disabled={uploadingDoc}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {documents.length > 0 ? (
                      documents.map(doc => (
                        <div key={doc._id} className="border rounded-lg p-4 bg-gray-50 flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold">{doc.fileName}</p>
                            <p className="text-sm text-gray-600">{doc.description}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()} • Size: {(doc.fileSize / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteDocument(doc._id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 ml-2"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No documents uploaded</p>
                    )}
                  </div>
                </div>
              )}

              {/* Progress Tab */}
              {activeTab === 'progress' && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Overall Completion Percentage
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progressForm.completionPercentage}
                          onChange={(e) => setProgressForm({ ...progressForm, completionPercentage: parseInt(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-xl font-bold text-blue-600 w-16">{progressForm.completionPercentage}%</span>
                      </div>
                    </div>

                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Days Remaining
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={progressForm.estimatedDaysRemaining}
                        onChange={(e) => setProgressForm({ ...progressForm, estimatedDaysRemaining: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>

                    <button
                      onClick={handleUpdateProgress}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Update Progress
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Select a project to view progress and documentation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectProgress;
