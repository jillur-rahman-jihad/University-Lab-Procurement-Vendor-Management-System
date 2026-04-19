import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriptionPlans = () => {
	const navigate = useNavigate();
	const userInfo = JSON.parse(localStorage.getItem('userInfo'));
	const [currentSubscription, setCurrentSubscription] = useState(null);
	const [planLimits, setPlanLimits] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Fetch current subscription and limits
		const fetchSubscriptionData = async () => {
			try {
				const [subResponse, limitsResponse] = await Promise.all([
					fetch('http://localhost:5001/api/subscription/current', {
						headers: {
							'Authorization': `Bearer ${userInfo?.token}`,
						},
					}),
					fetch('http://localhost:5001/api/subscription/limits', {
						headers: {
							'Authorization': `Bearer ${userInfo?.token}`,
						},
					})
				]);

				if (subResponse.ok) {
					const subData = await subResponse.json();
					setCurrentSubscription(subData.subscription);
				}

				if (limitsResponse.ok) {
					const limitsData = await limitsResponse.json();
					setPlanLimits(limitsData);
				}
			} catch (err) {
				console.error('Error fetching subscription data:', err);
			} finally {
				setLoading(false);
			}
		};

		if (userInfo?.token) {
			fetchSubscriptionData();
		}
	}, [userInfo?.token]);

	if (!userInfo) {
		navigate('/login');
		return null;
	}

	return (
		<div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			<div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
				{/* Header */}
				<div className="px-6 py-5 sm:px-8 border-b border-gray-100 bg-gradient-to-r from-amber-600 to-amber-700">
					<div className="flex justify-between items-center">
						<div>
							<h1 className="text-3xl font-bold text-white">Subscription Plans</h1>
							<p className="text-amber-100 mt-1">Choose the perfect plan for your university</p>
						</div>
						<button
							onClick={() => navigate('/dashboard')}
							className="px-4 py-2 rounded-md text-sm font-medium text-white bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
						>
							Back
						</button>
					</div>
				</div>

				{/* Current Subscription Info */}
				{currentSubscription && (
					<div className="px-6 py-4 sm:px-8 border-b border-gray-100 bg-blue-50">
						<p className="text-sm text-blue-900">
							<strong>Current Plan:</strong> {currentSubscription.planType === 'free' ? 'Free Plan' : 'Premium Plan'}
							{currentSubscription.expiryDate && (
								<> • Expires on {new Date(currentSubscription.expiryDate).toLocaleDateString()}</>
							)}
						</p>
					</div>
				)}

						{/* Plan Usage Info - Free Plan Only */}
						{loading ? (
							<div className="p-8 text-center text-gray-500">Loading plans...</div>
						) : (
							<>
								{planLimits && planLimits.currentPlan === 'free' && (
									<div className="px-6 py-6 sm:px-8 border-b border-gray-100 bg-amber-50">
										<h3 className="text-lg font-semibold text-amber-900 mb-4">Your Free Plan Limits</h3>
										<div className="grid md:grid-cols-4 gap-4">
											<div className="bg-white rounded-lg p-4 border border-amber-200">
												<p className="text-sm text-gray-600">Max Lab Projects</p>
												<p className="text-2xl font-bold text-amber-600">{planLimits.limits.maxLabProjects}</p>
												<p className="text-xs text-gray-500 mt-1">can create</p>
											</div>
											<div className="bg-white rounded-lg p-4 border border-amber-200">
												<p className="text-sm text-gray-600">Max Quotations</p>
												<p className="text-2xl font-bold text-amber-600">{planLimits.limits.maxQuotationsPerProject}</p>
												<p className="text-xs text-gray-500 mt-1">per project</p>
											</div>
											<div className="bg-white rounded-lg p-4 border border-amber-200">
												<p className="text-sm text-gray-600">Max Vendors</p>
												<p className="text-2xl font-bold text-amber-600">{planLimits.limits.maxVendorsPerRequest}</p>
												<p className="text-xs text-gray-500 mt-1">per request</p>
											</div>
											<div className="bg-white rounded-lg p-4 border border-amber-200">
												<p className="text-sm text-gray-600">Max Consultants</p>
												<p className="text-2xl font-bold text-amber-600">{planLimits.limits.maxConsultantsToHire}</p>
												<p className="text-xs text-gray-500 mt-1">can hire</p>
											</div>
										</div>
									</div>
								)}

								{/* Subscription Plans Grid */}
						<div className="grid md:grid-cols-2 gap-8 p-6 sm:p-8">
							{/* Free Plan */}
							<div className="border-2 border-gray-300 rounded-xl p-6 hover:shadow-lg transition-all">
								<div className="mb-6">
									<h2 className="text-2xl font-bold text-gray-900">Free Plan</h2>
									<p className="text-gray-600 text-sm mt-1">Perfect for getting started</p>
								</div>

								<div className="mb-6">
									<div className="text-4xl font-bold text-gray-900">
										$0
										<span className="text-lg font-normal text-gray-600">/month</span>
									</div>
								</div>

							{/* Quotation Restrictions Box */}
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
								<h3 className="text-sm font-bold text-red-900 mb-3">Free Plan Limits:</h3>
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<span className="text-red-600 font-bold">•</span>
										<p className="text-sm text-red-800">Create max <strong>10 lab projects</strong></p>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-red-600 font-bold">•</span>
										<p className="text-sm text-red-800"><strong>Max 10 quotations</strong> per project</p>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-red-600 font-bold">•</span>
										<p className="text-sm text-red-800"><strong>Max 5 vendors</strong> per request</p>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-red-600 font-bold">•</span>
										<p className="text-sm text-red-800">Quotations expire after <strong>30 days</strong></p>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-red-600 font-bold">•</span>
										<p className="text-sm text-red-800">Hire max <strong>5 consultants</strong></p>
									</div>
								</div>
							</div>

							<div className="space-y-3 mb-6">
								<div className="flex items-start gap-3">
									<span className="text-green-600 font-bold text-lg">✓</span>
									<div>
										<p className="font-medium text-gray-900">Create Lab Projects</p>
										<p className="text-sm text-gray-600">Create and manage up to 10 lab projects</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<span className="text-green-600 font-bold text-lg">✓</span>
									<div>
										<p className="font-medium text-gray-900">Receive Vendor Quotations</p>
										<p className="text-sm text-gray-600">Request and receive quotations from vendors</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<span className="text-green-600 font-bold text-lg">✓</span>
									<div>
										<p className="font-medium text-gray-900">Hire General Consultants</p>
										<p className="text-sm text-gray-600">Hire up to 5 consultants for project guidance</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<span className="text-green-600 font-bold text-lg">✓</span>
									<div>
										<p className="font-medium text-gray-900">Limited Consultant Search</p>
										<p className="text-sm text-gray-600">Search consultants with basic filters</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<span className="text-green-600 font-bold text-lg">✓</span>
									<div>
										<p className="font-medium text-gray-900">JSON Export Only</p>
										<p className="text-sm text-gray-600">Export project data as JSON format</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<span className="text-gray-400 font-bold text-lg">✗</span>
									<div>
										<p className="font-medium text-gray-500">PDF & CSV Exports</p>
										<p className="text-sm text-gray-400">Not available in Free Plan</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<span className="text-gray-400 font-bold text-lg">✗</span>
									<div>
										<p className="font-medium text-gray-500">Priority Support</p>
										<p className="text-sm text-gray-400">Not available in Free Plan</p>
									</div>
								</div>
							</div>

								<button
									disabled={currentSubscription?.planType === 'free'}
									className={`w-full py-3 rounded-lg font-medium transition-colors ${
										currentSubscription?.planType === 'free'
											? 'bg-gray-200 text-gray-600 cursor-not-allowed'
											: 'bg-gray-600 text-white hover:bg-gray-700'
									}`}
								>
									{currentSubscription?.planType === 'free' ? 'Current Plan' : 'Switch to Free'}
								</button>
							</div>

							{/* Premium Plan */}
							<div className="border-2 border-amber-400 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all relative bg-gradient-to-br from-amber-50 to-white">
								<div className="absolute top-0 right-0 bg-amber-600 text-white px-4 py-1 rounded-bl-lg text-xs font-bold">
									POPULAR
								</div>

								<div className="mb-6">
									<h2 className="text-2xl font-bold text-gray-900">Premium Plan</h2>
									<p className="text-gray-600 text-sm mt-1">Everything you need to succeed</p>
								</div>

								<div className="mb-6">
									<div className="text-4xl font-bold text-amber-600">
										$99
										<span className="text-lg font-normal text-gray-600">/month</span>
									</div>
									<p className="text-sm text-gray-600 mt-2">or $999/year (save 16%)</p>
								</div>

								<div className="space-y-3 mb-6">
									<div className="flex items-start gap-3">
										<span className="text-amber-600 font-bold text-lg">✓</span>
										<div>
											<p className="font-medium text-gray-900">Unlimited Lab Projects</p>
											<p className="text-sm text-gray-600">Create and manage unlimited lab projects</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<span className="text-amber-600 font-bold text-lg">✓</span>
										<div>
											<p className="font-medium text-gray-900">Unlimited Quotations</p>
											<p className="text-sm text-gray-600">Receive unlimited quotations with 90-day validity</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<span className="text-amber-600 font-bold text-lg">✓</span>
										<div>
											<p className="font-medium text-gray-900">Unlimited Vendors</p>
											<p className="text-sm text-gray-600">Request quotations from unlimited vendors</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<span className="text-amber-600 font-bold text-lg">✓</span>
										<div>
											<p className="font-medium text-gray-900">All Export Formats</p>
											<p className="text-sm text-gray-600">JSON, PDF, CSV, and Procurement Reports</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<span className="text-amber-600 font-bold text-lg">✓</span>
										<div>
											<p className="font-medium text-gray-900">Advanced Consultant Search</p>
											<p className="text-sm text-gray-600">Search with advanced filters & rankings</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<span className="text-amber-600 font-bold text-lg">✓</span>
										<div>
											<p className="font-medium text-gray-900">Document Submission & Approval</p>
											<p className="text-sm text-gray-600">Full workflow with Finance/Procurement review</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<span className="text-amber-600 font-bold text-lg">✓</span>
										<div>
											<p className="font-medium text-gray-900">Priority Support</p>
											<p className="text-sm text-gray-600">24/7 priority email and chat support</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<span className="text-amber-600 font-bold text-lg">✓</span>
										<div>
											<p className="font-medium text-gray-900">Advanced Analytics</p>
											<p className="text-sm text-gray-600">Detailed insights and reporting</p>
										</div>
									</div>
								</div>

								<button
									disabled={currentSubscription?.planType === 'premium'}
									className={`w-full py-3 rounded-lg font-medium transition-colors ${
										currentSubscription?.planType === 'premium'
											? 'bg-amber-200 text-amber-900 cursor-not-allowed'
											: 'bg-amber-600 text-white hover:bg-amber-700'
									}`}
								>
									{currentSubscription?.planType === 'premium' ? 'Current Plan' : 'Upgrade to Premium'}
								</button>
							</div>
						</div>
					</>
				)}

				{/* FAQ Section */}
				<div className="px-6 py-8 sm:px-8 border-t border-gray-100 bg-gray-50">
					<h3 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>

					<div className="space-y-6">
						<div>
							<h4 className="font-semibold text-gray-900 mb-2">What are the Free Plan limits?</h4>
							<p className="text-gray-600 text-sm">
								Free Plan allows you to create up to 10 lab projects, receive up to 10 quotations per project (max 5 vendors per request with 30-day validity), and hire up to 5 general consultants for project guidance.
							</p>
						</div>

						<div>
							<h4 className="font-semibold text-gray-900 mb-2">Can I change my plan anytime?</h4>
							<p className="text-gray-600 text-sm">
								Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
							</p>
						</div>

						<div>
							<h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
							<p className="text-gray-600 text-sm">
								We accept all major credit cards, debit cards, and bank transfers through our secure payment gateway.
							</p>
						</div>

						<div>
							<h4 className="font-semibold text-gray-900 mb-2">Is there a free trial for Premium Plan?</h4>
							<p className="text-gray-600 text-sm">
								Yes! You get a 14-day free trial of the Premium Plan. No credit card required. Cancel anytime.
							</p>
						</div>

						<div>
							<h4 className="font-semibold text-gray-900 mb-2">What happens if I reach my project/consultant limits?</h4>
							<p className="text-gray-600 text-sm">
								When you reach the Free Plan limits, you'll be unable to create more lab projects or hire more consultants until you upgrade to Premium Plan.
							</p>
						</div>

						<div>
							<h4 className="font-semibold text-gray-900 mb-2">Do you offer annual discounts?</h4>
							<p className="text-gray-600 text-sm">
								Yes! Save 16% when you pay annually ($999/year instead of $1,188/year with monthly billing).
							</p>
						</div>
					</div>
				</div>

				{/* Contact Section */}
				<div className="px-6 py-8 sm:px-8 bg-blue-50 border-t border-gray-100">
					<div className="text-center">
						<h3 className="text-lg font-bold text-gray-900 mb-2">Need Help Choosing a Plan?</h3>
						<p className="text-gray-600 mb-4">
							Our team is ready to help you find the perfect plan for your university.
						</p>
						<a
							href="mailto:support@university.edu"
							className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
						>
							Contact Sales
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SubscriptionPlans;
