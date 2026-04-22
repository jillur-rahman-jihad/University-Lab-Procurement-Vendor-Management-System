import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VendorSearch = () => {
	const navigate = useNavigate();
	const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
	const token = userInfo?.token;

	const [vendors, setVendors] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [searched, setSearched] = useState(false);
	const [isPremium, setIsPremium] = useState(false);
	const [checkingSubscription, setCheckingSubscription] = useState(true);
	const [selectedVendor, setSelectedVendor] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);

	const [filters, setFilters] = useState({
		name: '',
		serviceType: '',
		minRating: ''
	});

	const SERVICE_TYPES = ['Equipment', 'Installation', 'Maintenance', 'Consulting', 'Other'];
	const RATINGS = ['All', '3+', '3.5+', '4+', '4.5+'];
	const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
	const ratedVendors = vendors.filter((v) => Number(v?.vendorInfo?.rating || 0) > 0);
	const unratedVendors = vendors.filter((v) => Number(v?.vendorInfo?.rating || 0) <= 0);

	// Check subscription on mount
	useEffect(() => {
		checkSubscriptionStatus();
	}, [token]);

	const checkSubscriptionStatus = async () => {
		try {
			const response = await axios.get(
				`${API_URL}/api/subscription/check-priority-vendors`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setIsPremium(response.data.allowed);
		} catch (err) {
			console.error('Error checking subscription:', err);
			setIsPremium(false);
		} finally {
			setCheckingSubscription(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem('userInfo');
		navigate('/login');
	};

	const handleSearch = async (e) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		setSearched(true);

		try {
			const params = new URLSearchParams();
			if (filters.name) params.append('name', filters.name);
			if (filters.serviceType) params.append('serviceType', filters.serviceType);
			if (filters.minRating && filters.minRating !== 'All') {
				params.append('rating', parseFloat(filters.minRating));
			}

			// Use priority search endpoint if premium, otherwise fall back to regular search
			const endpoint = isPremium ? 'search-vendors-priority' : 'search-vendors';
			const url = `${API_URL}/api/university/${endpoint}${params.toString() ? '?' + params.toString() : ''}`;

			const response = await axios.get(url, {
				headers: { Authorization: `Bearer ${token}` }
			});

			setVendors(response.data.vendors || []);
		} catch (err) {
			console.error('Search error:', err);
			setError('Failed to search vendors: ' + (err.response?.data?.message || err.message));
		} finally {
			setLoading(false);
		}
	};

	const handleClear = () => {
		setFilters({ name: '', serviceType: '', minRating: '' });
		setVendors([]);
		setSearched(false);
		setError(null);
	};

	if (checkingSubscription) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<p className="text-gray-500">Loading...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Navigation Bar */}
			<nav className="bg-white shadow-md p-4 flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-blue-600">Search Vendors</h1>
					{isPremium && (
						<p className="text-xs text-green-600 font-semibold mt-1">
							✓ Premium Priority Visibility Enabled
						</p>
					)}
				</div>
				<div className="flex gap-3">
					<button
						onClick={() => navigate('/dashboard')}
						className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition font-medium"
					>
						Back
					</button>
					<button
						onClick={handleLogout}
						className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
					>
						Logout
					</button>
				</div>
			</nav>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto p-6">
				{/* Search Section */}
				<div className="bg-white rounded-lg shadow p-6 mb-6">
					<h2 className="text-xl font-semibold mb-4">Find Vendors</h2>

					<form onSubmit={handleSearch} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							{/* Vendor Name */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Vendor Name
								</label>
								<input
									type="text"
									value={filters.name}
									onChange={(e) => setFilters({ ...filters, name: e.target.value })}
									placeholder="Search by name..."
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							{/* Service Type */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Service Type
								</label>
								<select
									value={filters.serviceType}
									onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="">-- All Types --</option>
									{SERVICE_TYPES.map((type) => (
										<option key={type} value={type}>
											{type}
										</option>
									))}
								</select>
							</div>

							{/* Min Rating */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Minimum Rating
								</label>
								<select
									value={filters.minRating}
									onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									{RATINGS.map((rating) => (
										<option key={rating} value={rating === 'All' ? '' : rating}>
											{rating}
										</option>
									))}
								</select>
							</div>

							{/* Buttons */}
							<div className="flex gap-2 pt-6">
								<button
									type="submit"
									disabled={loading}
									className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
								>
									{loading ? 'Searching...' : 'Search'}
								</button>
								<button
									type="button"
									onClick={handleClear}
									className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium transition"
								>
									Clear
								</button>
							</div>
						</div>
					</form>

					{error && (
						<div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
							{error}
						</div>
					)}
				</div>

				{/* Search Results */}
				<div>
					{searched && (
						<>
							{loading ? (
								<div className="text-center p-8 bg-white rounded-lg">
									<p className="text-gray-500">Loading vendors...</p>
								</div>
							) : vendors.length > 0 ? (
								<>
									<h3 className="text-lg font-semibold mb-4">
										Found {vendors.length} Vendor{vendors.length !== 1 ? 's' : ''}
										{isPremium && (
											<span className="text-sm text-green-600 font-normal ml-2">
												(Priority vendors at the top)
											</span>
										)}
									</h3>

									{/* Premium: Priority vendors section */}
									{isPremium && (
										<>
											{/* Separate into rated(priority) and unrated vendors */}
											{ratedVendors.length > 0 && (
												<div className="mb-8">
													<h4 className="text-md font-semibold text-green-700 mb-3 flex items-center gap-2">
														<span className="bg-green-100 px-3 py-1 rounded-full text-sm">
															⭐ Priority Vendors (Rated)
														</span>
													</h4>
													<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
														{ratedVendors
															.map((vendor) => (
																<VendorCard
																	key={vendor._id}
																	vendor={vendor}
																	isPremium={isPremium}
																	onViewDetails={() => {
																	setSelectedVendor(vendor);
																	setShowDetailsModal(true);
																}}
																/>
															))}
													</div>
												</div>
											)}

											{/* Other vendors */}
											{unratedVendors.length > 0 && (
												<div>
													<h4 className="text-md font-semibold text-gray-700 mb-3">
														Other Vendors
													</h4>
													<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
														{unratedVendors
															.map((vendor) => (
																<VendorCard
																	key={vendor._id}
																	vendor={vendor}
																	isPremium={isPremium}
																	onViewDetails={() => {
																	setSelectedVendor(vendor);
																	setShowDetailsModal(true);
																}}
																/>
															))}
													</div>
												</div>
											)}
										</>
									)}

									{/* Non-premium: All vendors together */}
									{!isPremium && (
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
											{vendors.map((vendor) => (
												<VendorCard
													key={vendor._id}
													vendor={vendor}
													isPremium={isPremium}
													onViewDetails={() => {
														setSelectedVendor(vendor);
														setShowDetailsModal(true);
													}}
												/>
											))}
										</div>
									)}
								</>
							) : (
								<div className="text-center p-8 bg-white rounded-lg">
									<p className="text-gray-500">No vendors found matching your criteria.</p>
									<p className="text-sm text-gray-400 mt-2">Try adjusting your filters.</p>
								</div>
							)}
						</>
					)}
				</div>

				{/* Vendor Details Modal */}
				{showDetailsModal && selectedVendor && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
							{/* Header */}
							<div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex justify-between items-center">
								<div>
									<h2 className="text-2xl font-bold">{selectedVendor.vendorInfo?.shopName || selectedVendor.name}</h2>
									<p className="text-blue-100 mt-1">Contact: {selectedVendor.name}</p>
								</div>
								<button
									onClick={() => setShowDetailsModal(false)}
									className="text-white hover:text-blue-100 font-bold text-2xl"
								>
									×
								</button>
							</div>

							{/* Content */}
							<div className="p-6 space-y-6">
								{/* Rating */}
								<div>
									<h3 className="text-lg font-semibold text-gray-800 mb-2">Rating</h3>
									<div className="flex items-center gap-3">
										<span className="text-yellow-500 text-2xl">
											{'\u2605'.repeat(Math.floor(selectedVendor.vendorInfo?.rating || 0)) + '\u2606'.repeat(5 - Math.floor(selectedVendor.vendorInfo?.rating || 0))}
										</span>
										<span className="text-lg font-semibold text-gray-700">
											{(selectedVendor.vendorInfo?.rating || 0).toFixed(1)}/5
										</span>
									</div>
								</div>

								{/* Contact Information */}
								<div className="border-t pt-6">
									<h3 className="text-lg font-semibold text-gray-800 mb-3">Contact Information</h3>
									<div className="space-y-3">
										<div>
											<p className="text-sm font-medium text-gray-600">Email</p>
											<a href={`mailto:${selectedVendor.email}`} className="text-blue-600 hover:underline text-lg">
												{selectedVendor.email}
											</a>
										</div>
										{selectedVendor.phone && (
											<div>
												<p className="text-sm font-medium text-gray-600">Phone</p>
												<p className="text-lg font-medium text-gray-800">{selectedVendor.phone}</p>
											</div>
										)}
										{selectedVendor.vendorInfo?.address && (
											<div>
												<p className="text-sm font-medium text-gray-600">Address</p>
												<p className="text-gray-800">{selectedVendor.vendorInfo.address}</p>
											</div>
										)}
									</div>
								</div>

								{/* Service Types */}
								{selectedVendor.vendorInfo?.serviceTypes && selectedVendor.vendorInfo.serviceTypes.length > 0 && (
									<div className="border-t pt-6">
										<h3 className="text-lg font-semibold text-gray-800 mb-3">Service Types</h3>
										<div className="flex flex-wrap gap-2">
											{selectedVendor.vendorInfo.serviceTypes.map((service, idx) => (
												<span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
													{service}
												</span>
											))}
										</div>
									</div>
								)}

								{/* Priority Score (Premium only) */}
								{isPremium && selectedVendor.priorityScore !== undefined && (
									<div className="border-t pt-6 bg-green-50 p-4 rounded-lg">
										<h3 className="text-lg font-semibold text-gray-800 mb-2">Premium Information</h3>
										<p className="text-gray-700 mb-2">
											Priority Score: <span className="font-bold text-green-700">{Math.round(selectedVendor.priorityScore)}/100</span>
										</p>
										{selectedVendor.isPriority ? (
											<p className="text-green-700 font-semibold">✓ Meets premium partnership standards</p>
										) : (
											<p className="text-green-700">Meets basic vendor standards</p>
										)}
									</div>
								)}

								{/* Vendor Reviews */}
								<div className="border-t pt-6">
									<h3 className="text-lg font-semibold text-gray-800 mb-3">
										Vendor Reviews {selectedVendor.vendorReviewsCount ? `(${selectedVendor.vendorReviewsCount})` : ''}
									</h3>
									{selectedVendor.vendorReviews && selectedVendor.vendorReviews.length > 0 ? (
										<div className="space-y-3 max-h-72 overflow-auto pr-1">
											{selectedVendor.vendorReviews.map((review) => (
												<div key={review._id} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
													<div className="flex items-center justify-between gap-3">
														<p className="font-semibold text-gray-900">{review.reviewerName}</p>
														<p className="text-yellow-600 font-semibold">{Number(review.rating || 0).toFixed(1)} ★</p>
													</div>
													<p className="text-sm text-gray-600 mt-1">{review.labName}</p>
													<p className="text-sm text-gray-700 mt-2">{review.comment || 'No comment provided.'}</p>
													<p className="text-xs text-gray-500 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
												</div>
											))}
										</div>
									) : (
										<p className="text-sm text-gray-500">No vendor reviews available yet.</p>
									)}
								</div>
							</div>

							{/* Footer */}
							<div className="border-t p-6 bg-gray-50">
								<button
									onClick={() => setShowDetailsModal(false)}
									className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

/**
 * Vendor Card Component
 */
const VendorCard = ({ vendor, isPremium, onViewDetails }) => {
	const rating = vendor.vendorInfo?.rating || 0;
	const ratingStars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
	const reviewsCount = Number(vendor.vendorReviewsCount || 0);

	return (
		<div
			className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all ${
				isPremium && vendor.isPriority ? 'border-2 border-green-500 bg-green-50' : 'bg-white border border-gray-200'
			}`}
		>
			{/* Priority Badge */}
			{isPremium && vendor.isPriority && (
				<div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-sm font-semibold">
					⭐ Priority Partner
				</div>
			)}

			{/* Content */}
			<div className="p-4">
				{/* Shop Name */}
				<h3 className="text-lg font-semibold text-gray-800 mb-2">
					{vendor.vendorInfo?.shopName || vendor.name}
				</h3>

				{/* Contact Name */}
				<p className="text-sm text-gray-600 mb-3">
					Contact: <span className="font-medium">{vendor.name}</span>
				</p>

				{/* Email and Phone */}
				<div className="space-y-1 mb-3 text-sm">
					<p className="text-gray-600">
						📧 <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:underline">
							{vendor.email}
						</a>
					</p>
					{vendor.phone && (
						<p className="text-gray-600">
							📱 <span className="font-medium">{vendor.phone}</span>
						</p>
					)}
				</div>

				{/* Rating */}
				<div className="mb-3">
					<div className="flex items-center gap-2">
						<span className="text-yellow-500 text-lg">{ratingStars}</span>
						<span className="text-sm font-semibold text-gray-700">
							{rating.toFixed(1)}/5
						</span>
					</div>
					<p className="text-xs text-gray-500 mt-1">{reviewsCount} review{reviewsCount !== 1 ? 's' : ''}</p>
				</div>

				{/* Verified Badge */}
				{vendor.vendorInfo?.isVerified && (
					<div className="mb-3">
						<span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
							✓ Verified
						</span>
					</div>
				)}

				{/* Priority Score Info (Premium only) */}
				{isPremium && vendor.priorityScore !== undefined && (
					<div className="mb-3 p-2 bg-gray-100 rounded text-xs">
						<p className="text-gray-600">
							Priority Score: <span className="font-bold">{Math.round(vendor.priorityScore)}/100</span>
						</p>
						<p className="text-gray-500 text-xs mt-1">
							{vendor.isPriority
								? '✓ Meets premium partnership standards'
								: 'Meets basic vendor standards'}
						</p>
					</div>
				)}

				{/* Action Button */}
				<button
					onClick={onViewDetails}
					className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
				>
					View Details
				</button>
			</div>
		</div>
	);
};

export default VendorSearch;
