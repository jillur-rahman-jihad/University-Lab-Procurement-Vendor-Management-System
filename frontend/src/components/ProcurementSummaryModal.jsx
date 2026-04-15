import React, { useState, useEffect } from 'react';

const ProcurementSummaryModal = ({ isOpen, projectId, onClose, userToken }) => {
	const [summary, setSummary] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (isOpen && projectId) {
			fetchProcurementSummary();
		}
	}, [isOpen, projectId]);

	const fetchProcurementSummary = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await fetch(`http://localhost:5001/api/university/procurement/${projectId}`, {
				headers: {
					'Authorization': `Bearer ${userToken}`,
				},
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || `Error ${response.status}: Failed to fetch procurement summary`);
			}

			setSummary(data);
		} catch (err) {
			console.error('Procurement fetch error:', err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
					<h2 className="text-xl font-semibold text-gray-900">Procurement Summary</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 text-2xl"
					>
						×
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{loading ? (
						<div className="text-center py-8 text-gray-500">Loading...</div>
					) : error ? (
						<div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-sm">
							<p className="font-medium">No procurement data yet</p>
							<p className="mt-1 text-xs text-yellow-700">{error}</p>
							<p className="mt-3 text-xs leading-relaxed text-yellow-700">
								Procurement data will be available after you accept a quotation and complete the procurement process.
							</p>
						</div>
					) : summary ? (
						<div className="space-y-6">
							{/* Project Details */}
							<div>
								<h3 className="text-lg font-semibold text-gray-900 mb-3">Project Details</h3>
								<div className="bg-gray-50 p-4 rounded-lg space-y-2">
									<div className="flex justify-between">
										<span className="text-sm font-medium text-gray-600">Lab Name:</span>
										<span className="text-sm text-gray-900">{summary.projectDetails?.labName}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm font-medium text-gray-600">Lab Type:</span>
										<span className="text-sm text-gray-900">{summary.projectDetails?.labType}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm font-medium text-gray-600">Status:</span>
										<span className="text-sm text-gray-900 capitalize">{summary.projectDetails?.status}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm font-medium text-gray-600">Created:</span>
										<span className="text-sm text-gray-900">{new Date(summary.projectDetails?.createdAt).toLocaleDateString()}</span>
									</div>
								</div>
							</div>

							{/* Quotation Details */}
							{summary.quotationDetails && (
								<div>
									<h3 className="text-lg font-semibold text-gray-900 mb-3">Quotation Details</h3>
									<div className="bg-gray-50 p-4 rounded-lg space-y-2">
										<div className="flex justify-between">
											<span className="text-sm font-medium text-gray-600">Total Price:</span>
											<span className="text-sm font-semibold text-gray-900">${summary.quotationDetails?.totalPrice?.toLocaleString()}</span>
										</div>
										{summary.quotationDetails?.bulkDiscount > 0 && (
											<div className="flex justify-between">
												<span className="text-sm font-medium text-gray-600">Bulk Discount:</span>
												<span className="text-sm text-gray-900">${summary.quotationDetails?.bulkDiscount?.toLocaleString()}</span>
											</div>
										)}
										<div className="flex justify-between">
											<span className="text-sm font-medium text-gray-600">Installation Included:</span>
											<span className="text-sm text-gray-900">{summary.quotationDetails?.installationIncluded ? 'Yes' : 'No'}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm font-medium text-gray-600">Maintenance Included:</span>
											<span className="text-sm text-gray-900">{summary.quotationDetails?.maintenanceIncluded ? 'Yes' : 'No'}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm font-medium text-gray-600">Quotation Status:</span>
											<span className="text-sm capitalize text-gray-900">{summary.quotationDetails?.status}</span>
										</div>
									</div>
								</div>
							)}

							{/* Selected Vendors */}
							{summary.selectedVendors && summary.selectedVendors.length > 0 && (
								<div>
									<h3 className="text-lg font-semibold text-gray-900 mb-3">Selected Vendors</h3>
									<div className="space-y-2">
										{summary.selectedVendors.map((vendor) => (
											<div key={vendor._id} className="bg-gray-50 p-4 rounded-lg">
												<p className="text-sm font-medium text-gray-900">{vendor.name}</p>
												<p className="text-sm text-gray-600">{vendor.email}</p>
												<p className="text-sm text-gray-600">{vendor.phone}</p>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Accepted Components */}
							{summary.acceptedComponents && summary.acceptedComponents.length > 0 && (
								<div>
									<h3 className="text-lg font-semibold text-gray-900 mb-3">Accepted Components</h3>
									<div className="overflow-x-auto">
										<table className="min-w-full divide-y divide-gray-200 border border-gray-200">
											<thead className="bg-gray-50">
												<tr>
													<th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Component</th>
													<th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
													<th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">Qty</th>
													<th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">Unit Price</th>
													<th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Warranty</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-gray-200">
												{summary.acceptedComponents.map((comp, idx) => (
													<tr key={idx}>
														<td className="px-4 py-2 text-sm text-gray-900">{comp.name}</td>
														<td className="px-4 py-2 text-sm text-gray-600">{comp.category}</td>
														<td className="px-4 py-2 text-sm text-right text-gray-900">{comp.quantity}</td>
														<td className="px-4 py-2 text-sm text-right text-gray-900">${comp.unitPrice?.toLocaleString()}</td>
														<td className="px-4 py-2 text-sm text-gray-600">{comp.warranty}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							)}

							{/* Procurement Summary */}
							<div>
								<h3 className="text-lg font-semibold text-gray-900 mb-3">Procurement Summary</h3>
								<div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
									<div className="flex justify-between">
										<span className="text-sm font-medium text-gray-600">Acceptance Type:</span>
										<span className="text-sm capitalize font-semibold text-gray-900">{summary.acceptanceType}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm font-medium text-gray-600">Final Cost:</span>
										<span className="text-lg font-semibold text-blue-600">${summary.finalCost?.toLocaleString()}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm font-medium text-gray-600">Admin Approval:</span>
										<span className="text-sm">
											{summary.approvedByAdmin ? (
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>
											) : (
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
											)}
										</span>
									</div>
								</div>
							</div>
						</div>
					) : null}
				</div>

				{/* Footer */}
				<div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded-md text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 transition-colors"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

export default ProcurementSummaryModal;
