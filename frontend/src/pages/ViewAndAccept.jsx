import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const formatCurrency = (value) => {
	if (value === null || value === undefined || value === '') {
		return '-';
	}

	return value;
};

const ViewAndAccept = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams();
	const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

	const userInfo = JSON.parse(localStorage.getItem('userInfo'));
	const token = userInfo?.token;
	const role = userInfo?.role;

	const [quotation, setQuotation] = useState(location.state?.quotation || null);
	const [loading, setLoading] = useState(!location.state?.quotation);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [acceptanceType, setAcceptanceType] = useState('full');
	const [selectedComponents, setSelectedComponents] = useState([]);
	const [submitting, setSubmitting] = useState(false);
	const [reviewRating, setReviewRating] = useState(0);
	const [reviewComment, setReviewComment] = useState('');
	const [reviewSubmitting, setReviewSubmitting] = useState(false);
	const [reviewLoading, setReviewLoading] = useState(false);
	const [hasReview, setHasReview] = useState(false);

	useEffect(() => {
		const fetchQuotation = async () => {
			if (!params.quotationId) {
				return;
			}

			setLoading(true);
			setError('');
			try {
				const res = await axios.get(`${API_URL}/api/quotation-system/quotations/${params.quotationId}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				setQuotation(res.data);
			} catch (err) {
				setError(err.response?.data?.message || 'Failed to load quotation details');
			} finally {
				setLoading(false);
			}
		};

		if (token) {
			fetchQuotation();
		}
	}, [params.quotationId, token, API_URL]);

	useEffect(() => {
		if (acceptanceType === 'full' && quotation?.components?.length) {
			setSelectedComponents(quotation.components.map((_, index) => index));
		} else if (acceptanceType === 'partial') {
			setSelectedComponents([]);
		}
	}, [acceptanceType, quotation]);

	useEffect(() => {
		const fetchVendorReview = async () => {
			if (!quotation?._id || !token || role !== 'university' || quotation.status !== 'accepted') {
				return;
			}

			setReviewLoading(true);
			try {
				const res = await axios.get(`${API_URL}/api/quotation-system/quotations/${quotation._id}/vendor-review`, {
					headers: { Authorization: `Bearer ${token}` }
				});

				if (res.data?.review) {
					setReviewRating(Number(res.data.review.rating || 0));
					setReviewComment(res.data.review.comment || '');
					setHasReview(true);
				} else {
					setReviewRating(0);
					setReviewComment('');
					setHasReview(false);
				}
			} catch (err) {
				setHasReview(false);
			} finally {
				setReviewLoading(false);
			}
		};

		fetchVendorReview();
	}, [quotation?._id, quotation?.status, token, role, API_URL]);

	const acceptedComponents = useMemo(() => {
		if (!quotation?.components?.length) {
			return [];
		}

		if (acceptanceType === 'full') {
			return quotation.components;
		}

		return selectedComponents
			.map((index) => quotation.components[index])
			.filter(Boolean);
	}, [acceptanceType, quotation, selectedComponents]);

	const acceptedTotal = useMemo(() => {
		return acceptedComponents.reduce((sum, component) => sum + Number(component.unitPrice || 0) * Number(component.quantity || 1), 0);
	}, [acceptedComponents]);

	const toggleComponent = (index) => {
		setSelectedComponents((prev) => {
			if (prev.includes(index)) {
				return prev.filter((item) => item !== index);
			}

			return [...prev, index];
		});
	};

	const handleAccept = async () => {
		if (!quotation) {
			return;
		}

		if (quotation.status !== 'pending') {
			setError(`This quotation is already ${quotation.status || 'processed'} and cannot be accepted again.`);
			return;
		}

		if (acceptanceType === 'partial' && selectedComponents.length === 0) {
			setError('Select at least one component for partial acceptance.');
			return;
		}

		setSubmitting(true);
		setError('');
		setSuccess('');

		try {
			await axios.post(
				`${API_URL}/api/quotation-system/quotations/${quotation._id}/accept`,
				{
					acceptanceType,
					componentIndexes: acceptanceType === 'partial' ? selectedComponents : quotation.components.map((_, index) => index)
				},
				{
					headers: { Authorization: `Bearer ${token}` }
				}
			);

			setSuccess('Quotation accepted successfully.');
			setTimeout(() => navigate('/quotation-system'), 1200);
		} catch (err) {
			setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to accept quotation');
		} finally {
			setSubmitting(false);
		}
	};

	const handleSubmitReview = async () => {
		if (!quotation?._id) {
			return;
		}

		if (reviewRating < 1 || reviewRating > 5) {
			setError('Please select a rating between 1 and 5 stars.');
			return;
		}

		setReviewSubmitting(true);
		setError('');
		setSuccess('');

		try {
			const res = await axios.post(
				`${API_URL}/api/quotation-system/quotations/${quotation._id}/vendor-review`,
				{
					rating: reviewRating,
					comment: reviewComment
				},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			setSuccess(res.data?.message || 'Vendor review submitted successfully.');
			setHasReview(true);
			setQuotation((prev) => {
				if (!prev || !prev.vendorId) return prev;
				return {
					...prev,
					vendorId: {
						...prev.vendorId,
						vendorInfo: {
							...(prev.vendorId.vendorInfo || {}),
							rating: res.data?.vendorRating ?? prev.vendorId.vendorInfo?.rating
						}
					}
				};
			});
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to submit vendor review');
		} finally {
			setReviewSubmitting(false);
		}
	};

	if (!token) {
		return <div className="max-w-4xl mx-auto py-10 px-4 text-gray-600">Please log in to view quotation details.</div>;
	}

	if (loading) {
		return <div className="max-w-4xl mx-auto py-10 px-4 text-gray-600">Loading quotation details...</div>;
	}

	if (!quotation) {
		return (
			<div className="max-w-4xl mx-auto py-10 px-4">
				<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
					<p className="text-gray-600">Quotation details are not available.</p>
					<button
						type="button"
						onClick={() => navigate('/quotation-system')}
						className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
					>
						Back to Quotation System
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto py-10 px-4">
			<div className="flex items-start justify-between gap-4 flex-wrap mb-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">View & Accept</h1>
					<p className="text-gray-600 mt-1">Review the quotation in detail, then accept it fully or partially.</p>
				</div>
				<button
					type="button"
					onClick={() => navigate('/quotation-system')}
					className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
				>
					Back to Quotation System
				</button>
			</div>

			{error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</div>}
			{success && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">{success}</div>}

			<div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
				<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
					<div>
						<p className="text-sm text-gray-500">Vendor</p>
						<p className="font-semibold text-gray-900">{quotation.vendorId?.vendorInfo?.shopName || quotation.vendorId?.name || 'Vendor'}</p>
						<p className="text-sm text-gray-500">{quotation.vendorId?.email || 'No email available'}</p>
						<p className="text-sm text-yellow-600 font-semibold mt-1">Rating: {Number(quotation.vendorId?.vendorInfo?.rating || 0).toFixed(1)} / 5</p>
					</div>

					<div className="grid grid-cols-2 gap-3 text-sm">
						<div className="rounded-xl bg-gray-50 px-3 py-3">
							<p className="text-gray-500">Total Price</p>
							<p className="font-bold text-gray-900">{formatCurrency(quotation.totalPrice)}</p>
						</div>
						<div className="rounded-xl bg-gray-50 px-3 py-3">
							<p className="text-gray-500">Components</p>
							<p className="font-bold text-gray-900">{quotation.components?.length || 0}</p>
						</div>
					</div>

					<div className="space-y-3">
						<label className="block text-sm font-semibold text-gray-900">Acceptance mode</label>
						<div className="flex flex-wrap gap-3">
							<button
								type="button"
								onClick={() => setAcceptanceType('full')}
								className={`rounded-lg px-4 py-2 font-semibold border ${acceptanceType === 'full' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700'}`}
							>
								Accept Full
							</button>
							<button
								type="button"
								onClick={() => setAcceptanceType('partial')}
								className={`rounded-lg px-4 py-2 font-semibold border ${acceptanceType === 'partial' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700'}`}
							>
								Partial Accept
							</button>
						</div>
					</div>

					<div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
						<p className="text-xs uppercase tracking-wide text-gray-500">Accepted total</p>
						<p className="text-2xl font-bold text-gray-900">{acceptedTotal}</p>
					</div>

					<button
						type="button"
						onClick={handleAccept}
						disabled={submitting || quotation.status !== 'pending'}
						className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
					>
						{submitting ? 'Processing...' : 'Confirm Acceptance'}
					</button>

					{role === 'university' && quotation.status === 'accepted' && (
						<div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 space-y-3">
							<div className="flex items-center justify-between gap-3">
								<p className="text-sm font-semibold text-gray-900">Review & Rate Vendor</p>
								{reviewLoading && <span className="text-xs text-gray-500">Loading review...</span>}
							</div>
							<div className="flex items-center gap-2 flex-wrap">
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type="button"
										onClick={() => setReviewRating(star)}
										className={`text-2xl ${reviewRating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
									>
										★
									</button>
								))}
								<span className="text-sm text-gray-600 ml-1">{reviewRating ? `${reviewRating}/5` : 'Select rating'}</span>
							</div>
							<textarea
								value={reviewComment}
								onChange={(e) => setReviewComment(e.target.value)}
								rows={3}
								placeholder="Share your experience with this vendor (optional)"
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
							/>
							<button
								type="button"
								onClick={handleSubmitReview}
								disabled={reviewSubmitting || reviewLoading}
								className="w-full rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-white hover:bg-yellow-600 disabled:bg-yellow-300"
							>
								{reviewSubmitting ? 'Submitting...' : hasReview ? 'Update Review & Rating' : 'Submit Review & Rating'}
							</button>
						</div>
					)}
				</div>

				<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">Quotation Details</h2>
					<div className="space-y-3 text-sm text-gray-700 mb-6">
						<div>
							<p className="text-gray-500">Lab Project</p>
							<p className="font-semibold text-gray-900">{quotation.labProjectId?.labName || 'Lab Project'}</p>
						</div>
						<div>
							<p className="text-gray-500">Installation Included</p>
							<p className="font-semibold text-gray-900">{quotation.installationIncluded ? 'Yes' : 'No'}</p>
						</div>
						<div>
							<p className="text-gray-500">Maintenance Included</p>
							<p className="font-semibold text-gray-900">{quotation.maintenanceIncluded ? 'Yes' : 'No'}</p>
						</div>
					</div>

					{acceptanceType === 'partial' && (
						<div>
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-lg font-semibold text-gray-900">Select Components</h3>
								<p className="text-sm text-gray-500">{selectedComponents.length} selected</p>
							</div>
							<div className="space-y-3 max-h-[28rem] overflow-auto pr-1">
								{quotation.components?.map((component, index) => (
									<label key={index} className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${selectedComponents.includes(index) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
										<input
											type="checkbox"
											checked={selectedComponents.includes(index)}
											onChange={() => toggleComponent(index)}
											className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
										/>
										<div className="flex-1 text-sm">
											<p className="font-semibold text-gray-900">{component.name || 'Component'}</p>
											<p className="text-gray-500">Price: {component.unitPrice} x {component.quantity}</p>
											<p className="text-gray-500">Warranty: {component.warranty || '-'}</p>
											<p className="text-gray-500">Delivery: {component.deliveryTime || '-'}</p>
										</div>
									</label>
								))}
							</div>
						</div>
					)}

					<div className="mt-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-3">All Components</h3>
						<div className="space-y-3">
							{quotation.components?.map((component, index) => (
								<div key={index} className="rounded-xl border border-gray-200 p-4 text-sm">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="font-semibold text-gray-900">{component.name || 'Component'}</p>
											<p className="text-gray-500">Category: {component.category || '-'}</p>
										</div>
										<p className="font-semibold text-blue-700">{component.unitPrice}</p>
									</div>
									<div className="mt-3 grid grid-cols-2 gap-2 text-gray-600">
										<p>Quantity: {component.quantity}</p>
										<p>Warranty: {component.warranty || '-'}</p>
										<p className="col-span-2">Delivery: {component.deliveryTime || '-'}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ViewAndAccept;
