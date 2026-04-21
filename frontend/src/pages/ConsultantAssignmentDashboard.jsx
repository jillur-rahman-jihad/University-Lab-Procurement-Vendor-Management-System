import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ConsultantAssignmentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'active'
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedWorkspaceRequestId, setSelectedWorkspaceRequestId] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [suggestionForm, setSuggestionForm] = useState({
    title: '',
    description: '',
    category: 'Performance',
    estimatedBudgetImpact: 0,
    performanceImprovement: '',
    priority: 'Medium'
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token || localStorage.getItem('token');

  // Fetch data on component mount and tab change
  useEffect(() => {
    if (userInfo?.role === 'consultant') {
      fetchData();
    }
  }, [activeTab, userInfo?.role]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'pending') {
        const response = await axios.get(`${API_URL}/api/hire/consultant/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPendingRequests(response.data.requests || []);
      } else if (activeTab === 'active') {
        const response = await axios.get(`${API_URL}/api/hire/consultant/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setActiveAssignments(response.data.assignments || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspace = async (requestId) => {
    if (selectedWorkspaceRequestId === requestId) {
      setSelectedWorkspaceRequestId(null);
      setWorkspaceData(null);
      return;
    }

    setWorkspaceLoading(true);
    setSelectedWorkspaceRequestId(requestId);
    setWorkspaceData(null);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/api/hire/consultant/assignment/${requestId}/work-details`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setWorkspaceData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project workspace');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const submitSuggestion = async (requestId) => {
    if (!suggestionForm.title || !suggestionForm.description || !suggestionForm.category) {
      setError('Title, description and category are required for suggestions');
      return;
    }

    try {
      setError(null);
      await axios.post(
        `${API_URL}/api/hire/consultant/assignment/${requestId}/suggestions`,
        suggestionForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage('Suggestion submitted successfully');
      setSuggestionForm({
        title: '',
        description: '',
        category: 'Performance',
        estimatedBudgetImpact: 0,
        performanceImprovement: '',
        priority: 'Medium'
      });
      loadWorkspace(requestId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit suggestion');
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
      await axios.post(
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
        ) : activeTab === 'active' ? (
          <ActiveAssignmentsTab
            assignments={activeAssignments}
            selectedWorkspaceRequestId={selectedWorkspaceRequestId}
            workspaceLoading={workspaceLoading}
            workspaceData={workspaceData}
            suggestionForm={suggestionForm}
            setSuggestionForm={setSuggestionForm}
            onSubmitSuggestion={submitSuggestion}
            onOpenWorkspace={loadWorkspace}
          />
        ) : null}
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
const ActiveAssignmentsTab = ({
  assignments,
  selectedWorkspaceRequestId,
  workspaceLoading,
  workspaceData,
  onOpenWorkspace,
  suggestionForm,
  setSuggestionForm,
  onSubmitSuggestion
}) => {
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
              onClick={() => onOpenWorkspace(assignment._id)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              {selectedWorkspaceRequestId === assignment._id ? 'Hide Project Work' : 'Work On Project'}
            </button>
            <button
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
            >
              View Details
            </button>
          </div>

          {selectedWorkspaceRequestId === assignment._id && (
            <div className="mt-6 border-t pt-4">
              {workspaceLoading ? (
                <p className="text-sm text-gray-600">Loading project workspace...</p>
              ) : workspaceData ? (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Quotations</h4>
                    {workspaceData.quotations?.length > 0 ? (
                      <div className="space-y-4">
                        {workspaceData.quotations.map((quotation) => (
                          <div key={quotation._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {quotation.vendorId?.vendorInfo?.shopName || quotation.vendorId?.name || 'Vendor'}
                                </p>
                                <p className="text-sm text-gray-600">Email: {quotation.vendorId?.email || 'N/A'}</p>
                                <p className="text-sm text-gray-600">Phone: {quotation.vendorId?.phone || 'N/A'}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                                quotation.status === 'accepted'
                                  ? 'bg-green-100 text-green-700'
                                  : quotation.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {quotation.status?.toUpperCase()}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 mb-3">
                              <p><span className="font-semibold">Total Price:</span> {quotation.totalPrice ?? 0}</p>
                              <p><span className="font-semibold">Bulk Discount:</span> {quotation.bulkDiscount ?? 0}%</p>
                              <p><span className="font-semibold">Installation Included:</span> {quotation.installationIncluded ? 'Yes' : 'No'}</p>
                              <p><span className="font-semibold">Maintenance Included:</span> {quotation.maintenanceIncluded ? 'Yes' : 'No'}</p>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border border-gray-200 rounded bg-white">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-2 py-2 text-left">Category</th>
                                    <th className="px-2 py-2 text-left">Component</th>
                                    <th className="px-2 py-2 text-left">Unit Price</th>
                                    <th className="px-2 py-2 text-left">Qty</th>
                                    <th className="px-2 py-2 text-left">Warranty</th>
                                    <th className="px-2 py-2 text-left">Delivery</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(quotation.components || []).map((component, index) => (
                                    <tr key={`${quotation._id}-component-${index}`} className="border-t">
                                      <td className="px-2 py-2">{component.category || 'N/A'}</td>
                                      <td className="px-2 py-2">{component.name || 'N/A'}</td>
                                      <td className="px-2 py-2">{component.unitPrice ?? 0}</td>
                                      <td className="px-2 py-2">{component.quantity ?? 0}</td>
                                      <td className="px-2 py-2">{component.warranty || 'N/A'}</td>
                                      <td className="px-2 py-2">{component.deliveryTime || 'N/A'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {quotation.revisionHistory?.length > 0 && (
                              <div className="mt-3 text-xs text-gray-600">
                                <p className="font-semibold mb-1">Revision History</p>
                                <div className="space-y-1">
                                  {quotation.revisionHistory.map((revision, idx) => (
                                    <p key={`${quotation._id}-revision-${idx}`}>
                                      {revision.updatedAt ? new Date(revision.updatedAt).toLocaleString() : 'N/A'} - {revision.changes || 'Updated'}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No quotations found for this project.</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Procurement</h4>
                    {workspaceData.procurement ? (
                      <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700">
                        <p><span className="font-semibold">Procurement ID:</span> {workspaceData.procurement._id}</p>
                        <p><span className="font-semibold">Acceptance Type:</span> {workspaceData.procurement.acceptanceType || 'N/A'}</p>
                        <p><span className="font-semibold">Final Cost:</span> {workspaceData.procurement.finalCost || 0}</p>
                        <p><span className="font-semibold">Selected Vendors:</span> {workspaceData.procurement.selectedVendorIds?.map(v => v?.vendorInfo?.shopName || v?.name).filter(Boolean).join(', ') || 'N/A'}</p>
                        <p><span className="font-semibold">Admin Approved:</span> {workspaceData.procurement.approvedByAdmin ? 'Yes' : 'Pending'}</p>

                        {workspaceData.procurement.acceptedComponents?.length > 0 && (
                          <div className="mt-3 overflow-x-auto">
                            <p className="font-semibold mb-1">Accepted Components</p>
                            <table className="w-full text-xs border border-gray-200 rounded bg-white">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-2 py-2 text-left">Category</th>
                                  <th className="px-2 py-2 text-left">Name</th>
                                  <th className="px-2 py-2 text-left">Unit Price</th>
                                  <th className="px-2 py-2 text-left">Qty</th>
                                  <th className="px-2 py-2 text-left">Warranty</th>
                                </tr>
                              </thead>
                              <tbody>
                                {workspaceData.procurement.acceptedComponents.map((component, index) => (
                                  <tr key={`accepted-component-${index}`} className="border-t">
                                    <td className="px-2 py-2">{component.category || 'N/A'}</td>
                                    <td className="px-2 py-2">{component.name || 'N/A'}</td>
                                    <td className="px-2 py-2">{component.unitPrice ?? 0}</td>
                                    <td className="px-2 py-2">{component.quantity ?? 0}</td>
                                    <td className="px-2 py-2">{component.warranty || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No procurement record found for this project yet.</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Send Suggestion</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Suggestion title"
                        value={suggestionForm.title}
                        onChange={(e) => setSuggestionForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded"
                      />
                      <select
                        value={suggestionForm.category}
                        onChange={(e) => setSuggestionForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded"
                      >
                        <option value="Performance">Performance</option>
                        <option value="Budget">Budget</option>
                        <option value="Security">Security</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Other">Other</option>
                      </select>
                      <textarea
                        rows="3"
                        placeholder="Suggestion details"
                        value={suggestionForm.description}
                        onChange={(e) => setSuggestionForm((prev) => ({ ...prev, description: e.target.value }))}
                        className="md:col-span-2 px-3 py-2 border border-gray-300 rounded"
                      />
                      <input
                        type="number"
                        placeholder="Estimated budget impact"
                        value={suggestionForm.estimatedBudgetImpact}
                        onChange={(e) => setSuggestionForm((prev) => ({ ...prev, estimatedBudgetImpact: Number(e.target.value || 0) }))}
                        className="px-3 py-2 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        placeholder="Performance improvement"
                        value={suggestionForm.performanceImprovement}
                        onChange={(e) => setSuggestionForm((prev) => ({ ...prev, performanceImprovement: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>
                    <button
                      onClick={() => onSubmitSuggestion(assignment._id)}
                      className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                    >
                      Submit Suggestion
                    </button>

                    {workspaceData.suggestions?.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h5 className="font-semibold text-gray-800">Existing Suggestions</h5>
                        {workspaceData.suggestions.map((suggestion) => (
                          <div key={suggestion._id} className="bg-gray-50 border border-gray-200 rounded p-3">
                            <p className="font-medium text-sm">{suggestion.title}</p>
                            <p className="text-sm text-gray-600">{suggestion.description}</p>
                            <p className="text-xs text-gray-500 mt-1">Status: {suggestion.status}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No workspace data found.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConsultantAssignmentDashboard;
