import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PremiumPayment = () => {
	const navigate = useNavigate();
	const [billingCycle, setBillingCycle] = useState('monthly');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [pricing, setPricing] = useState(null);
	const [token, setToken] = useState(null);
	const [currentSubscription, setCurrentSubscription] = useState(null);
	const [isPremium, setIsPremium] = useState(false);
	const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

	// Get token from userInfo and check authentication
	useEffect(() => {
		try {
			const userInfo = JSON.parse(localStorage.getItem('userInfo'));
			const authToken = userInfo?.token || localStorage.getItem('token');
			
			console.log('[PREMIUM PAYMENT] Authentication check:');
			console.log('  - userInfo found:', !!userInfo);
			console.log('  - token from userInfo:', authToken ? 'Yes' : 'No');
			console.log('  - direct token found:', !!localStorage.getItem('token'));
			
			if (authToken) {
				console.log('[PREMIUM PAYMENT] ✅ Authenticated - setting token');
				setToken(authToken);
				setError(''); // Clear any previous errors
			} else {
				console.log('[PREMIUM PAYMENT] ❌ Not authenticated - redirecting to login');
				setError('Please login first to upgrade your subscription');
				// Give user time to read the message before redirecting
				const timer = setTimeout(() => navigate('/login'), 2500);
				return () => clearTimeout(timer);
			}
		} catch (err) {
			console.error('[PREMIUM PAYMENT] Error parsing userInfo:', err);
			setError('Authentication error. Please login again.');
			const timer = setTimeout(() => navigate('/login'), 2500);
			return () => clearTimeout(timer);
		}
	}, [navigate]);

	// Fetch pricing and current subscription on mount (only when token is available)
	useEffect(() => {
		if (!token) return;

		const fetchData = async () => {
			try {
				console.log('[PREMIUM PAYMENT] Fetching pricing and subscription status...');
				
				// Fetch pricing
				const pricingResponse = await axios.get(`${API_URL}/api/payment/pricing`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});
				console.log('[PREMIUM PAYMENT] Pricing fetched:', pricingResponse.data);
				setPricing(pricingResponse.data.pricing);

				// Fetch current subscription status
				const subscriptionResponse = await axios.get(`${API_URL}/api/subscription/current`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});
				console.log('[PREMIUM PAYMENT] Current subscription:', subscriptionResponse.data);
				const subscription = subscriptionResponse.data.subscription;
				setCurrentSubscription(subscription);
				setIsPremium(subscription?.planType === 'premium');
			} catch (err) {
				console.error('[PREMIUM PAYMENT] Error fetching data:', err.response?.data || err.message);
				setError(err.response?.data?.message || 'Error loading information');
			}
		};

		fetchData();
	}, [token, API_URL]);

	const getDiscount = () => {
		if (billingCycle === 'annual') {
			return '16%';
		}
		return '0%';
	};

	const getAmount = () => {
		if (!pricing) return 0;
		const premiumPricing = pricing.premium || pricing;
		if (billingCycle === 'annual') {
			return premiumPricing.annual || 0;
		}
		return premiumPricing.monthly || 0;
	};

	const getAmountForCycle = (cycle) => {
		if (!pricing) return 0;
		const premiumPricing = pricing.premium || pricing;
		return cycle === 'annual' ? (premiumPricing.annual || 0) : (premiumPricing.monthly || 0);
	};

	// Handle direct payment
	const handlePay = async () => {
		if (!token) {
			setError('Session expired. Please login again to complete the payment.');
			setTimeout(() => navigate('/login'), 1500);
			return;
		}

		if (!billingCycle) {
			setError('Please select a billing cycle before paying');
			return;
		}

		if (getAmount() === 0) {
			setError('Pricing not loaded. Please refresh the page.');
			return;
		}

		setLoading(true);
		setError('');

		try {
			console.log('[PREMIUM PAYMENT] Initiating payment...');
			console.log('[PREMIUM PAYMENT] Token:', token.substring(0, 20) + '...');
			console.log('[PREMIUM PAYMENT] Billing cycle:', billingCycle);
			console.log('[PREMIUM PAYMENT] Amount:', getAmount());

			const response = await axios.post(
				`${API_URL}/api/payment/complete/direct`,
				{
					billingCycle
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json'
					}
				}
			);

			console.log('[PREMIUM PAYMENT] Payment response:', response.data);
			setSuccess('Payment completed! Your premium subscription is now active.');
			setIsPremium(true);
			setCurrentSubscription(response.data.subscription);
			setTimeout(() => {
				navigate('/dashboard');
			}, 2000);
		} catch (err) {
			console.error('[PREMIUM PAYMENT] Payment error:', {
				status: err.response?.status,
				message: err.response?.data?.message,
				error: err.response?.data?.error,
				fullError: err.message
			});
			setError(err.response?.data?.message || err.response?.data?.error || 'Error processing payment. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">Upgrade to Premium</h1>
					<p className="text-xl text-gray-600">Get access to all premium features</p>
				</div>

				<div className="bg-white rounded-lg shadow-lg p-8">
					{/* Billing Cycle Selection */}
					<h2 className="text-2xl font-bold text-gray-900 mb-6">Select Billing Cycle</h2>
					<div className="grid grid-cols-2 gap-4 mb-8">
						<label className="relative">
							<input
								type="radio"
								value="monthly"
								checked={billingCycle === 'monthly'}
								onChange={(e) => setBillingCycle(e.target.value)}
								className="hidden"
							/>
							<div className={`p-6 border-2 rounded-lg cursor-pointer transition ${
								billingCycle === 'monthly'
									? 'border-blue-600 bg-blue-50'
									: 'border-gray-300 bg-white'
							}`}>
								<div className="font-bold text-3xl text-blue-600">${getAmountForCycle('monthly')}</div>
								<div className="text-gray-600 text-lg">per month</div>
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
							<div className={`p-6 border-2 rounded-lg cursor-pointer relative ${
								billingCycle === 'annual'
									? 'border-green-600 bg-green-50'
									: 'border-gray-300 bg-white'
							}`}>
								<div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded text-sm font-bold">
									Save {getDiscount()}
								</div>
								<div className="font-bold text-3xl text-green-600">${getAmountForCycle('annual')}</div>
								<div className="text-gray-600 text-lg">per year</div>
								<div className="text-sm text-gray-500 mt-2">Billed once yearly</div>
							</div>
						</label>
					</div>

					{/* Benefits */}
					<div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
						<h3 className="font-bold text-gray-900 mb-3">Premium Plan Benefits:</h3>
						<ul className="space-y-2 text-gray-700">
							<li>✅ Unlimited lab projects & quotations</li>
							<li>✅ Unlimited consultant hiring (all types)</li>
							<li>✅ Priority vendor visibility & search</li>
							<li>✅ Post-deployment support requests</li>
							<li>✅ Infrastructure optimization reports</li>
							<li>✅ Extended quotation validity periods</li>
							<li>✅ All export formats available</li>
							<li>✅ Document submission workflow</li>
							<li>✅ And more...</li>
						</ul>
					</div>

					{/* Pay Button */}
					<button
						onClick={handlePay}
					disabled={loading || isPremium}
					className={`w-full py-4 rounded-lg font-bold text-lg text-white transition mb-4 ${
						isPremium
							? 'bg-green-500 cursor-not-allowed'
							: loading
							? 'bg-gray-400 cursor-not-allowed'
							: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
					}`}
				>
					{isPremium ? 'You are in premium plan now' : loading ? 'Processing...' : 'Pay Now'}
				</button>

				{/* Cancel Link */}
				<button
					onClick={() => navigate('/subscription-plans')}
					disabled={loading}
					className="w-full py-2 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition"
				>
					Back to Subscription Plans
				</button>
			</div>

			{/* Messages */}
			{error && (
				<div className="mt-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
					❌ {error}
				</div>
			)}

				{success && (
					<div className="mt-8 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
						✅ {success}
					</div>
				)}
			</div>
		</div>
	);
};

export default PremiumPayment;