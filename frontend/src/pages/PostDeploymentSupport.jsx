import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PostDeploymentSupport = () => {
	const navigate = useNavigate();
	const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
	const token = userInfo?.token;

	const [hasAccess, setHasAccess] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [supportRequests, setSupportRequests] = useState([]);
	const [statistics, setStatistics] = useState(null);
	const [view, setView] = useState('list'); // 'list' or 'create'
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [filterStatus, setFilterStatus] = useState('all');
	const [filterPriority, setFilterPriority] = useState('all');
	const [labProjects, setLabProjects] = useState([]);

	const [createForm, setCreateForm] = useState({
		labProjectId: '',
		title: '',
		description: '',
		category: 'technical',
		priority: 'medium',
		affectedComponents: []
	});

	const [activityMessage, setActivityMessage] = useState('');
	const [addingActivity, setAddingActivity] = useState(false);

	const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

	// Check access and fetch data
	useEffect(() => {
		checkAccess();
		fetchLabProjects();
	}, [token]);

	useEffect(() => {
		if (hasAccess) {
			fetchSupportRequests();
			fetchStatistics();
		}
	}, [filterStatus, filterPriority, hasAccess]);

	const checkAccess = async () => {
		try {
			const response = await axios.get(
				`${API_URL}/api/subscription/check-post-deployment-support`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setHasAccess(response.data.allowed);
		} catch (err) {
			console.error('Error checking access:', err);
			setHasAccess(false);
		} finally {
			setLoading(false);
		}
	};

	const fetchLabProjects = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/labs/user-projects`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			setLabProjects(response.data.projects || []);
		} catch (err) {
			console.error('Error fetching lab projects:', err);
		}
	};

	const fetchSupportRequests = async () => {
		try {
			let url = `${API_URL}/api/post-deployment-support/my-requests`;
			const params = new URLSearchParams();
			if (filterStatus !== 'all') params.append('status', filterStatus);
			if (filterPriority !== 'all') params.append('priority', filterPriority);

			if (params.toString()) {
				url += '?' + params.toString();
			}

			const response = await axios.get(url, {
				headers: { Authorization: `Bearer ${token}` }
			});
			setSupportRequests(response.data.requests || []);
		} catch (err) {
			console.error('Error fetching support requests:', err);
			setError('Failed to fetch support requests');
		}
	};

	const fetchStatistics = async () => {
		try {
			const response = await axios.get(
				`${API_URL}/api/post-deployment-support/statistics`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setStatistics(response.data.statistics);
		} catch (err) {
			console.error('Error fetching statistics:', err);
		}
	};

	const handleCreateRequest = async (e) => {
		e.preventDefault();

		if (!createForm.labProjectId || !createForm.title || !createForm.description) {
			setError('Please fill in all required fields');
			return;
		}

		try {
			setLoading(true);
			await axios.post(
				`${API_URL}/api/post-deployment-support/create-request`,
				createForm,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setCreateForm({
				labProjectId: '',
				title: '',
				description: '',
				category: 'technical',
				priority: 'medium',
				affectedComponents: []
			});
			setView('list');
			fetchSupportRequests();
			fetchStatistics();
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to create support request');
		} finally {
			setLoading(false);
		}
	};

	const handleAddActivity = async () => {
		if (!activityMessage.trim()) return;

		try {
			setAddingActivity(true);
			await axios.post(
				`${API_URL}/api/post-deployment-support/add-activity/${selectedRequest._id}`,
				{ message: activityMessage },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setActivityMessage('');
			// Re-fetch the selected request details
			const response = await axios.get(
				`${API_URL}/api/post-deployment-support/request-details/${selectedRequest._id}`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setSelectedRequest(response.data.request);
		} catch (err) {
			setError('Failed to add activity');
		} finally {
			setAddingActivity(false);
		}
	};

	const handleStatusChange = async (newStatus) => {
		try {
			const response = await axios.patch(
				`${API_URL}/api/post-deployment-support/update-status/${selectedRequest._id}`,
				{ newStatus },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setSelectedRequest(response.data.request);
			fetchSupportRequests();
			fetchStatistics();
		} catch (err) {
			setError('Failed to update status');
		}
	};

	const getPriorityColor = (priority) => {
		switch (priority) {
			case 'critical':
				return 'bg-red-100 text-red-800';
			case 'high':
				return 'bg-orange-100 text-orange-800';
			case 'medium':
				return 'bg-yellow-100 text-yellow-800';
			case 'low':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'open':
				return 'bg-blue-100 text-blue-800';
			case 'in-progress':
				return 'bg-purple-100 text-purple-800';
			case 'resolved':
				return 'bg-green-100 text-green-800';
			case 'closed':
				return 'bg-gray-100 text-gray-800';
			case 'on-hold':
				return 'bg-amber-100 text-amber-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	if (!userInfo) {
		navigate('/login');
		return null;
	}

	if (loading) {
		return (
			<div className="max-w-6xl mx-auto py-12 px-4">
				<div className="text-center text-gray-500">Loading...</div>
			</div>
		);
	}

	if (!hasAccess) {
		return (
			<div className="max-w-4xl mx-auto py-12 px-4">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<div className="text-center">
						<div className="mb-4 text-5xl">🔒</div>
						<h1 className="text-3xl font-bold text-gray-900 mb-4">Premium Feature</h1>
						<p className="text-lg text-gray-600 mb-6">
							Post-Deployment Support is exclusively available for Premium Plan users.
						</p>
						<div className="bg-amber-50 border-l-4 border-amber-600 p-6 mb-8 text-left">
							<h2 className="font-semibold text-amber-900 mb-2">What's Included:</h2>
							<ul className="list-disc list-inside text-amber-800 space-y-2">
								<li>Create and track post-deployment support requests</li>
								<li>Priority issue categorization (Technical, Maintenance, Training, etc.)</li>
								<li>Activity tracking and comments</li>
								<li>Support ticket status management</li>
								<li>Unlimited support requests</li>
							</ul>
						</div>
						<button
							onClick={() => navigate('/subscription-plans')}
							className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors"
						>
							Upgrade to Premium Plan
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			<div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
				{/* Header */}
				<div className="px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Post-Deployment Support</h1>
						<p className="mt-1 text-sm text-gray-500">
							Manage deployment support requests and track resolutions
						</p>
					</div>
					<button
						onClick={() => navigate(-1)}
						className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
					>
						← Back
					</button>
				</div>

				{/* Error Message */}
				{error && (
					<div className="m-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-700">
						{error}
					</div>
				)}

				{/* Statistics */}
				{statistics && (
					<div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-6 py-5 sm:px-8 border-b border-gray-100 bg-gray-50">
						<div>
							<p className="text-xs font-semibold text-gray-500 uppercase">Total</p>
							<p className="mt-1 text-2xl font-bold text-gray-900">{statistics.total}</p>
						</div>
						<div>
							<p className="text-xs font-semibold text-gray-500 uppercase">Open</p>
							<p className="mt-1 text-2xl font-bold text-blue-600">{statistics.byStatus.open}</p>
						</div>
						<div>
							<p className="text-xs font-semibold text-gray-500 uppercase">In Progress</p>
							<p className="mt-1 text-2xl font-bold text-purple-600">{statistics.byStatus.inProgress}</p>
						</div>
						<div>
							<p className="text-xs font-semibold text-gray-500 uppercase">Resolved</p>
							<p className="mt-1 text-2xl font-bold text-green-600">{statistics.byStatus.resolved}</p>
						</div>
						<div>
							<p className="text-xs font-semibold text-gray-500 uppercase">Closed</p>
							<p className="mt-1 text-2xl font-bold text-gray-600">{statistics.byStatus.closed}</p>
						</div>
					</div>
				)}

				{/* View Selector */}
				<div className="flex border-b border-gray-100 bg-gray-50">
					<button
						onClick={() => setView('list')}
						className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
							view === 'list'
								? 'text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-600 hover:text-gray-900'
						}`}
					>
						Support Requests
					</button>
					<button
						onClick={() => setView('create')}
						className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
							view === 'create'
								? 'text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-600 hover:text-gray-900'
						}`}
					>
						Create Request
					</button>
				</div>

				{/* Content */}
				<div className="p-6 sm:p-8">
					{view === 'list' ? (
						<div>
							{/* Filters */}
							<div className="mb-6 flex flex-col sm:flex-row gap-4">
								<div className="flex-1">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Filter by Status
									</label>
									<select
										value={filterStatus}
										onChange={(e) => setFilterStatus(e.target.value)}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										<option value="all">All Statuses</option>
										<option value="open">Open</option>
										<option value="in-progress">In Progress</option>
										<option value="resolved">Resolved</option>
										<option value="closed">Closed</option>
										<option value="on-hold">On Hold</option>
									</select>
								</div>
								<div className="flex-1">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Filter by Priority
									</label>
									<select
										value={filterPriority}
										onChange={(e) => setFilterPriority(e.target.value)}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										<option value="all">All Priorities</option>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
										<option value="critical">Critical</option>
									</select>
								</div>
							</div>

							{/* List */}
							{supportRequests.length === 0 ? (
								<div className="text-center py-12">
									<p className="text-gray-500 mb-4">No support requests found</p>
									<button
										onClick={() => setView('create')}
										className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
									>
										Create Your First Request
									</button>
								</div>
							) : (
								<div className="space-y-3">
									{supportRequests.map((request) => (
										<div
											key={request._id}
											onClick={() => setSelectedRequest(request)}
											className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
										>
											<div className="flex items-start justify-between mb-2">
												<div className="flex-1">
													<h3 className="font-semibold text-gray-900">{request.title}</h3>
													<p className="text-sm text-gray-600 mt-1">{request.description}</p>
												</div>
												<div className="flex gap-2 ml-4">
													<span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
														{request.status}
													</span>
													<span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(request.priority)}`}>
														{request.priority}
													</span>
												</div>
											</div>
											<div className="flex items-center justify-between text-xs text-gray-500">
												<span>{request.labProjectName || 'Project'}</span>
												<span>{new Date(request.createdAt).toLocaleDateString()}</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					) : (
						<form onSubmit={handleCreateRequest} className="space-y-6 max-w-2xl">
							{/* Select Lab Project */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Lab Project <span className="text-red-600">*</span>
								</label>
								<select
									value={createForm.labProjectId}
									onChange={(e) => setCreateForm({ ...createForm, labProjectId: e.target.value })}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
									required
								>
									<option value="">-- Select a lab project --</option>
									{labProjects.map((project) => (
										<option key={project._id} value={project._id}>
											{project.name}
										</option>
									))}
								</select>
							</div>

							{/* Title */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Title <span className="text-red-600">*</span>
								</label>
								<input
									type="text"
									value={createForm.title}
									onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
									placeholder="Brief title of the issue"
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
									required
									maxLength="100"
								/>
							</div>

							{/* Description */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Description <span className="text-red-600">*</span>
								</label>
								<textarea
									value={createForm.description}
									onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
									placeholder="Detailed description of the issue"
									rows="5"
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
									required
									maxLength="1000"
								/>
								<p className="text-xs text-gray-500 mt-1">
									{createForm.description.length}/1000 characters
								</p>
							</div>

							{/* Category and Priority */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										Category <span className="text-red-600">*</span>
									</label>
									<select
										value={createForm.category}
										onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
										required
									>
										<option value="technical">Technical Support</option>
										<option value="maintenance">Maintenance</option>
										<option value="training">Training</option>
										<option value="troubleshooting">Troubleshooting</option>
										<option value="optimization">Optimization</option>
										<option value="upgrade">Upgrade</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										Priority
									</label>
									<select
										value={createForm.priority}
										onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
										<option value="critical">Critical</option>
									</select>
								</div>
							</div>

							{/* Buttons */}
							<div className="flex gap-4 pt-4">
								<button
									type="submit"
									disabled={loading}
									className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
								>
									{loading ? 'Creating...' : 'Create Support Request'}
								</button>
								<button
									type="button"
									onClick={() => setView('list')}
									className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
								>
									Cancel
								</button>
							</div>
						</form>
					)}

					{/* Request Details Modal */}
					{selectedRequest && view === 'list' && (
						<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
							<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
								{/* Header */}
								<div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center border-b">
									<h2 className="text-xl font-bold text-white">{selectedRequest.title}</h2>
									<button
										onClick={() => setSelectedRequest(null)}
										className="text-white hover:text-gray-100 text-2xl"
									>
										×
									</button>
								</div>

								{/* Content */}
								<div className="p-6 space-y-6">
									{/* Info Grid */}
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
											<div className="mt-1 flex gap-2 flex-wrap">
												{['open', 'in-progress', 'resolved', 'closed', 'on-hold'].map((status) => (
													<button
														key={status}
														onClick={() => handleStatusChange(status)}
														className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
															selectedRequest.status === status
																? getStatusColor(status)
																: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
														}`}
													>
														{status}
													</button>
												))}
											</div>
										</div>
										<div>
											<p className="text-xs font-semibold text-gray-500 uppercase">Priority</p>
											<p className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedRequest.priority)}`}>
												{selectedRequest.priority}
											</p>
										</div>
										<div>
											<p className="text-xs font-semibold text-gray-500 uppercase">Category</p>
											<p className="mt-1 text-sm text-gray-900">{selectedRequest.category}</p>
										</div>
										<div>
											<p className="text-xs font-semibold text-gray-500 uppercase">Created</p>
											<p className="mt-1 text-sm text-gray-900">
												{new Date(selectedRequest.createdAt).toLocaleDateString()}
											</p>
										</div>
									</div>

									{/* Description */}
									<div>
										<p className="text-sm font-semibold text-gray-900 mb-2">Description</p>
										<p className="text-sm text-gray-600">{selectedRequest.description}</p>
									</div>

									{/* Activities */}
									<div>
										<p className="text-sm font-semibold text-gray-900 mb-4">Activity Log</p>
										<div className="space-y-3 max-h-64 overflow-y-auto mb-4">
											{selectedRequest.activities && selectedRequest.activities.length > 0 ? (
												selectedRequest.activities.map((activity, idx) => (
													<div key={idx} className="p-3 bg-gray-50 rounded-lg">
														<div className="flex justify-between mb-1">
															<p className="text-xs font-semibold text-gray-900">
																{activity.author?.name || 'System'}
															</p>
															<p className="text-xs text-gray-500">
																{new Date(activity.timestamp).toLocaleString()}
															</p>
														</div>
														<p className="text-sm text-gray-600">{activity.message}</p>
													</div>
												))
											) : (
												<p className="text-sm text-gray-500">No activities yet</p>
											)}
										</div>

										{/* Add Comment */}
										<div className="flex gap-2">
											<textarea
												value={activityMessage}
												onChange={(e) => setActivityMessage(e.target.value)}
												placeholder="Add a comment..."
												rows="3"
												className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
											/>
											<button
												onClick={handleAddActivity}
												disabled={addingActivity || !activityMessage.trim()}
												className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors self-end"
											>
												{addingActivity ? 'Adding...' : 'Add'}
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default PostDeploymentSupport;
