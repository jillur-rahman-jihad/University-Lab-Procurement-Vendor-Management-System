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

	useEffect(() => {
		const fetchUniversityProfile = async () => {
			try {
				setLoading(true);
				const response = await fetch('http://localhost:5001/api/university/profile', {
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
				const response = await fetch('http://localhost:5001/api/labs/user-projects', {
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

		if (userInfo?.token) {
			fetchUniversityProfile();
			fetchLabProjects();
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
												<button
													onClick={() => navigate(`/quotation-system?labId=${project._id}&view=map`)}
													className="inline-flex items-center justify-center h-6 min-w-6 px-2 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold hover:bg-blue-200 transition-colors"
													title="View vendor quotations on map"
												>
													{project.quotationCount}
												</button>
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

					<button
						onClick={() => navigate('/consultant-management')}
						className="text-left rounded-2xl border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 p-6 shadow-sm transition-all hover:-translate-y-0.5"
					>
						<span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
							Option 3
						</span>
						<h2 className="mt-4 text-xl font-semibold text-gray-900">Consultant Management System</h2>
						<p className="mt-2 text-sm text-gray-600">
							Central system for consultant search, hiring, request tracking, suggestion review, and rankings.
						</p>
					</button>
				</div>
			</div>

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
