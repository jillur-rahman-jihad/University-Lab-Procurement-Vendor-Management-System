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

const QuotationSystem = () => {
	const navigate = useNavigate();
	const userInfo = JSON.parse(localStorage.getItem('userInfo'));
	const token = userInfo?.token;
	const role = userInfo?.role;

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

	useEffect(() => {
		const fetchLabs = async () => {
			setLoading(true);
			setError('');
			try {
				const res = await axios.get('http://localhost:5001/api/quotation-system/labs', {
					headers: { Authorization: `Bearer ${token}` }
				});
				setLabs(res.data || []);
				if (res.data?.length) {
					setSelectedLab(res.data[0]);
				}
			} catch (err) {
				setError(err.response?.data?.message || 'Failed to load quotation system');
			} finally {
				setLoading(false);
			}
		};

		if (token) {
			fetchLabs();
		}
	}, [token]);

	useEffect(() => {
		const fetchLabDetails = async () => {
			if (!selectedLab?._id) return;

			setLoadingDetails(true);
			setError('');
			try {
				const [labRes, quotationRes] = await Promise.all([
					axios.get(`http://localhost:5001/api/quotation-system/labs/${selectedLab._id}`, {
						headers: { Authorization: `Bearer ${token}` }
					}),
					axios.get(`http://localhost:5001/api/quotation-system/labs/${selectedLab._id}/quotations`, {
						headers: { Authorization: `Bearer ${token}` }
					})
				]);

				setLabDetails(labRes.data);
				setQuotations(quotationRes.data || []);

				if (role === 'vendor') {
					const myQuotation = quotationRes.data?.[0];
					if (myQuotation) {
						setEditingQuotationId(myQuotation._id);
						setComponents(myQuotation.components?.length ? myQuotation.components : [blankComponent]);
						setBulkDiscount(myQuotation.bulkDiscount ?? '');
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
				setError(err.response?.data?.message || 'Failed to load lab details');
			} finally {
				setLoadingDetails(false);
			}
		};

		if (token && selectedLab) {
			fetchLabDetails();
		}
	}, [selectedLab, token, role]);

	const totalPrice = useMemo(() => {
		return components.reduce((sum, component) => {
			const unitPrice = Number(component.unitPrice || 0);
			const quantity = Number(component.quantity || 1);
			return sum + unitPrice * quantity;
		}, 0);
	}, [components]);

	const updateComponent = (index, key, value) => {
		setComponents((prev) => prev.map((component, componentIndex) => (componentIndex === index ? { ...component, [key]: value } : component)));
	};

	const addComponent = () => setComponents((prev) => [...prev, { ...blankComponent }]);
	const removeComponent = (index) => setComponents((prev) => prev.length === 1 ? prev : prev.filter((_, componentIndex) => componentIndex !== index));

	const submitQuotation = async (event) => {
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
			setError(err.response?.data?.message || 'Failed to submit quotation');
		}
	};

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

								{role === 'university' ? (
									<div className="space-y-3 max-h-72 overflow-auto pr-1">
										{quotations.length === 0 ? (
											<p className="text-sm text-gray-500">No quotations have been submitted yet.</p>
										) : quotations.map((quotation) => (
											<div key={quotation._id} className="rounded-xl border border-gray-200 p-4 text-sm">
												<div className="flex items-center justify-between gap-3">
													<div>
														<p className="font-semibold text-gray-900">{quotation.vendorId?.vendorInfo?.shopName || quotation.vendorId?.name || 'Vendor'}</p>
														<p className="text-gray-500">{quotation.vendorId?.email}</p>
													</div>
													<p className="font-semibold text-blue-700">{quotation.totalPrice}</p>
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
