import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ReviewerDashboard = () => {
	const navigate = useNavigate();
	const userInfo = JSON.parse(localStorage.getItem('userInfo'));
	const [submissions, setSubmissions] = useState([]);
	const [filteredSubmissions, setFilteredSubmissions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [selectedSubmission, setSelectedSubmission] = useState(null);
	const [reviewModalOpen, setReviewModalOpen] = useState(false);
	const [reviewForm, setReviewForm] = useState({
		status: 'reviewed',
		comments: '',
		budget_verification_passed: null,
		audit_notes: '',
		role: 'Committee Member'
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [approvalType, setApprovalType] = useState(null);

	useEffect(() => {
		fetchSubmissions();
	}, []);

	useEffect(() => {
		filterSubmissions();
	}, [submissions, searchTerm, statusFilter]);

	const fetchSubmissions = async () => {
		try {
			setLoading(true);
			// For demo, this would fetch all submissions for the reviewer's organization
			// In production, this would be filtered based on the reviewer's role and organization
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
			setError('Failed to load submissions');
		} finally {
			setLoading(false);
		}
	};

	const filterSubmissions = () => {
		let filtered = submissions;

		// Filter by status
		if (statusFilter !== 'all') {
			filtered = filtered.filter(sub => sub.status === statusFilter);
		}

		// Filter by search term
		if (searchTerm.trim()) {
			filtered = filtered.filter(sub =>
				sub.labProjectId?.labName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				sub.documentType?.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		setFilteredSubmissions(filtered);
	};

	const handleReview = (submission) => {
		setSelectedSubmission(submission);
		setReviewModalOpen(true);
		setReviewForm({
			status: 'reviewed',
			comments: '',
			budget_verification_passed: null,
			audit_notes: '',
			role: userInfo?.role || 'Committee Member'
		});
	};

	const handleSubmitReview = async () => {
		try {
			if (!selectedSubmission) return;

			// Validate form
			if (!reviewForm.comments.trim()) {
				alert('Please add review comments');
				return;
			}

			if (reviewForm.budget_verification_passed === null) {
				alert('Please select budget verification status');
				return;
			}

			setIsSubmitting(true);

			// Prepare payload
			const payload = {
				status: reviewForm.status,
				comments: reviewForm.comments,
				budget_verification_passed: reviewForm.budget_verification_passed,
				audit_notes: reviewForm.audit_notes || '',
				role: userInfo?.role ? (userInfo.role === 'finance' ? 'Finance Officer' : userInfo.role === 'procurement' ? 'Procurement Officer' : 'Committee Member') : 'Committee Member'
			};

			console.log('Submitting review with payload:', payload);

			const response = await fetch(
				`http://localhost:5001/api/document-submission/submission/${selectedSubmission._id}/add-review`,
				{
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${userInfo?.token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(payload)
				}
			);

			const responseData = await response.json();

			if (!response.ok) {
				console.error('Backend error response:', responseData);
				throw new Error(responseData.message || responseData.error || 'Failed to submit review');
			}

			alert('Review submitted successfully');
			setReviewModalOpen(false);
			fetchSubmissions();
		} catch (err) {
			console.error('Error submitting review:', err);
			alert('Error: ' + err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleApprove = async (type) => {
		try {
			if (!selectedSubmission) return;

			setIsSubmitting(true);
			const response = await fetch(
				`http://localhost:5001/api/document-submission/submission/${selectedSubmission._id}/approve`,
				{
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${userInfo?.token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						approvalType: type,
						authorizedBy: userInfo?.name || 'Administrator',
						finalNotes: `Approved by ${userInfo?.role}`
					})
				}
			);

			if (!response.ok) {
				throw new Error('Failed to approve document');
			}

			alert(`Document approved successfully (${type})`);
			setReviewModalOpen(false);
			setApprovalType(null);
			fetchSubmissions();
		} catch (err) {
			console.error('Error approving document:', err);
			alert('Error: ' + err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleReject = async () => {
		try {
			if (!selectedSubmission) return;

			const rejectionReason = prompt('Enter rejection reason:');
			if (!rejectionReason) return;

			setIsSubmitting(true);
			const response = await fetch(
				`http://localhost:5001/api/document-submission/submission/${selectedSubmission._id}/reject`,
				{
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${userInfo?.token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						rejectionReason,
						rejectedBy: userInfo?.name || 'Administrator'
					})
				}
			);

			if (!response.ok) {
				throw new Error('Failed to reject document');
			}

			alert('Document rejected successfully');
			setReviewModalOpen(false);
			fetchSubmissions();
		} catch (err) {
			console.error('Error rejecting document:', err);
			alert('Error: ' + err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const downloadDocument = async (submission) => {
		try {
			const endpoints = {
				'JSON': `/api/labs/export-documentation/${submission.labProjectId._id}`,
				'Technical PDF': `/api/labs/export-documentation-pdf/${submission.labProjectId._id}`,
				'Financial CSV': `/api/labs/export-documentation-csv/${submission.labProjectId._id}`,
				'Procurement Report': `/api/labs/export-procurement-report/${submission.labProjectId._id}`
			};

			const endpoint = endpoints[submission.documentType];
			if (!endpoint) return;

			const response = await fetch(`http://localhost:5001${endpoint}`, {
				headers: {
					'Authorization': `Bearer ${userInfo?.token}`,
				},
			});

			if (!response.ok) {
				throw new Error('Failed to download document');
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${submission.documentType}_${submission.labProjectId._id}.${submission.documentType.includes('PDF') ? 'pdf' : submission.documentType.includes('CSV') ? 'csv' : 'json'}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Error downloading document:', err);
			alert('Failed to download document');
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'submitted': return 'bg-blue-100 text-blue-800';
			case 'under_review': return 'bg-yellow-100 text-yellow-800';
			case 'partially_approved': return 'bg-orange-100 text-orange-800';
			case 'approved': return 'bg-green-100 text-green-800';
			case 'rejected': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	};

	const getPriorityColor = (priority) => {
		switch (priority) {
			case 'low': return 'bg-green-50 border-green-200';
			case 'medium': return 'bg-yellow-50 border-yellow-200';
			case 'high': return 'bg-orange-50 border-orange-200';
			case 'urgent': return 'bg-red-50 border-red-200';
			default: return 'bg-gray-50 border-gray-200';
		}
	};

	if (!userInfo) {
		navigate('/login');
		return null;
	}

	return (
		<div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			<div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
				{/* Header */}
				<div className="px-6 py-5 sm:px-8 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
					<div className="flex justify-between items-center">
						<div>
							<h1 className="text-3xl font-bold text-white">Document Review Dashboard</h1>
							<p className="text-blue-100 mt-1">Review and approve submitted lab project documentation</p>
						</div>
						<button
							onClick={() => navigate('/dashboard')}
							className="px-4 py-2 rounded-md text-sm font-medium text-white bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
						>
							Back to Dashboard
						</button>
					</div>
				</div>

				{/* Filters */}
				<div className="px-6 py-4 sm:px-8 border-b border-gray-100 bg-gray-50">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Search Projects</label>
							<input
								type="text"
								placeholder="Search by project name or document type..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="all">All Status</option>
								<option value="submitted">Submitted</option>
								<option value="under_review">Under Review</option>
								<option value="partially_approved">Partially Approved</option>
								<option value="approved">Approved</option>
								<option value="rejected">Rejected</option>
							</select>
						</div>
						<div className="flex items-end">
							<button
								onClick={fetchSubmissions}
								className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
							>
								Refresh
							</button>
						</div>
					</div>
				</div>

				{/* Content */}
				{loading ? (
					<div className="p-8 text-center text-gray-500">
						Loading submissions...
					</div>
				) : error ? (
					<div className="p-8 text-center text-red-600">
						{error}
					</div>
				) : filteredSubmissions.length === 0 ? (
					<div className="p-8 text-center text-gray-500">
						No submissions found
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Lab Project</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Document Type</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Submitted To</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Priority</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Submitted Date</th>
									<th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200 bg-white">
								{filteredSubmissions.map((submission) => (
									<tr key={submission._id} className="hover:bg-gray-50 transition-colors">
										<td className="px-6 py-4 text-sm text-gray-900 font-medium">
											{submission.labProjectId?.labName || 'Unknown Project'}
										</td>
										<td className="px-6 py-4 text-sm text-gray-600">
											{submission.documentType}
										</td>
										<td className="px-6 py-4 text-sm text-gray-600">
											{submission.submittedTo}
										</td>
										<td className="px-6 py-4 text-sm">
											<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
												{submission.status.replace('_', ' ')}
											</span>
										</td>
										<td className="px-6 py-4 text-sm">
											<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(submission.priority)} capitalize`}>
												{submission.priority}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-gray-600">
											{new Date(submission.submittedAt).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 text-center">
											<button
												onClick={() => handleReview(submission)}
												className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors mr-2"
											>
												<span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>
													preview
												</span>
												Review
											</button>
											<button
												onClick={() => downloadDocument(submission)}
												className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
											>
												<span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>
													download
												</span>
												Download
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Summary Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 sm:p-8 border-t border-gray-100 bg-gray-50">
					<div className="text-center">
						<p className="text-gray-600 text-sm font-medium">Total Submissions</p>
						<p className="text-3xl font-bold text-gray-900 mt-2">{submissions.length}</p>
					</div>
					<div className="text-center">
						<p className="text-gray-600 text-sm font-medium">Pending Review</p>
						<p className="text-3xl font-bold text-yellow-600 mt-2">
							{submissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length}
						</p>
					</div>
					<div className="text-center">
						<p className="text-gray-600 text-sm font-medium">Approved</p>
						<p className="text-3xl font-bold text-green-600 mt-2">
							{submissions.filter(s => s.status === 'approved').length}
						</p>
					</div>
					<div className="text-center">
						<p className="text-gray-600 text-sm font-medium">Rejected</p>
						<p className="text-3xl font-bold text-red-600 mt-2">
							{submissions.filter(s => s.status === 'rejected').length}
						</p>
					</div>
				</div>
			</div>

			{/* Review Modal */}
			{reviewModalOpen && selectedSubmission && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
					<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
						{/* Modal Header */}
						<div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center border-b">
							<div>
								<h2 className="text-xl font-bold text-white">Document Review & Approval</h2>
								<p className="text-blue-100 text-sm mt-1">{selectedSubmission.labProjectId?.labName}</p>
							</div>
							<button
								onClick={() => setReviewModalOpen(false)}
								className="text-white hover:text-gray-100"
							>
								<span className="material-icons">close</span>
							</button>
						</div>

						{/* Modal Body */}
						<div className="p-6">
							{/* Document Information */}
							<div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
								<h3 className="font-semibold text-gray-900 mb-4">Document Information</h3>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<p className="text-xs font-semibold text-gray-500 uppercase">Document Type</p>
										<p className="mt-1 text-sm text-gray-900">{selectedSubmission.documentType}</p>
									</div>
									<div>
										<p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
										<p className="mt-1 text-sm">
											<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSubmission.status)}`}>
												{selectedSubmission.status.replace('_', ' ')}
											</span>
										</p>
									</div>
									<div>
										<p className="text-xs font-semibold text-gray-500 uppercase">Priority</p>
										<p className="mt-1 text-sm capitalize font-medium text-orange-600">{selectedSubmission.priority}</p>
									</div>
									<div>
										<p className="text-xs font-semibold text-gray-500 uppercase">Submitted</p>
										<p className="mt-1 text-sm text-gray-600">{new Date(selectedSubmission.submittedAt).toLocaleDateString()}</p>
									</div>
								</div>

								{/* Budget Information */}
								{selectedSubmission.budgetDetails && (
									<div className="mt-4 pt-4 border-t border-gray-300">
										<h4 className="font-semibold text-sm text-gray-900 mb-3">Budget Details</h4>
										<div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
											<div>
												<p className="text-gray-600">Total Project Cost</p>
												<p className="font-bold text-gray-900">${selectedSubmission.budgetDetails.totalProjectCost?.toLocaleString() || 'N/A'}</p>
											</div>
											<div>
												<p className="text-gray-600">Budget Range</p>
												<p className="font-bold text-gray-900">${selectedSubmission.budgetDetails.budgetRange?.min?.toLocaleString()} - ${selectedSubmission.budgetDetails.budgetRange?.max?.toLocaleString()}</p>
											</div>
											<div>
												<p className="text-gray-600">Within Budget</p>
												<p className={`font-bold ${selectedSubmission.budgetDetails.withinBudget ? 'text-green-600' : 'text-red-600'}`}>
													{selectedSubmission.budgetDetails.withinBudget ? '✓ Yes' : '✗ No'}
												</p>
											</div>
											<div>
												<p className="text-gray-600">Reviews Completed</p>
												<p className="font-bold text-gray-900">{selectedSubmission.reviews?.length || 0}</p>
											</div>
										</div>
									</div>
								)}

								{/* Notes from submitter */}
								{selectedSubmission.notes && (
									<div className="mt-4 pt-4 border-t border-gray-300">
										<p className="text-xs font-semibold text-gray-600 uppercase mb-2">Submitter Notes</p>
										<p className="text-sm text-gray-700 italic">"{selectedSubmission.notes}"</p>
									</div>
								)}
							</div>

							{/* Review Form */}
							<div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
								<h3 className="font-semibold text-gray-900 mb-4">Your Review</h3>

								{/* Status Selection */}
								<div className="mb-4">
									<label className="block text-sm font-medium text-gray-900 mb-2">Review Status</label>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
										{['pending_review', 'reviewed', 'approved', 'rejected'].map((status) => (
											<button
												key={status}
												onClick={() => setReviewForm({ ...reviewForm, status })}
												className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
													reviewForm.status === status
														? 'bg-blue-600 text-white'
														: 'bg-white text-gray-700 border border-gray-300'
												}`}
											>
												{status.replace('_', ' ')}
											</button>
										))}
									</div>
								</div>

								{/* Budget Verification */}
								<div className="mb-4">
									<label className="block text-sm font-medium text-gray-900 mb-2">Budget Verification</label>
									<div className="flex gap-4">
										{[true, false].map((value) => (
											<button
												key={String(value)}
												onClick={() => setReviewForm({ ...reviewForm, budget_verification_passed: value })}
												className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
													reviewForm.budget_verification_passed === value
														? value ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
														: 'bg-gray-200 text-gray-700'
												}`}
											>
												{value ? '✓ Passed' : '✗ Failed'}
											</button>
										))}
									</div>
								</div>

								{/* Comments */}
								<div className="mb-4">
									<label className="block text-sm font-medium text-gray-900 mb-2">Review Comments</label>
									<textarea
										value={reviewForm.comments}
										onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
										placeholder="Provide your detailed feedback and comments..."
										className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										rows="4"
									/>
								</div>

								{/* Audit Notes */}
								<div className="mb-4">
									<label className="block text-sm font-medium text-gray-900 mb-2">Audit Notes</label>
									<textarea
										value={reviewForm.audit_notes}
										onChange={(e) => setReviewForm({ ...reviewForm, audit_notes: e.target.value })}
										placeholder="Document any audit findings or concerns..."
										className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										rows="3"
									/>
								</div>
							</div>

							{/* Existing Reviews */}
							{selectedSubmission.reviews && selectedSubmission.reviews.length > 0 && (
								<div className="mb-6 bg-gray-100 p-4 rounded-lg border border-gray-300">
									<h3 className="font-semibold text-gray-900 mb-3">Previous Reviews</h3>
									<div className="space-y-3">
										{selectedSubmission.reviews.map((review, idx) => (
											<div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
												<div className="flex justify-between items-start mb-2">
													<div>
														<p className="font-medium text-gray-900">{review.reviewerName}</p>
														<p className="text-xs text-gray-500">{review.reviewerRole}</p>
													</div>
													<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
														review.status === 'approved' ? 'bg-green-100 text-green-800' :
														review.status === 'rejected' ? 'bg-red-100 text-red-800' :
														'bg-gray-100 text-gray-800'
													}`}>
														{review.status}
													</span>
												</div>
												{review.comments && <p className="text-sm text-gray-700 mb-2"><strong>Comments:</strong> {review.comments}</p>}
												{review.audit_notes && <p className="text-sm text-gray-700"><strong>Audit Notes:</strong> {review.audit_notes}</p>}
												<p className="text-xs text-gray-500 mt-2">{new Date(review.reviewedAt).toLocaleString()}</p>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Audit Trail */}
							{selectedSubmission.auditTrail && selectedSubmission.auditTrail.length > 0 && (
								<div className="mb-6 bg-amber-50 p-4 rounded-lg border border-amber-200">
									<h3 className="font-semibold text-gray-900 mb-3">Audit Trail</h3>
									<div className="space-y-2 text-sm">
										{selectedSubmission.auditTrail.map((entry, idx) => (
											<div key={idx} className="flex gap-2 text-gray-700">
												<span className="text-amber-600 font-medium">[{new Date(entry.performedAt).toLocaleString()}]</span>
												<span><strong>{entry.action}:</strong> {entry.details} ({entry.performedBy})</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Modal Footer */}
						<div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-2 flex-wrap">
							<button
								onClick={() => setReviewModalOpen(false)}
								className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleSubmitReview}
								disabled={isSubmitting}
								className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
							>
								{isSubmitting ? 'Submitting...' : 'Save Review'}
							</button>
							<button
								onClick={() => handleApprove('finance')}
								disabled={isSubmitting}
								className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
							>
								{isSubmitting ? 'Processing...' : 'Approve (Finance)'}
							</button>
							<button
								onClick={() => handleApprove('procurement')}
								disabled={isSubmitting}
								className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
							>
								{isSubmitting ? 'Processing...' : 'Approve (Procurement)'}
							</button>
							<button
								onClick={handleReject}
								disabled={isSubmitting}
								className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
							>
								{isSubmitting ? 'Processing...' : 'Reject'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ReviewerDashboard;
