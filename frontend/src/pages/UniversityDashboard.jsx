import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProcurementSummaryModal from '../components/ProcurementSummaryModal';

const UniversityDashboard = () => {
	const navigate = useNavigate();
	const userInfo = JSON.parse(localStorage.getItem('userInfo'));
	const [profile, setProfile] = useState(null);
	const [labProjects, setLabProjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedProjectId, setSelectedProjectId] = useState(null);
	
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

	useEffect(() => {
		const fetchUniversityProfile = async () => {
			try {
				setLoading(true);
				const response = await fetch('http://localhost:5000/api/university/profile', {
					headers: {
						'Authorization': `Bearer ${userInfo?.token}`,
					},
				});

				if (!response.ok) {
					throw new Error('Failed to fetch university profile');
				}

				const data = await response.json();
				setProfile(data);
			} catch (err) {
				setError(err.message);
				console.error('Error fetching profile:', err);
			} finally {
				setLoading(false);
			}
		};

		const fetchLabProjects = async () => {
			try {
				const response = await fetch('http://localhost:5000/api/labs/user-projects', {
					headers: {
						'Authorization': `Bearer ${userInfo?.token}`,
					},
				});

				if (!response.ok) {
					throw new Error('Failed to fetch lab projects');
				}

				const data = await response.json();
				setLabProjects(data.projects || []);
			} catch (err) {
				console.error('Error fetching lab projects:', err);
			}
		};

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

		if (userInfo?.token) {
			fetchUniversityProfile();
			fetchLabProjects();
			fetchActiveHirings();
		}
	}, [userInfo?.token]);

	const handleLogout = () => {
		localStorage.removeItem('userInfo');
		navigate('/login');
	};

	const handleViewSummary = (projectId) => {
		setSelectedProjectId(projectId);
		setIsModalOpen(true);
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
			if (!response.ok) throw new Error('Search failed');
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

	const handleHireConsultant = async () => {
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

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to hire consultant');
			}

			alert('Consultant hired successfully!');
			setShowHireModal(false);
			setSelectedConsultant(null);
			
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

	if (!userInfo) {
		navigate('/login');
		return null;
	}

	return (
		<div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			<div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
				<div className="px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">University Dashboard</h1>
						<p className="mt-1 text-sm text-gray-500">
							Choose where you want to go next.
						</p>
					</div>

					<button
						onClick={handleLogout}
						className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
					>
						Logout
					</button>
				</div>

				{/* University Profile Section */}
				{loading ? (
					<div className="p-6 sm:p-8 text-center text-gray-500">
						Loading profile...
					</div>
				) : error ? (
					<div className="p-6 sm:p-8 text-center text-red-600">
						Error: {error}
					</div>
				) : profile ? (
					<div className="px-6 py-5 sm:px-8 border-b border-gray-100 bg-gray-50">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">University Information</h2>
						<div className="grid gap-6 md:grid-cols-2">
							<div>
								<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">University Name</p>
								<p className="mt-1 text-sm text-gray-900">{profile.universityInfo?.universityName || 'N/A'}</p>
							</div>
							<div>
								<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</p>
								<p className="mt-1 text-sm text-gray-900">{profile.universityInfo?.department || 'N/A'}</p>
							</div>
							<div>
								<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
								<p className="mt-1 text-sm text-gray-900">{profile.email || 'N/A'}</p>
							</div>
							<div>
								<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</p>
								<p className="mt-1 text-sm text-gray-900">{profile.phone || 'N/A'}</p>
							</div>
							<div>
								<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</p>
								<p className="mt-1 text-sm text-gray-900">{profile.universityInfo?.address || 'N/A'}</p>
							</div>
							<div>
								<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Authorized Representative</p>
								<p className="mt-1 text-sm text-gray-900">{profile.universityInfo?.representative?.name || 'N/A'}</p>
							</div>
						</div>
					</div>
				) : null}

				{/* Lab Projects Section */}
				<div className="px-6 py-5 sm:px-8 border-b border-gray-100 bg-white">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Lab Projects History</h2>
					{labProjects.length > 0 ? (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Lab Name</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Lab Type</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Created Date</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quotations</th>
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{labProjects.map((project) => (
										<tr key={project._id} className="hover:bg-gray-50 transition-colors">
											<td className="px-6 py-4 text-sm text-gray-900">{project.labName}</td>
											<td className="px-6 py-4 text-sm text-gray-600">{project.labType}</td>
											<td className="px-6 py-4 text-sm">
												<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
													project.status === 'draft' ? 'bg-gray-100 text-gray-800' :
													project.status === 'bidding' ? 'bg-blue-100 text-blue-800' :
													project.status === 'finalized' ? 'bg-purple-100 text-purple-800' :
													project.status === 'approved' ? 'bg-green-100 text-green-800' :
													'bg-gray-100 text-gray-800'
												}`}>
													{project.status.charAt(0).toUpperCase() + project.status.slice(1)}
												</span>
											</td>
											<td className="px-6 py-4 text-sm text-gray-600">
												{new Date(project.createdAt).toLocaleDateString()}
											</td>
											<td className="px-6 py-4 text-sm text-gray-900">
												<span className="inline-flex items-center justify-center h-6 w-6 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
													{project.quotationCount}
												</span>
											</td>
											<td className="px-6 py-4 text-center">
												<div className="flex items-center justify-center gap-2">
													<button
														onClick={() => handleViewSummary(project._id)}
														className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
													>
														View Summary
													</button>
													<button
														onClick={() => navigate(`/lab-planning?reorder=${project._id}`)}
														className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
													>
														Reorder
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p className="text-sm text-gray-500">No lab projects created yet.</p>
					)}
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
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Expertise</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Experience Level</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rating</th>
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{searchResults.map((consultant) => (
										<tr key={consultant._id} className="hover:bg-gray-50 transition-colors">
											<td className="px-6 py-4 text-sm text-gray-900">{consultant.name}</td>
											<td className="px-6 py-4 text-sm text-gray-600">{consultant.email}</td>
											<td className="px-6 py-4 text-sm text-gray-600">{consultant.consultantInfo?.expertise?.join(', ') || 'N/A'}</td>
											<td className="px-6 py-4 text-sm text-gray-600">{consultant.consultantInfo?.experienceLevel || 'N/A'}</td>
											<td className="px-6 py-4 text-sm text-gray-600">{'⭐'.repeat(Math.ceil(consultant.consultantInfo?.rating || 0))} ({consultant.consultantInfo?.rating || 0})</td>
											<td className="px-6 py-4 text-center">
												<button
													onClick={() => handleHireClick(consultant)}
													className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
												>
													Hire
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : searchResults.length === 0 && searchExpertise ? (
						<p className="text-sm text-gray-500">No consultants found for this expertise area.</p>
					) : null}
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
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Started At</th>
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{activeHirings.map((hiring) => (
										<tr key={hiring._id} className="hover:bg-gray-50 transition-colors">
											<td className="px-6 py-4 text-sm text-gray-900">{hiring.consultantId?.name}</td>
											<td className="px-6 py-4 text-sm">
												<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
													hiring.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
													hiring.status === 'accepted' ? 'bg-green-100 text-green-800' :
													hiring.status === 'active' ? 'bg-blue-100 text-blue-800' :
													'bg-gray-100 text-gray-800'
												}`}>
													{hiring.status.charAt(0).toUpperCase() + hiring.status.slice(1)}
												</span>
											</td>
											<td className="px-6 py-4 text-sm text-gray-600">
												{new Date(hiring.createdAt).toLocaleDateString()}
											</td>
											<td className="px-6 py-4 text-center">
												<button
													onClick={() => handleOpenChat(hiring)}
													className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
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

				<div className="grid gap-6 md:grid-cols-2 p-6 sm:p-8">
					<button
						onClick={() => navigate('/quotation-system')}
						className="text-left rounded-2xl border border-blue-100 bg-blue-50 hover:bg-blue-100 p-6 shadow-sm transition-all hover:-translate-y-0.5"
					>
						<span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
							Option 1
						</span>
						<h2 className="mt-4 text-xl font-semibold text-gray-900">Quotation System</h2>
						<p className="mt-2 text-sm text-gray-600">
							Review and manage quotations for university procurement.
						</p>
					</button>

					<button
						onClick={() => navigate('/lab-planning')}
						className="text-left rounded-2xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 p-6 shadow-sm transition-all hover:-translate-y-0.5"
					>
						<span className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
							Option 2
						</span>
						<h2 className="mt-4 text-xl font-semibold text-gray-900">Lab Planning Dashboard</h2>
						<p className="mt-2 text-sm text-gray-600">
							Create and plan lab requirements before requesting quotations.
						</p>
					</button>
				</div>
			</div>

			{/* Hire Consultant Modal */}
			{showHireModal && selectedConsultant && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-md w-full p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">Hire Consultant</h3>
						<div className="mb-4">
							<p className="text-sm text-gray-600">
								<strong>Consultant:</strong> {selectedConsultant.name}
							</p>
							<p className="text-sm text-gray-600">
								<strong>Expertise:</strong> {selectedConsultant.consultantInfo?.expertise?.join(', ')}
							</p>
						</div>
						<textarea
							placeholder="Add notes (optional)"
							value={hireNotes}
							onChange={(e) => setHireNotes(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
							rows="3"
						/>
						<div className="flex gap-3">
							<button
								onClick={() => setShowHireModal(false)}
								disabled={hiring}
								className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								onClick={handleHireConsultant}
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
					<div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-96 flex flex-col">
						<div className="flex justify-between items-center mb-4 pb-4 border-b">
							<h3 className="text-lg font-semibold text-gray-900">
								Chat with {selectedHiring.consultantId?.name}
							</h3>
							<button
								onClick={() => setShowChatModal(false)}
								className="text-gray-500 hover:text-gray-700"
							>
								✕
							</button>
						</div>
						
						{/* Messages */}
						<div className="flex-1 overflow-y-auto mb-4 space-y-3">
							{chatMessages.length > 0 ? (
								chatMessages.map((msg, idx) => (
									<div
										key={idx}
										className={`flex ${msg.senderId._id === userInfo?.id ? 'justify-end' : 'justify-start'}`}
									>
										<div
											className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
												msg.senderId._id === userInfo?.id
													? 'bg-blue-600 text-white'
													: 'bg-gray-200 text-gray-900'
											}`}
										>
											<p className="font-semibold text-xs mb-1">{msg.senderId?.name}</p>
											<p>{msg.message}</p>
											<p className="text-xs mt-1 opacity-70">
												{new Date(msg.createdAt).toLocaleTimeString()}
											</p>
										</div>
									</div>
								))
							) : (
								<p className="text-center text-sm text-gray-500">No messages yet.</p>
							)}
						</div>

						{/* Message Input */}
						<div className="flex gap-2">
							<input
								type="text"
								placeholder="Type your message..."
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								onKeyPress={(e) => {
									if (e.key === 'Enter' && !sendingMessage) {
										handleSendMessage();
									}
								}}
								className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								disabled={sendingMessage}
							/>
							<button
								onClick={handleSendMessage}
								disabled={sendingMessage || !newMessage.trim()}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
							>
								{sendingMessage ? '...' : 'Send'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Procurement Summary Modal */}
			<ProcurementSummaryModal
				isOpen={isModalOpen}
				projectId={selectedProjectId}
				onClose={() => setIsModalOpen(false)}
				userToken={userInfo?.token}
			/>
		</div>
	);
};

export default UniversityDashboard;
