import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const blankComponent = {
	category: 'CPU',
	name: '',
	unitPrice: '',
	quantity: 1,
	warranty: '',
	deliveryTime: ''
};

function QuotationSystem() {
	const navigate = useNavigate();
	const userInfo = JSON.parse(localStorage.getItem('userInfo'));
	let token = null;
	let role = null;

	if (userInfo) {
		token = userInfo.token;
		role = userInfo.role;
	}

	const [labs, setLabs] = useState([]);
	const [selectedLab, setSelectedLab] = useState(null);
	const [labDetails, setLabDetails] = useState(null);
	const [quotations, setQuotations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [editingQuotationId, setEditingQuotationId] = useState(null);
	const [components, setComponents] = useState([blankComponent]);
	const [bulkDiscount, setBulkDiscount] = useState('');
	const [installationIncluded, setInstallationIncluded] = useState(false);
	const [maintenanceIncluded, setMaintenanceIncluded] = useState(false);
	const [selectedQuotations, setSelectedQuotations] = useState([]);
	const [compareError, setCompareError] = useState('');

	useEffect(function () {
		async function fetchLabs() {
			setLoading(true);
			setError('');
			try {
				const res = await axios.get('http://localhost:5001/api/quotation-system/labs', {
					headers: { Authorization: `Bearer ${token}` }
				});
				setLabs(res.data || []);
				if (res.data && res.data.length > 0) {
					setSelectedLab(res.data[0]);
				}
			} catch (err) {
				if (err.response && err.response.data && err.response.data.message) {
					setError(err.response.data.message);
				} else {
					setError('Failed to load quotation system');
				}
			} finally {
				setLoading(false);
			}
		}

		if (token) {
			fetchLabs();
		}
	}, [token]);

	useEffect(function () {
		async function fetchLabDetails() {
			if (!selectedLab || !selectedLab._id) {
				return;
			}

			setLoadingDetails(true);
			setError('');
			try {
				const labPromise = axios.get(`http://localhost:5001/api/quotation-system/labs/${selectedLab._id}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				const quotationPromise = axios.get(`http://localhost:5001/api/quotation-system/labs/${selectedLab._id}/quotations`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				const labRes = await labPromise;
				const quotationRes = await quotationPromise;

				setLabDetails(labRes.data);
				setQuotations(quotationRes.data || []);

				if (role === 'vendor') {
					let myQuotation = null;

					if (quotationRes.data && quotationRes.data.length > 0) {
						myQuotation = quotationRes.data[0];
					}
					if (myQuotation) {
						setEditingQuotationId(myQuotation._id);
						if (myQuotation.components && myQuotation.components.length > 0) {
							setComponents(myQuotation.components);
						} else {
							setComponents([blankComponent]);
						}
						if (myQuotation.bulkDiscount !== undefined && myQuotation.bulkDiscount !== null) {
							setBulkDiscount(myQuotation.bulkDiscount);
						} else {
							setBulkDiscount('');
						}
						setInstallationIncluded(Boolean(myQuotation.installationIncluded));
						setMaintenanceIncluded(Boolean(myQuotation.maintenanceIncluded));
					} else {
						setEditingQuotationId(null);
						setComponents([blankComponent]);
						setBulkDiscount('');
						setInstallationIncluded(false);
						setMaintenanceIncluded(false);
					}
				}
			} catch (err) {
				if (err.response && err.response.data && err.response.data.message) {
					setError(err.response.data.message);
				} else {
					setError('Failed to load lab details');
				}
			} finally {
				setLoadingDetails(false);
			}
		}

		if (token && selectedLab) {
			fetchLabDetails();
		}
	}, [selectedLab, token, role]);

	useEffect(function () {
		setSelectedQuotations([]);
		setCompareError('');
	}, [selectedLab && selectedLab._id]);

	const totalPrice = useMemo(function () {
		return components.reduce(function (sum, component) {
			const unitPrice = Number(component.unitPrice || 0);
			const quantity = Number(component.quantity || 1);
			return sum + unitPrice * quantity;
		}, 0);
	}, [components]);

	const bestQuotation = useMemo(function () {
		if (role !== 'university' || quotations.length === 0) {
			return null;
		}

		return quotations.reduce(function (currentBest, quotation) {
			if (!currentBest) {
				return quotation;
			}

			let currentBestPrice = Number.POSITIVE_INFINITY;
			let quotationPrice = Number.POSITIVE_INFINITY;

			if (currentBest.totalPrice !== undefined && currentBest.totalPrice !== null) {
				currentBestPrice = Number(currentBest.totalPrice);
			}

			if (quotation.totalPrice !== undefined && quotation.totalPrice !== null) {
				quotationPrice = Number(quotation.totalPrice);
			}

			if (quotationPrice < currentBestPrice) {
				return quotation;
			}

			return currentBest;
		}, null);
	}, [quotations, role]);

	function updateComponent(index, key, value) {
		setComponents(function (prev) {
			return prev.map(function (component, componentIndex) {
				if (componentIndex === index) {
					return { ...component, [key]: value };
				}

				return component;
			});
		});
	}

	function addComponent() {
		setComponents(function (prev) {
			return [...prev, { ...blankComponent }];
		});
	}

	function removeComponent(index) {
		setComponents(function (prev) {
			if (prev.length === 1) {
				return prev;
			}

			return prev.filter(function (_, componentIndex) {
				return componentIndex !== index;
			});
		});
	}

	function toggleQuotationSelection(quotation) {
		setCompareError('');
		setSelectedQuotations(function (prev) {
			if (prev.some(function (item) { return item._id === quotation._id; })) {
				return prev.filter(function (item) {
					return item._id !== quotation._id;
				});
			}

			if (prev.length >= 2) {
				setCompareError('Please select only two quotations for comparison.');
				return prev;
			}

			return [...prev, quotation];
		});
	}

	function compareSelectedQuotations() {
		if (selectedQuotations.length !== 2) {
			setCompareError('Please select exactly two quotations to compare.');
			return;
		}

		const comparisonData = {
			selectedLab,
			quotations: selectedQuotations
		};

		sessionStorage.setItem('quotationComparisonData', JSON.stringify(comparisonData));
		navigate('/compare-quotation', { state: comparisonData });
	}

	async function submitQuotation(event) {
		event.preventDefault();
		setError('');
		setSuccess('');

		try {
			const payload = {
				labProjectId: selectedLab._id,
				components,
				totalPrice,
				bulkDiscount: Number(bulkDiscount || 0),
				installationIncluded,
				maintenanceIncluded
			};

			if (editingQuotationId) {
				await axios.put(`http://localhost:5001/api/quotation-system/quotations/${editingQuotationId}`, payload, {
					headers: { Authorization: `Bearer ${token}` }
				});
				setSuccess('Quotation updated successfully.');
			} else {
				await axios.post('http://localhost:5001/api/quotation-system/quotations', payload, {
					headers: { Authorization: `Bearer ${token}` }
				});
				setSuccess('Quotation submitted successfully.');
			}
		} catch (err) {
			if (err.response && err.response.data && err.response.data.message) {
				setError(err.response.data.message);
			} else {
				setError('Failed to submit quotation');
			}
		}
	}

	if (!token) {
		return (
			<div className="max-w-5xl mx-auto py-10 px-4">
				<p className="text-gray-600">Please log in to access the quotation system.</p>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto py-10 px-4">
			<div className="flex items-start justify-between gap-4 flex-wrap mb-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Quotation System</h1>
					<p className="text-gray-600 mt-1">
						{role === 'vendor'
							? 'Review available lab projects and submit your offer.'
							: 'Review your lab projects and inspect vendor quotations.'}
					</p>
				</div>
				<button
					onClick={() => navigate('/dashboard')}
					className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
				>
					Back to Dashboard
				</button>
			</div>

			{error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</div>}
			{success && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">{success}</div>}

			<div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
				<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-semibold text-gray-900">Lab Projects</h2>
						<span className="text-sm text-gray-500">{labs.length} found</span>
					</div>

					{loading ? (
						<p className="text-gray-500">Loading lab projects...</p>
					) : labs.length === 0 ? (
						<p className="text-gray-500">No lab projects available right now.</p>
					) : (
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
							{labs.map((lab) => (
								<button
									key={lab._id}
									type="button"
									onClick={() => setSelectedLab(lab)}
									className={`text-left rounded-xl border p-4 transition hover:shadow-md ${
										selectedLab?._id === lab._id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
									}`}
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">{lab.labType || 'Lab'}</p>
											<h3 className="mt-1 font-bold text-gray-900">{lab.labName}</h3>
										</div>
									</div>

									<div className="mt-3 space-y-1 text-sm text-gray-600">
										<p><span className="font-medium text-gray-800">University:</span> {lab.universityName}</p>
										<p><span className="font-medium text-gray-800">Min Budget:</span> {lab.minBudget}</p>
										<p><span className="font-medium text-gray-800">Max Budget:</span> {lab.maxBudget}</p>
									</div>
								</button>
							))}
						</div>
					)}
				</div>

				<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h2>

					{loadingDetails ? (
						<p className="text-gray-500">Loading details...</p>
					) : !labDetails ? (
						<p className="text-gray-500">Select a lab project to view details.</p>
					) : (
						<div className="space-y-5">
							<div>
								<p className="text-sm text-gray-500">Lab Name</p>
								<p className="font-semibold text-gray-900">{labDetails.labName}</p>
							</div>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<p className="text-gray-500">University</p>
									<p className="font-medium text-gray-900">{labDetails.universityName}</p>
								</div>
								<div>
									<p className="text-gray-500">Type</p>
									<p className="font-medium text-gray-900">{labDetails.labType}</p>
								</div>
								<div>
									<p className="text-gray-500">Min Budget</p>
									<p className="font-medium text-gray-900">{labDetails.minBudget}</p>
								</div>
								<div>
									<p className="text-gray-500">Max Budget</p>
									<p className="font-medium text-gray-900">{labDetails.maxBudget}</p>
								</div>
							</div>

							<div>
								<p className="text-sm text-gray-500 mb-1">Main Requirement</p>
								<p className="text-sm text-gray-700 leading-7">{labDetails.requirements?.mainRequirement || 'No requirement provided.'}</p>
							</div>

							<div>
								<p className="text-sm text-gray-500 mb-2">Software</p>
								<div className="flex flex-wrap gap-2">
									{(labDetails.requirements?.software || []).length > 0 ? (
										labDetails.requirements.software.map((item, index) => (
											<span key={index} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
												{item}
											</span>
										))
									) : (
										<p className="text-sm text-gray-500">No software list available.</p>
									)}
								</div>
							</div>

							<div>
								<div className="flex items-center justify-between mb-2">
									<p className="text-sm font-semibold text-gray-900">{role === 'university' ? 'Vendor Quotations' : 'Your Quotation'}</p>
									{role === 'university' && <span className="text-sm text-gray-500">{quotations.length} offers</span>}
								</div>
								{role === 'university' && (
									<>
									<div className="mb-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-900">
										<p className="font-semibold">Best offer based on price</p>
										<p className="mt-1">
											{bestQuotation ? (
												<>
													{bestQuotation.vendorId?.vendorInfo?.shopName || bestQuotation.vendorId?.name || 'Vendor'} — {bestQuotation.totalPrice}
												</>
											) : (
												'No quotations available yet.'
											)}
										</p>
									</div>
									<div className="mb-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900 flex flex-wrap items-center justify-between gap-3">
										<span>{selectedQuotations.length} of 2 quotations selected for comparison</span>
										<button
											type="button"
											onClick={compareSelectedQuotations}
											disabled={selectedQuotations.length !== 2}
											className={`rounded-lg px-4 py-2 font-semibold text-white transition ${selectedQuotations.length === 2 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
										>
											Compare Selected
										</button>
									</div>
									</>
								)}
								{compareError && <p className="mb-3 text-sm text-red-600">{compareError}</p>}

								{role === 'university' ? (
									<div className="space-y-3 max-h-72 overflow-auto pr-1">
										{quotations.length === 0 ? (
											<p className="text-sm text-gray-500">No quotations have been submitted yet.</p>
										) : quotations.map((quotation) => (
											<div
												key={quotation._id}
												className={`rounded-xl border p-4 text-sm transition ${selectedQuotations.some((item) => item._id === quotation._id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
											>
												<div className="flex items-center justify-between gap-3">
													<div>
														<div className="flex items-center gap-2 flex-wrap">
															<p className="font-semibold text-gray-900">{quotation.vendorId?.vendorInfo?.shopName || quotation.vendorId?.name || 'Vendor'}</p>
															{bestQuotation?._id === quotation._id && (
																<span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
																	Best offer
																</span>
															)}
														</div>
														<p className="text-gray-500">{quotation.vendorId?.email}</p>
													</div>
													<div className="text-right">
														<p className="font-semibold text-blue-700">{quotation.totalPrice}</p>
														<button
															type="button"
															onClick={() => toggleQuotationSelection(quotation)}
															className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
														>
															{selectedQuotations.some((item) => item._id === quotation._id) ? 'Remove from comparison' : 'Select for comparison'}
														</button>
														<button
															type="button"
															onClick={() => navigate(`/view-and-accept/${quotation._id}`, { state: { quotation } })}
															className="mt-2 text-xs font-semibold text-green-600 hover:text-green-700"
														>
															View & Accept
														</button>
													</div>
												</div>
												<ul className="mt-3 space-y-1 text-gray-600">
													{quotation.components?.map((component, index) => (
														<li key={index}>{component.name} — {component.quantity} × {component.unitPrice}</li>
													))}
												</ul>
											</div>
										))}
									</div>
								) : (
									<form onSubmit={submitQuotation} className="space-y-4">
										<div className="space-y-3">
											{components.map((component, index) => (
												<div key={index} className="rounded-xl border border-gray-200 p-4 space-y-3">
													<div className="flex items-center justify-between gap-3">
														<p className="font-medium text-gray-900">Component {index + 1}</p>
														{components.length > 1 && (
															<button type="button" onClick={() => removeComponent(index)} className="text-sm text-red-600 hover:text-red-700">
																Remove
															</button>
														)}
													</div>

													<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
														<input
															value={component.category}
															onChange={(e) => updateComponent(index, 'category', e.target.value)}
															placeholder="Category"
															className="w-full rounded-lg border border-gray-300 px-3 py-2"
														/>
														<input
															value={component.name}
															onChange={(e) => updateComponent(index, 'name', e.target.value)}
															placeholder="Component name"
															className="w-full rounded-lg border border-gray-300 px-3 py-2"
															required
														/>
														<input
															type="number"
															value={component.unitPrice}
															onChange={(e) => updateComponent(index, 'unitPrice', e.target.value)}
															placeholder="Unit price"
															className="w-full rounded-lg border border-gray-300 px-3 py-2"
															required
														/>
														<input
															type="number"
															value={component.quantity}
															onChange={(e) => updateComponent(index, 'quantity', e.target.value)}
															placeholder="Quantity"
															min="1"
															className="w-full rounded-lg border border-gray-300 px-3 py-2"
															required
														/>
														<input
															value={component.warranty}
															onChange={(e) => updateComponent(index, 'warranty', e.target.value)}
															placeholder="Warranty"
															className="w-full rounded-lg border border-gray-300 px-3 py-2"
														/>
														<input
															value={component.deliveryTime}
															onChange={(e) => updateComponent(index, 'deliveryTime', e.target.value)}
															placeholder="Delivery time"
															className="w-full rounded-lg border border-gray-300 px-3 py-2"
														/>
													</div>
												</div>
											))}
										</div>

										<button type="button" onClick={addComponent} className="rounded-lg border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50">
											Add Component
										</button>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<input
												type="number"
												value={bulkDiscount}
												onChange={(e) => setBulkDiscount(e.target.value)}
												placeholder="Bulk discount"
												className="w-full rounded-lg border border-gray-300 px-3 py-2"
											/>

											<div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
												<p className="text-xs uppercase tracking-wide text-gray-500">Current total</p>
												<p className="text-xl font-bold text-gray-900">{totalPrice}</p>
											</div>
										</div>

										<div className="flex flex-wrap gap-4 text-sm text-gray-700">
											<label className="flex items-center gap-2">
												<input type="checkbox" checked={installationIncluded} onChange={(e) => setInstallationIncluded(e.target.checked)} />
												Installation included
											</label>
											<label className="flex items-center gap-2">
												<input type="checkbox" checked={maintenanceIncluded} onChange={(e) => setMaintenanceIncluded(e.target.checked)} />
												Maintenance included
											</label>
										</div>

										<button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
											{editingQuotationId ? 'Update Quotation' : 'Submit Quotation'}
										</button>
									</form>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default QuotationSystem;
