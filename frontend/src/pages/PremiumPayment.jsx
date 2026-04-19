import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PremiumPayment = () => {
	const navigate = useNavigate();
	const [paymentMethod, setPaymentMethod] = useState('bkash');
	const [billingCycle, setBillingCycle] = useState('monthly');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [pricing, setPricing] = useState(null);

	// Bkash form state
	const [bkashPhone, setBkashPhone] = useState('');
	const [bkashTransactionId, setBkashTransactionId] = useState('');
	const [bkashStep, setBkashStep] = useState('phone'); // phone or verify

	// Institutional billing form state
	const [institutionalData, setInstitutionalData] = useState({
		institutionName: '',
		billingDepartment: '',
		purchaseOrderNumber: '',
		costCenter: '',
		billingContact: {
			name: '',
			email: '',
			phone: ''
		}
	});

	const [paymentId, setPaymentId] = useState('');
	const [paymentHistory, setPaymentHistory] = useState([]);

	// Fetch pricing on mount
	useEffect(() => {
		const fetchPricing = async () => {
			try {
				const response = await axios.get('/api/payment/pricing', {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`
					}
				});
				setPricing(response.data.pricing);
			} catch (err) {
				console.error('Error fetching pricing:', err);
			}
		};

		const fetchPaymentHistory = async () => {
			try {
				const response = await axios.get('/api/payment/history', {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`
					},
					params: { limit: 5 }
				});
				setPaymentHistory(response.data.payments);
			} catch (err) {
				console.error('Error fetching payment history:', err);
			}
		};

		fetchPricing();
		fetchPaymentHistory();
	}, []);

	const getAmount = () => {
		if (!pricing) return 0;
		const amount = pricing.premium[billingCycle];
		return amount;
	};

	const getDiscount = () => {
		if (billingCycle === 'annual') {
			// Annual price is $999 vs monthly $99 * 12 = $1188, so 16% discount
			return '16%';
		}
		return '0%';
	};

	// Handle Bkash payment initiation
	const handleBkashInitiate = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			const response = await axios.post(
				'/api/payment/bkash/initiate',
				{
					billingCycle,
					bkashPhoneNumber: bkashPhone
				},
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`
					}
				}
			);

			setPaymentId(response.data.payment.paymentId);
			setBkashStep('verify');
			setSuccess(`Payment initiated. Instructions: ${response.data.payment.instructions}`);
		} catch (err) {
			setError(err.response?.data?.message || 'Error initiating Bkash payment');
		} finally {
			setLoading(false);
		}
	};

	// Handle Bkash verification
	const handleBkashVerify = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			const response = await axios.post(
				'/api/payment/bkash/verify',
				{
					paymentId,
					transactionId: bkashTransactionId
				},
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`
					}
				}
			);

			setSuccess('Payment verified! Your premium subscription is now active.');
			setTimeout(() => {
				navigate('/university-dashboard');
			}, 2000);
		} catch (err) {
			setError(err.response?.data?.message || 'Error verifying Bkash payment');
		} finally {
			setLoading(false);
		}
	};

	// Handle institutional billing submission
	const handleInstitutionalBilling = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		// Validate required fields
		if (!institutionalData.institutionName || !institutionalData.billingDepartment ||
			!institutionalData.billingContact.name || !institutionalData.billingContact.email) {
			setError('Please fill in all required fields');
			setLoading(false);
			return;
		}

		try {
			const response = await axios.post(
				'/api/payment/institutional-billing/initiate',
				{
					billingCycle,
					...institutionalData
				},
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`
					}
				}
			);

			setSuccess(`Institutional billing request submitted! Invoice: ${response.data.payment.invoiceNumber}`);
			setPaymentId(response.data.payment.paymentId);
			setTimeout(() => {
				navigate('/university-dashboard');
			}, 2000);
		} catch (err) {
			setError(err.response?.data?.message || 'Error submitting institutional billing request');
		} finally {
			setLoading(false);
		}
	};

	const handleInstitutionalChange = (e) => {
		const { name, value } = e.target;
		if (name.includes('contact_')) {
			const contactField = name.replace('contact_', '');
			setInstitutionalData({
				...institutionalData,
				billingContact: {
					...institutionalData.billingContact,
					[contactField]: value
				}
			});
		} else {
			setInstitutionalData({
				...institutionalData,
				[name]: value
			});
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">Upgrade to Premium</h1>
					<p className="text-xl text-gray-600">Choose your payment method and billing cycle</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left: Payment Options */}
					<div className="lg:col-span-2">
						{/* Billing Cycle Selection */}
						<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">Select Billing Cycle</h2>
							<div className="grid grid-cols-2 gap-4">
								<label className="relative">
									<input
										type="radio"
										value="monthly"
										checked={billingCycle === 'monthly'}
										onChange={(e) => setBillingCycle(e.target.value)}
										className="hidden"
									/>
									<div className={`p-4 border-2 rounded-lg cursor-pointer transition ${
										billingCycle === 'monthly'
											? 'border-blue-600 bg-blue-50'
											: 'border-gray-300 bg-white'
									}`}>
										<div className="font-bold text-lg">${getAmount()}</div>
										<div className="text-gray-600">per month</div>
										<div className="text-sm text-gray-500 mt-2">Billed monthly</div>
									</div>
								</label>

								<label className="relative">
									<input
										type="radio"
										value="annual"
										checked={billingCycle === 'annual'}
										onChange={(e) => setBillingCycle(e.target.value)}
										className="hidden"
									/>
									<div className={`p-4 border-2 rounded-lg cursor-pointer transition relative ${
										billingCycle === 'annual'
											? 'border-green-600 bg-green-50'
											: 'border-gray-300 bg-white'
									}`}>
										<div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded text-sm font-bold">
											Save {getDiscount()}
										</div>
										<div className="font-bold text-lg">${getAmount()}</div>
										<div className="text-gray-600">per year</div>
										<div className="text-sm text-gray-500 mt-2">Billed once yearly</div>
									</div>
								</label>
							</div>
						</div>

						{/* Payment Method Selection */}
						<div className="bg-white rounded-lg shadow-lg p-6">
							<h2 className="text-2xl font-bold text-gray-900 mb-6">Select Payment Method</h2>

							{/* Bkash Payment */}
							<div className="mb-8">
								<label className="flex items-center cursor-pointer mb-4">
									<input
										type="radio"
										value="bkash"
										checked={paymentMethod === 'bkash'}
										onChange={(e) => setPaymentMethod(e.target.value)}
										className="w-4 h-4"
									/>
									<span className="ml-3 text-lg font-semibold flex items-center">
										📱 Bkash
										<span className="text-sm text-gray-500 ml-2">(Mobile Banking)</span>
									</span>
								</label>

								{paymentMethod === 'bkash' && (
									<form onSubmit={bkashStep === 'phone' ? handleBkashInitiate : handleBkashVerify}
										className="bg-blue-50 p-6 rounded-lg ml-8">
										{bkashStep === 'phone' ? (
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Bkash Phone Number (01XXXXXXXXX)
												</label>
												<input
													type="tel"
													value={bkashPhone}
													onChange={(e) => setBkashPhone(e.target.value)}
													placeholder="01XXXXXXXXX"
													pattern="^01[3-9]\d{8}$"
													required
													className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												/>
												<p className="text-sm text-gray-600 mt-2">
													💡 Amount to pay: {getAmount()} BDT ({billingCycle})
												</p>
												<button
													type="submit"
													disabled={loading}
													className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
												>
													{loading ? 'Processing...' : 'Continue to Bkash'}
												</button>
											</div>
										) : (
											<div>
												<p className="text-gray-700 mb-4">
													✅ Please complete payment of {getAmount()} BDT on your Bkash app using the provided reference.
												</p>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Enter Bkash Transaction ID
												</label>
												<input
													type="text"
													value={bkashTransactionId}
													onChange={(e) => setBkashTransactionId(e.target.value)}
													placeholder="e.g., TXN123456789"
													required
													className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												/>
												<button
													type="submit"
													disabled={loading}
													className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
												>
													{loading ? 'Verifying...' : 'Verify Payment'}
												</button>
												<button
													type="button"
													onClick={() => {
														setBkashStep('phone');
														setBkashPhone('');
														setBkashTransactionId('');
														setSuccess('');
													}}
													className="mt-2 w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
												>
													Back
												</button>
											</div>
										)}
									</form>
								)}
							</div>

							{/* Institutional Billing Payment */}
							<div>
								<label className="flex items-center cursor-pointer mb-4">
									<input
										type="radio"
										value="institutional"
										checked={paymentMethod === 'institutional'}
										onChange={(e) => setPaymentMethod(e.target.value)}
										className="w-4 h-4"
									/>
									<span className="ml-3 text-lg font-semibold flex items-center">
										🏛️ Institutional Billing
										<span className="text-sm text-gray-500 ml-2">(Invoice-based)</span>
									</span>
								</label>

								{paymentMethod === 'institutional' && (
									<form onSubmit={handleInstitutionalBilling}
										className="bg-indigo-50 p-6 rounded-lg ml-8">
										<div className="space-y-4">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">
													Institution Name *
												</label>
												<input
													type="text"
													name="institutionName"
													value={institutionalData.institutionName}
													onChange={handleInstitutionalChange}
													placeholder="e.g., University of Dhaka"
													required
													className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
												/>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">
													Billing Department *
												</label>
												<input
													type="text"
													name="billingDepartment"
													value={institutionalData.billingDepartment}
													onChange={handleInstitutionalChange}
													placeholder="e.g., Finance & Procurement"
													required
													className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
												/>
											</div>

											<div className="grid grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Purchase Order Number
													</label>
													<input
														type="text"
														name="purchaseOrderNumber"
														value={institutionalData.purchaseOrderNumber}
														onChange={handleInstitutionalChange}
														placeholder="Optional - PO#"
														className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
													/>
												</div>

												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Cost Center
													</label>
													<input
														type="text"
														name="costCenter"
														value={institutionalData.costCenter}
														onChange={handleInstitutionalChange}
														placeholder="Optional - Cost center"
														className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
													/>
												</div>
											</div>

											<div className="border-t pt-4 mt-4">
												<h3 className="font-semibold text-gray-900 mb-3">Billing Contact</h3>

												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Contact Name *
													</label>
													<input
														type="text"
														name="contact_name"
														value={institutionalData.billingContact.name}
														onChange={handleInstitutionalChange}
														placeholder="Full name"
														required
														className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
													/>
												</div>

												<div className="mt-3">
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Contact Email *
													</label>
													<input
														type="email"
														name="contact_email"
														value={institutionalData.billingContact.email}
														onChange={handleInstitutionalChange}
														placeholder="email@institution.edu"
														required
														className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
													/>
												</div>

												<div className="mt-3">
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Contact Phone
													</label>
													<input
														type="tel"
														name="contact_phone"
														value={institutionalData.billingContact.phone}
														onChange={handleInstitutionalChange}
														placeholder="+880XXXXXXXXX"
														className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
													/>
												</div>
											</div>

											<p className="text-sm text-gray-600 mt-4">
												💡 Amount to pay: {getAmount()} BDT ({billingCycle})
											</p>

											<button
												type="submit"
												disabled={loading}
												className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
											>
												{loading ? 'Processing...' : 'Submit Billing Request'}
											</button>
										</div>
									</form>
								)}
							</div>
						</div>
					</div>

					{/* Right: Summary and History */}
					<div className="lg:col-span-1">
						{/* Payment Summary */}
						<div className="bg-white rounded-lg shadow-lg p-6 mb-6 sticky top-4">
							<h3 className="text-xl font-bold text-gray-900 mb-4">Payment Summary</h3>

							<div className="space-y-3 mb-6">
								<div className="flex justify-between">
									<span className="text-gray-600">Premium Plan</span>
									<span className="font-semibold">${getAmount()}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Billing Cycle</span>
									<span className="font-semibold capitalize">{billingCycle}</span>
								</div>
								{billingCycle === 'annual' && (
									<div className="flex justify-between text-green-600">
										<span>Savings (16%)</span>
										<span className="font-semibold">${(1188 - getAmount()).toFixed(0)}</span>
									</div>
								)}
								<div className="border-t pt-3 flex justify-between text-lg font-bold">
									<span>Total</span>
									<span>${getAmount()}</span>
								</div>
							</div>

							<div className="bg-green-50 border border-green-200 p-4 rounded-lg">
								<h4 className="font-semibold text-green-900 mb-2">Benefits Included:</h4>
								<ul className="text-sm text-green-800 space-y-1">
									<li>✅ Unlimited projects & quotations</li>
									<li>✅ Priority vendor visibility</li>
									<li>✅ Post-deployment support</li>
									<li>✅ Infrastructure reports</li>
									<li>✅ And 7 more premium features</li>
								</ul>
							</div>
						</div>

						{/* Recent Payments */}
						{paymentHistory.length > 0 && (
							<div className="bg-white rounded-lg shadow-lg p-6">
								<h3 className="text-lg font-bold text-gray-900 mb-4">Recent Payments</h3>
								<div className="space-y-3">
									{paymentHistory.map((payment) => (
										<div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
											<div>
												<div className="text-sm font-semibold">
													{payment.paymentMethod === 'bkash' ? '📱 Bkash' : '🏛️ Institutional'}
												</div>
												<div className="text-xs text-gray-500">
													{new Date(payment.createdAt).toLocaleDateString()}
												</div>
											</div>
											<div className="text-right">
												<div className="text-sm font-semibold">{payment.amount} BDT</div>
												<div className={`text-xs font-semibold ${
													payment.status === 'completed' ? 'text-green-600' :
													payment.status === 'pending' ? 'text-yellow-600' :
													'text-gray-600'
												}`}>
													{payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Messages */}
				{error && (
					<div className="mt-8 max-w-6xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
						❌ {error}
					</div>
				)}

				{success && (
					<div className="mt-8 max-w-6xl mx-auto bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
						✅ {success}
					</div>
				)}
			</div>
		</div>
	);
};

export default PremiumPayment;
