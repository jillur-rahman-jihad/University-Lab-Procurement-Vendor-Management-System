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
	const [exportingId, setExportingId] = useState(null);
	const [expandedExportMenu, setExpandedExportMenu] = useState(null);
	const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
	const [submissionProject, setSubmissionProject] = useState(null);
	const [submissionForm, setSubmissionForm] = useState({
		documentType: 'Technical PDF',
		submittedTo: 'Both',
		financeOfficeEmails: [],
		procurementCommitteeEmails: [],
		notes: '',
		priority: 'medium'
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submissions, setSubmissions] = useState([]);

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

	const handleExportDocumentation = async (projectId) => {
		try {
			setExportingId(projectId);
			const response = await fetch(
				`http://localhost:5001/api/labs/export-documentation/${projectId}`,
				{
					headers: {
						'Authorization': `Bearer ${userInfo?.token}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error('Failed to export documentation');
			}

			const data = await response.json();
			
			// Create a blob from the response data
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			
			// Create a download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `Lab_Project_Documentation_${projectId}_${Date.now()}.json`;
			
			// Trigger the download
			document.body.appendChild(link);
			link.click();
			
			// Cleanup
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Error exporting documentation:', err);
			alert('Failed to export documentation. Please try again.');
		} finally {
			setExportingId(null);
		}
	};

	const handleExportPDF = async (projectId) => {
		try {
			setExportingId(projectId);
			const response = await fetch(
				`http://localhost:5001/api/labs/export-documentation-pdf/${projectId}`,
				{
					headers: {
						'Authorization': `Bearer ${userInfo?.token}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error('Failed to export PDF');
			}

			// Get the blob from the response
			const blob = await response.blob();
			
			// Create a download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `Lab_Project_Documentation_${projectId}_${Date.now()}.pdf`;
			
			// Trigger the download
			document.body.appendChild(link);
			link.click();
			
			// Cleanup
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Error exporting PDF:', err);
			alert('Failed to export PDF. Please try again.');
		} finally {
			setExportingId(null);
		}
	};

	const handleExportCSV = async (projectId) => {
		try {
			setExportingId(projectId);
			const response = await fetch(
				`http://localhost:5001/api/labs/export-documentation-csv/${projectId}`,
				{
					headers: {
						'Authorization': `Bearer ${userInfo?.token}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error('Failed to export CSV');
			}

			// Get the blob from the response
			const blob = await response.blob();
			
			// Create a download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `Lab_Project_Financial_Analysis_${projectId}_${Date.now()}.csv`;
			
			// Trigger the download
			document.body.appendChild(link);
			link.click();
			
			// Cleanup
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Error exporting CSV:', err);
			alert('Failed to export CSV. Please try again.');
		} finally {
			setExportingId(null);
		}
	};

	const handleExportProcurementReport = async (projectId) => {
		try {
			setExportingId(projectId);
			const response = await fetch(
				`http://localhost:5001/api/labs/export-procurement-report/${projectId}`,
				{
					headers: {
						'Authorization': `Bearer ${userInfo?.token}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error('Failed to export procurement report');
			}

			// Get the blob from the response
			const blob = await response.blob();
			
			// Create a download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `Procurement_Summary_Report_${projectId}_${Date.now()}.pdf`;
			
			// Trigger the download
			document.body.appendChild(link);
			link.click();
			
			// Cleanup
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Error exporting procurement report:', err);
			alert('Failed to export procurement report. Please try again.');
		} finally {
			setExportingId(null);
		}
	};

	const openSubmissionModal = (projectId) => {
		setSubmissionProject(projectId);
		setSubmissionModalOpen(true);
		setSubmissionForm({
			documentType: 'Technical PDF',
			submittedTo: 'Both',
			financeOfficeEmails: [],
			procurementCommitteeEmails: [],
			notes: '',
			priority: 'medium'
		});
	};

	const handleSubmitDocument = async () => {
		try {
			if (!submissionForm.submittedTo) {
				alert('Please select a submission recipient (Finance Office, Procurement Committee, or Both)');
				return;
			}

			setIsSubmitting(true);
			const response = await fetch(
				'http://localhost:5001/api/document-submission/submit-document',
				{
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${userInfo?.token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						labProjectId: submissionProject,
						documentType: submissionForm.documentType,
						submittedTo: submissionForm.submittedTo,
						financeOfficeEmails: submissionForm.financeOfficeEmails.length > 0 ? submissionForm.financeOfficeEmails : undefined,
						procurementCommitteeEmails: submissionForm.procurementCommitteeEmails.length > 0 ? submissionForm.procurementCommitteeEmails : undefined,
						notes: submissionForm.notes,
						priority: submissionForm.priority
					})
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to submit document');
			}

			const data = await response.json();
			alert(`Document submitted successfully for ${submissionForm.submittedTo} review and approval`);
			setSubmissionModalOpen(false);
			
			// Fetch updated submissions
			fetchSubmissions();
		} catch (err) {
			console.error('Error submitting document:', err);
			alert('Failed to submit document: ' + err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const fetchSubmissions = async () => {
		try {
			const response = await fetch(
				'http://localhost:5001/api/document-submission/submissions',
				{
					headers: {
						'Authorization': `Bearer ${userInfo?.token}`,
					},
				}
			);

			if (response.ok) {
				const data = await response.json();
				setSubmissions(data.submissions || []);
			}
		} catch (err) {
			console.error('Error fetching submissions:', err);
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

					<div className="flex gap-2">
						<button
							onClick={() => navigate('/document-reviewer')}
							className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2"
						>
							<span className="material-icons" style={{ fontSize: '18px' }}>
								assignment_turned_in
							</span>
							Review Documents
						</button>
						<button
							onClick={handleLogout}
							className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
						>
							Logout
						</button>
					</div>
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
												<div className="flex items-center justify-center gap-2 flex-wrap">
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
													
													{/* Export Dropdown */}
													<div className="relative">
														<button
															onClick={() => setExpandedExportMenu(expandedExportMenu === project._id ? null : project._id)}
															disabled={exportingId === project._id}
															className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
														>
															<span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>
																download
															</span>
															Export
															<span className="material-icons" style={{ fontSize: '14px', marginLeft: '4px' }}>
																{expandedExportMenu === project._id ? 'expand_less' : 'expand_more'}
															</span>
														</button>
														
														{expandedExportMenu === project._id && (
															<div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
																<button
																	onClick={() => {
																		handleExportDocumentation(project._id);
																		setExpandedExportMenu(null);
																	}}
																	disabled={exportingId === project._id}
																	className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
																>
																	<span className="material-icons" style={{ fontSize: '16px', color: '#7c3aed' }}>
																		description
																	</span>
																	<span>JSON Data</span>
																</button>
																<div className="border-t border-gray-200"></div>
																<button
																	onClick={() => {
																		handleExportPDF(project._id);
																		setExpandedExportMenu(null);
																	}}
																	disabled={exportingId === project._id}
																	className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
																>
																	<span className="material-icons" style={{ fontSize: '16px', color: '#dc2626' }}>
																		picture_as_pdf
																	</span>
																	<span>Technical PDF</span>
																</button>
																<div className="border-t border-gray-200"></div>
																<button
																	onClick={() => {
																		handleExportCSV(project._id);
																		setExpandedExportMenu(null);
																	}}
																	disabled={exportingId === project._id}
																	className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
																>
																	<span className="material-icons" style={{ fontSize: '16px', color: '#059669' }}>
																		table_chart
																	</span>
																	<span>Financial CSV</span>
																</button>
																<div className="border-t border-gray-200"></div>
																<button
																	onClick={() => {
																		handleExportProcurementReport(project._id);
																		setExpandedExportMenu(null);
																	}}
																	disabled={exportingId === project._id}
																	className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
																>
																	<span className="material-icons" style={{ fontSize: '16px', color: '#0891b2' }}>
																		approval
																	</span>
																	<span>Approval Report</span>
																</button>
															</div>
														)}
													</div>

													{/* Submit for Approval Button */}
													<button
														onClick={() => openSubmissionModal(project._id)}
														className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
													>
														<span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>
															send
														</span>
														Submit
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
						onClick={() => navigate('/search-consultants')}
						className="text-left rounded-2xl border border-purple-100 bg-purple-50 hover:bg-purple-100 p-6 shadow-sm transition-all hover:-translate-y-0.5"
					>
						<span className="inline-flex items-center rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
							Option 3
						</span>
						<h2 className="mt-4 text-xl font-semibold text-gray-900">Search Consultants</h2>
						<p className="mt-2 text-sm text-gray-600">
							Find and view available technical consultants by expertise.
						</p>
					</button>

					<button
						onClick={() => navigate('/hire-consultant')}
						className="text-left rounded-2xl border border-pink-100 bg-pink-50 hover:bg-pink-100 p-6 shadow-sm transition-all hover:-translate-y-0.5"
					>
						<span className="inline-flex items-center rounded-full bg-pink-600 px-3 py-1 text-xs font-semibold text-white">
							Option 4
						</span>
						<h2 className="mt-4 text-xl font-semibold text-gray-900">Hire Consultant</h2>
						<p className="mt-2 text-sm text-gray-600">
							Create hire requests for consultants for specific lab projects.
						</p>
					</button>

					<button
						onClick={() => navigate('/my-hire-requests')}
						className="text-left rounded-2xl border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 p-6 shadow-sm transition-all hover:-translate-y-0.5"
					>
						<span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
							Option 5
						</span>
						<h2 className="mt-4 text-xl font-semibold text-gray-900">My Hire Requests</h2>
						<p className="mt-2 text-sm text-gray-600">
							Track and manage all your consultant hire requests and assignments.
						</p>
					</button>

					<button
						onClick={() => navigate('/subscription-plans')}
						className="text-left rounded-2xl border border-amber-100 bg-amber-50 hover:bg-amber-100 p-6 shadow-sm transition-all hover:-translate-y-0.5"
					>
						<span className="inline-flex items-center rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
							Option 6
						</span>
						<h2 className="mt-4 text-xl font-semibold text-gray-900">Subscription Plans</h2>
						<p className="mt-2 text-sm text-gray-600">
							Manage your subscription plan and payment information.
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

			{/* Document Submission Modal */}
			{submissionModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
						{/* Modal Header */}
						<div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center border-b">
							<h2 className="text-xl font-bold text-white">Submit Document for Review & Approval</h2>
							<button
								onClick={() => setSubmissionModalOpen(false)}
								className="text-white hover:text-gray-100"
							>
								<span className="material-icons">close</span>
							</button>
						</div>

						{/* Modal Content */}
						<div className="p-6">
							{/* Document Type Selection */}
							<div className="mb-6">
								<label className="block text-sm font-semibold text-gray-900 mb-3">
									Select Document Format
								</label>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
									{['JSON', 'Technical PDF', 'Financial CSV', 'Procurement Report'].map((type) => (
										<button
											key={type}
											onClick={() => setSubmissionForm({ ...submissionForm, documentType: type })}
											className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
												submissionForm.documentType === type
													? 'bg-blue-600 text-white border-2 border-blue-600'
													: 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-blue-300'
											}`}
										>
											{type}
										</button>
									))}
								</div>
							</div>

							{/* Submission Recipient Selection */}
							<div className="mb-6">
								<label className="block text-sm font-semibold text-gray-900 mb-3">
									Submit to (Required)
								</label>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
									{['Finance Office', 'Procurement Committee', 'Both'].map((recipient) => (
										<button
											key={recipient}
											onClick={() => setSubmissionForm({ ...submissionForm, submittedTo: recipient })}
											className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
												submissionForm.submittedTo === recipient
													? 'bg-green-600 text-white border-2 border-green-600'
													: 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-green-300'
											}`}
										>
											{recipient}
										</button>
									))}
								</div>
							</div>

							{/* Finance Office Emails */}
							{(submissionForm.submittedTo === 'Finance Office' || submissionForm.submittedTo === 'Both') && (
								<div className="mb-6">
									<label className="block text-sm font-semibold text-gray-900 mb-2">
										Finance Office Email(s)
									</label>
									<input
										type="email"
										placeholder="Enter email address (optional)"
										className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										onKeyPress={(e) => {
											if (e.key === 'Enter' && e.target.value.trim()) {
												setSubmissionForm({
													...submissionForm,
													financeOfficeEmails: [...submissionForm.financeOfficeEmails, e.target.value.trim()]
												});
												e.target.value = '';
											}
										}}
									/>
									<p className="text-xs text-gray-500 mt-1">Press Enter to add email</p>
									<div className="flex flex-wrap gap-2 mt-2">
										{submissionForm.financeOfficeEmails.map((email, idx) => (
											<span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs flex items-center gap-2">
												{email}
												<button
													onClick={() => setSubmissionForm({
														...submissionForm,
														financeOfficeEmails: submissionForm.financeOfficeEmails.filter((_, i) => i !== idx)
													})}
													className="text-blue-700 hover:text-blue-900"
												>
													×
												</button>
											</span>
										))}
									</div>
								</div>
							)}

							{/* Procurement Committee Emails */}
							{(submissionForm.submittedTo === 'Procurement Committee' || submissionForm.submittedTo === 'Both') && (
								<div className="mb-6">
									<label className="block text-sm font-semibold text-gray-900 mb-2">
										Procurement Committee Email(s)
									</label>
									<input
										type="email"
										placeholder="Enter email address (optional)"
										className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										onKeyPress={(e) => {
											if (e.key === 'Enter' && e.target.value.trim()) {
												setSubmissionForm({
													...submissionForm,
													procurementCommitteeEmails: [...submissionForm.procurementCommitteeEmails, e.target.value.trim()]
												});
												e.target.value = '';
											}
										}}
									/>
									<p className="text-xs text-gray-500 mt-1">Press Enter to add email</p>
									<div className="flex flex-wrap gap-2 mt-2">
										{submissionForm.procurementCommitteeEmails.map((email, idx) => (
											<span key={idx} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs flex items-center gap-2">
												{email}
												<button
													onClick={() => setSubmissionForm({
														...submissionForm,
														procurementCommitteeEmails: submissionForm.procurementCommitteeEmails.filter((_, i) => i !== idx)
													})}
													className="text-purple-700 hover:text-purple-900"
												>
													×
												</button>
											</span>
										))}
									</div>
								</div>
							)}

							{/* Priority Selection */}
							<div className="mb-6">
								<label className="block text-sm font-semibold text-gray-900 mb-3">
									Priority Level
								</label>
								<div className="grid grid-cols-4 gap-3">
									{['low', 'medium', 'high', 'urgent'].map((p) => (
										<button
											key={p}
											onClick={() => setSubmissionForm({ ...submissionForm, priority: p })}
											className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
												submissionForm.priority === p
													? 'bg-red-600 text-white'
													: 'bg-gray-100 text-gray-700 border border-gray-200'
											}`}
										>
											{p}
										</button>
									))}
								</div>
							</div>

							{/* Notes */}
							<div className="mb-6">
								<label className="block text-sm font-semibold text-gray-900 mb-2">
									Additional Notes (Optional)
								</label>
								<textarea
									value={submissionForm.notes}
									onChange={(e) => setSubmissionForm({ ...submissionForm, notes: e.target.value })}
									placeholder="Add any additional notes or instructions for reviewers..."
									className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									rows="4"
								/>
							</div>
						</div>

						{/* Modal Footer */}
						<div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end gap-4">
							<button
								onClick={() => setSubmissionModalOpen(false)}
								disabled={isSubmitting}
								className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								onClick={handleSubmitDocument}
								disabled={isSubmitting || !submissionForm.submittedTo}
								className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							>
								{isSubmitting ? (
									<>
										<span className="material-icons animate-spin" style={{ fontSize: '16px' }}>
											hourglass_empty
										</span>
										Submitting...
									</>
								) : (
									<>
										<span className="material-icons" style={{ fontSize: '16px' }}>
											send
										</span>
										Submit for Review
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default UniversityDashboard;
