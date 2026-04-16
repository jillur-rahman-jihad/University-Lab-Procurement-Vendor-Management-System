import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TechnicalConsultantDashboard = () => {
	const navigate = useNavigate();
	const userInfo = JSON.parse(localStorage.getItem('userInfo'));
	
	// Search Consultants States
	const [searchExpertise, setSearchExpertise] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [searchLoading, setSearchLoading] = useState(false);
	
	// Hiring and Chat States
	const [selectedConsultant, setSelectedConsultant] = useState(null);
	const [showHireModal, setShowHireModal] = useState(false);
	const [hireNotes, setHireNotes] = useState('');
	const [hiring, setHiring] = useState(false);
	const [activeHirings, setActiveHirings] = useState([]);
	const [selectedHiring, setSelectedHiring] = useState(null);
	const [showChatModal, setShowChatModal] = useState(false);
	const [chatMessages, setChatMessages] = useState([]);
	const [newMessage, setNewMessage] = useState('');
	const [sendingMessage, setSendingMessage] = useState(false);

	// Infrastructure Setup States
	const [showInfrastructureModal, setShowInfrastructureModal] = useState(false);
	const [infrastructureRequests, setInfrastructureRequests] = useState([]);
	const [infrastructureForm, setInfrastructureForm] = useState({
		serviceType: 'on-site-deployment',
		description: '',
		estimatedBudget: '',
		requiredDate: '',
		priority: 'medium',
		location: { address: '', city: '', state: '', zipCode: '' },
		notes: ''
	});
	const [submittingInfra, setSubmittingInfra] = useState(false);

	useEffect(() => {
		const fetchActiveHirings = async () => {
			try {
				const response = await fetch('http://localhost:5000/api/university/active-hirings', {
					headers: {
						'Authorization': `Bearer ${userInfo?.token}`,
					},
				});

				if (!response.ok) {
					throw new Error('Failed to fetch active hirings');
				}

				const data = await response.json();
				setActiveHirings(data.hirings || []);
			} catch (err) {
				console.error('Error fetching active hirings:', err);
			}
		};

		const fetchInfrastructureRequests = async () => {
			try {
				const response = await fetch('http://localhost:5000/api/university/infrastructure-requests', {
					headers: {
						'Authorization': `Bearer ${userInfo?.token}`,
					},
				});

				if (!response.ok) {
					throw new Error('Failed to fetch infrastructure requests');
				}

				const data = await response.json();
				setInfrastructureRequests(data.requests || []);
			} catch (err) {
				console.error('Error fetching infrastructure requests:', err);
			}
		};

		if (userInfo?.token) {
			fetchActiveHirings();
			fetchInfrastructureRequests();
		}
	}, [userInfo?.token]);

	const handleLogout = () => {
		localStorage.removeItem('userInfo');
		navigate('/login');
	};

	const handleSearchConsultants = async (e) => {
		e.preventDefault();
		setSearchLoading(true);
		try {
			const url = new URL('http://localhost:5000/api/university/search-consultants');
			if (searchExpertise) {
				url.searchParams.append('expertise', searchExpertise);
			}

			const response = await fetch(url, {
				headers: {
					'Authorization': `Bearer ${userInfo?.token}`,
				},
			});

			if (!response.ok) {
				throw new Error('Failed to search consultants');
			}

			const data = await response.json();
			setSearchResults(data.consultants || []);
		} catch (err) {
			console.error('Search error:', err);
			alert('Failed to search consultants');
		} finally {
			setSearchLoading(false);
		}
	};

	const handleHireClick = (consultant) => {
		setSelectedConsultant(consultant);
		setShowHireModal(true);
		setHireNotes('');
	};

	const handleConfirmHire = async () => {
		if (!selectedConsultant) return;

		setHiring(true);
		try {
			const response = await fetch('http://localhost:5000/api/university/hire-consultant', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${userInfo?.token}`,
				},
				body: JSON.stringify({
					consultantId: selectedConsultant._id,
					notes: hireNotes
				})
			});

			if (!response.ok) throw new Error('Failed to hire consultant');

			alert('Consultant hired successfully!');
			setShowHireModal(false);
			setSelectedConsultant(null);
			setHireNotes('');

			// Refresh active hirings
			const hiringsResponse = await fetch('http://localhost:5000/api/university/active-hirings', {
				headers: {
					'Authorization': `Bearer ${userInfo?.token}`,
				},
			});
			const hiringsData = await hiringsResponse.json();
			setActiveHirings(hiringsData.hirings || []);
		} catch (err) {
			console.error('Hire error:', err);
			alert(err.message || 'Failed to hire consultant');
		} finally {
			setHiring(false);
		}
	};

	const handleOpenChat = async (hiringRecord) => {
		setSelectedHiring(hiringRecord);
		try {
			const response = await fetch(`http://localhost:5000/api/university/messages/${hiringRecord._id}`, {
				headers: {
					'Authorization': `Bearer ${userInfo?.token}`,
				},
			});
			if (!response.ok) throw new Error('Failed to fetch messages');
			const data = await response.json();
			setChatMessages(data.messages || []);
			setShowChatModal(true);
			setNewMessage('');
		} catch (err) {
			console.error('Chat error:', err);
			alert('Failed to open chat');
		}
	};

	const handleSendMessage = async () => {
		if (!selectedHiring || !newMessage.trim()) return;

		setSendingMessage(true);
		try {
			const response = await fetch('http://localhost:5000/api/university/send-message', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${userInfo?.token}`,
				},
				body: JSON.stringify({
					hiringId: selectedHiring._id,
					message: newMessage
				})
			});

			if (!response.ok) throw new Error('Failed to send message');

			// Refresh messages
			const messagesResponse = await fetch(`http://localhost:5000/api/university/messages/${selectedHiring._id}`, {
				headers: {
					'Authorization': `Bearer ${userInfo?.token}`,
				},
			});
			const messagesData = await messagesResponse.json();
			setChatMessages(messagesData.messages || []);
			setNewMessage('');
		} catch (err) {
			console.error('Send message error:', err);
			alert('Failed to send message');
		} finally {
			setSendingMessage(false);
		}
	};

	const handleInfrastructureFormChange = (field, value) => {
		if (field.includes('.')) {
			const [parent, child] = field.split('.');
			setInfrastructureForm(prev => ({
				...prev,
				[parent]: { ...prev[parent], [child]: value }
			}));
		} else {
			setInfrastructureForm(prev => ({
				...prev,
				[field]: value
			}));
		}
	};

	const handleSubmitInfrastructureRequest = async () => {
		if (!infrastructureForm.serviceType || !infrastructureForm.description || !infrastructureForm.estimatedBudget) {
			alert('Please fill in all required fields');
			return;
		}

		setSubmittingInfra(true);
		try {
			const response = await fetch('http://localhost:5000/api/university/request-infrastructure', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${userInfo?.token}`,
				},
				body: JSON.stringify(infrastructureForm)
			});

			if (!response.ok) throw new Error('Failed to submit infrastructure request');

			alert('Infrastructure request submitted successfully!');
			setShowInfrastructureModal(false);
			setInfrastructureForm({
				serviceType: 'on-site-deployment',
				description: '',
				estimatedBudget: '',
				requiredDate: '',
				priority: 'medium',
				location: { address: '', city: '', state: '', zipCode: '' },
				notes: ''
			});

			// Refresh requests
			const infraResponse = await fetch('http://localhost:5000/api/university/infrastructure-requests', {
				headers: {
					'Authorization': `Bearer ${userInfo?.token}`,
				},
			});
			const infraData = await infraResponse.json();
			setInfrastructureRequests(infraData.requests || []);
		} catch (err) {
			console.error('Infrastructure error:', err);
			alert(err.message || 'Failed to request infrastructure setup');
		} finally {
			setSubmittingInfra(false);
		}
	};

	if (!userInfo) {
		navigate('/login');
		return null;
	}

	return (
		<div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			<div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
				<div className="px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Technical Consultant Assistant</h1>
						<p className="mt-1 text-sm text-gray-500">
							Search consultants, manage hirings, and request infrastructure services.
						</p>
					</div>

					<div className="flex gap-3">
						<button
							onClick={() => navigate('/dashboard')}
							className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
						>
							Back to Dashboard
						</button>
						<button
							onClick={handleLogout}
							className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
						>
							Logout
						</button>
					</div>
				</div>

				{/* Search Consultants Section */}
				<div className="px-6 py-5 sm:px-8 border-b border-gray-100 bg-white">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Search Consultants</h2>
					<form onSubmit={handleSearchConsultants} className="mb-6">
						<div className="flex gap-3 flex-col sm:flex-row">
							<select
								value={searchExpertise}
								onChange={(e) => setSearchExpertise(e.target.value)}
								className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">-- All Expertise Areas --</option>
								<option value="Networking">Networking</option>
								<option value="Graphics">Graphics</option>
								<option value="Research">Research</option>
								<option value="AI Infrastructure">AI Infrastructure</option>
							</select>
							<button
								type="submit"
								disabled={searchLoading}
								className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
							>
								{searchLoading ? 'Searching...' : 'Search'}
							</button>
						</div>
					</form>

					{/* Search Results */}
					{searchResults.length > 0 ? (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Expertise</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rating</th>
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{searchResults.map((consultant) => (
										<tr key={consultant._id}>
											<td className="px-6 py-3 text-sm text-gray-900">{consultant.name}</td>
											<td className="px-6 py-3 text-sm text-gray-600">
												{consultant.consultantInfo?.expertise?.join(', ') || 'N/A'}
											</td>
											<td className="px-6 py-3 text-sm text-gray-600">
												★ {consultant.consultantInfo?.rating || 'No rating'}
											</td>
											<td className="px-6 py-3 text-center">
												<button
													onClick={() => handleHireClick(consultant)}
													className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
												>
													Hire
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p className="text-sm text-gray-500">No consultants found. Try searching with different expertise.</p>
					)}
				</div>

				{/* Active Hirings Section */}
				<div className="px-6 py-5 sm:px-8 border-b border-gray-100 bg-white">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Active Hirings</h2>
					{activeHirings.length > 0 ? (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Consultant Name</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Hired Date</th>
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{activeHirings.map((hiring) => (
										<tr key={hiring._id}>
											<td className="px-6 py-3 text-sm text-gray-900">{hiring.consultantId?.name || 'Unknown'}</td>
											<td className="px-6 py-3 text-sm">
												<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
													Active
												</span>
											</td>
											<td className="px-6 py-3 text-sm text-gray-600">
												{new Date(hiring.createdAt).toLocaleDateString()}
											</td>
											<td className="px-6 py-3 text-center">
												<button
													onClick={() => handleOpenChat(hiring)}
													className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors"
												>
													Chat
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p className="text-sm text-gray-500">No active hirings yet.</p>
					)}
				</div>

				{/* Infrastructure Setup Section */}
				<div className="px-6 py-5 sm:px-8 border-b border-gray-100 bg-white">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold text-gray-900">Infrastructure Setup Requests</h2>
						<button
							onClick={() => setShowInfrastructureModal(true)}
							className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
						>
							+ New Request
						</button>
					</div>

					{infrastructureRequests.length > 0 ? (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Service Type</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Budget</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Priority</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Location</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{infrastructureRequests.map((req) => (
										<tr key={req._id} className="hover:bg-gray-50">
											<td className="px-6 py-3 text-sm text-gray-900">{req.serviceType}</td>
											<td className="px-6 py-3 text-sm text-gray-600">${req.estimatedBudget}</td>
											<td className="px-6 py-3 text-sm">
												<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
													req.priority === 'urgent' ? 'bg-red-100 text-red-800' :
													req.priority === 'high' ? 'bg-orange-100 text-orange-800' :
													req.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
													'bg-green-100 text-green-800'
												}`}>
													{req.priority.charAt(0).toUpperCase() + req.priority.slice(1)}
												</span>
											</td>
											<td className="px-6 py-3 text-sm">
												<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
													req.status === 'pending' ? 'bg-blue-100 text-blue-800' :
													req.status === 'accepted' ? 'bg-green-100 text-green-800' :
													'bg-gray-100 text-gray-800'
												}`}>
													{req.status.charAt(0).toUpperCase() + req.status.slice(1)}
												</span>
											</td>
											<td className="px-6 py-3 text-sm text-gray-600">{req.location?.city || 'N/A'}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p className="text-sm text-gray-500">No infrastructure setup requests yet.</p>
					)}
				</div>
			</div>

			{/* Hire Consultant Modal */}
			{showHireModal && selectedConsultant && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-md w-full p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">Hire Consultant</h3>
						<div className="mb-4">
							<p className="text-sm text-gray-600"><strong>Name:</strong> {selectedConsultant.name}</p>
							<p className="text-sm text-gray-600 mt-2"><strong>Expertise:</strong> {selectedConsultant.consultantInfo?.expertise?.join(', ') || 'N/A'}</p>
						</div>
						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
							<textarea
								value={hireNotes}
								onChange={(e) => setHireNotes(e.target.value)}
								placeholder="Add any notes about the hiring..."
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
								rows="3"
							/>
						</div>
						<div className="flex gap-3">
							<button
								onClick={() => setShowHireModal(false)}
								disabled={hiring}
								className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								onClick={handleConfirmHire}
								disabled={hiring}
								className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
							>
								{hiring ? 'Hiring...' : 'Confirm Hire'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Chat Modal */}
			{showChatModal && selectedHiring && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-md w-full p-6 max-h-96 flex flex-col">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Chat with {selectedHiring.consultantId?.name}
						</h3>
						
						{/* Messages */}
						<div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded p-3 bg-gray-50">
							{chatMessages.length > 0 ? (
								chatMessages.map((msg, idx) => (
									<div key={idx} className={`mb-3 ${msg.sender === 'university' ? 'text-right' : 'text-left'}`}>
										<div className={`inline-block max-w-xs px-3 py-2 rounded-lg ${
											msg.sender === 'university' 
												? 'bg-blue-600 text-white' 
												: 'bg-gray-300 text-gray-900'
										}`}>
											<p className="text-sm break-words">{msg.message}</p>
										</div>
										<p className="text-xs text-gray-500 mt-1">
											{new Date(msg.timestamp).toLocaleTimeString()}
										</p>
									</div>
								))
							) : (
								<p className="text-sm text-gray-500 text-center">No messages yet. Start the conversation!</p>
							)}
						</div>

						{/* Message Input */}
						<div className="flex gap-2">
							<input
								type="text"
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
								placeholder="Type your message..."
								className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
							/>
							<button
								onClick={handleSendMessage}
								disabled={sendingMessage || !newMessage.trim()}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
							>
								{sendingMessage ? '...' : 'Send'}
							</button>
						</div>

						<button
							onClick={() => setShowChatModal(false)}
							className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
						>
							Close
						</button>
					</div>
				</div>
			)}

			{/* Infrastructure Setup Modal */}
			{showInfrastructureModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
					<div className="bg-white rounded-lg w-full max-w-2xl my-12">
						<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
							<h3 className="text-lg font-semibold text-gray-900">Request Infrastructure Setup</h3>
							<button
								onClick={() => setShowInfrastructureModal(false)}
								className="text-gray-500 hover:text-gray-700"
							>
								✕
							</button>
						</div>

						{/* Form */}
						<div className="p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
								<select
									value={infrastructureForm.serviceType}
									onChange={(e) => handleInfrastructureFormChange('serviceType', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
								>
									<option value="on-site-deployment">On-Site Deployment</option>
									<option value="hardware-configuration">Hardware Configuration</option>
									<option value="network-setup">Network Setup</option>
									<option value="complete-setup">Complete Lab Setup</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
								<textarea
									value={infrastructureForm.description}
									onChange={(e) => handleInfrastructureFormChange('description', e.target.value)}
									placeholder="Describe your infrastructure setup requirements..."
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
									rows="4"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Estimated Budget ($) *</label>
									<input
										type="number"
										value={infrastructureForm.estimatedBudget}
										onChange={(e) => handleInfrastructureFormChange('estimatedBudget', e.target.value)}
										placeholder="0"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
									<select
										value={infrastructureForm.priority}
										onChange={(e) => handleInfrastructureFormChange('priority', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
										<option value="urgent">Urgent</option>
									</select>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Required Date</label>
								<input
									type="date"
									value={infrastructureForm.requiredDate}
									onChange={(e) => handleInfrastructureFormChange('requiredDate', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
									<input
										type="text"
										value={infrastructureForm.location.address}
										onChange={(e) => handleInfrastructureFormChange('location.address', e.target.value)}
										placeholder="Street address"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">City</label>
									<input
										type="text"
										value={infrastructureForm.location.city}
										onChange={(e) => handleInfrastructureFormChange('location.city', e.target.value)}
										placeholder="City"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
								<textarea
									value={infrastructureForm.notes}
									onChange={(e) => handleInfrastructureFormChange('notes', e.target.value)}
									placeholder="Any additional details..."
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
									rows="2"
								/>
							</div>
						</div>

						{/* Buttons */}
						<div className="flex gap-3 p-6 border-t border-gray-200">
							<button
								onClick={() => setShowInfrastructureModal(false)}
								disabled={submittingInfra}
								className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								onClick={handleSubmitInfrastructureRequest}
								disabled={submittingInfra}
								className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
							>
								{submittingInfra ? 'Submitting...' : 'Submit Request'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default TechnicalConsultantDashboard;
