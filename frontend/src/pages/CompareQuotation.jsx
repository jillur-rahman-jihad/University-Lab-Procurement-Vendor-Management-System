import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

const normalizeName = (value) => String(value || '').trim().toLowerCase();

const formatValue = (value, fallback = '-') => {
	if (value === null || value === undefined || value === '') {
		return fallback;
	}

	return value;
};

const CompareQuotation = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const storedData = (() => {
		try {
			return JSON.parse(sessionStorage.getItem('quotationComparisonData') || 'null');
		} catch (error) {
			return null;
		}
	})();

	const comparisonData = location.state || storedData || {};
	const quotations = comparisonData.quotations || [];
	const selectedLab = comparisonData.selectedLab;

	const comparisonRows = useMemo(() => {
		const componentMap = new Map();

		quotations.forEach((quotation) => {
			(quotation.components || []).forEach((component) => {
				const key = normalizeName(component.category || 'Other');
				if (!key) {
					return;
				}

				if (!componentMap.has(key)) {
					componentMap.set(key, {
						category: component.category || 'Other',
						components: new Map()
					});
				}

				componentMap.get(key).components.set(quotation._id, component);
			});
		});

		return Array.from(componentMap.values());
	}, [quotations]);

	if (quotations.length !== 2) {
		return (
			<div className="max-w-4xl mx-auto py-12 px-4">
				<div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
					<div className="flex items-center gap-3 mb-3">
						<span className="material-icons text-4xl text-blue-600">compare</span>
						<h1 className="text-2xl font-bold text-gray-900">Quotation Comparison</h1>
					</div>
					<p className="mt-3 text-gray-600">Select exactly two quotations from the quotation system to compare them side by side.</p>
					<button
						type="button"
						onClick={() => navigate('/quotation-system')}
						className="mt-6 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 flex items-center gap-2"
					>
						<span className="material-icons" style={{ fontSize: '20px' }}>arrow_back</span>
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
					<div className="flex items-center gap-3 mb-2">
						<span className="material-icons text-4xl text-blue-600">compare</span>
						<h1 className="text-3xl font-bold text-gray-900">Quotation Comparison</h1>
					</div>
					<p className="text-gray-600 mt-1">
						{selectedLab?.labName ? `${selectedLab.labName} - ` : ''}
						Compare component name, price, and warranty side by side.
					</p>
				</div>
				<button
					type="button"
					onClick={() => navigate('/quotation-system')}
					className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2"
				>
					<span className="material-icons" style={{ fontSize: '20px' }}>arrow_back</span>
					Back to Quotation System
				</button>
			</div>

			<div className="grid gap-4 lg:grid-cols-2 mb-6">
				{quotations.map((quotation, index) => (
					<div key={quotation._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
						<p className="text-sm font-semibold uppercase tracking-wide text-blue-600 flex items-center gap-2">
							<span className="material-icons" style={{ fontSize: '16px' }}>receipt</span>
							Quotation {index + 1}
						</p>
						<h2 className="mt-2 text-xl font-bold text-gray-900 flex items-center gap-2">
							<span className="material-icons" style={{ fontSize: '24px', color: '#3b82f6' }}>business</span>
							{quotation.vendorId?.vendorInfo?.shopName || quotation.vendorId?.name || 'Vendor'}
						</h2>
						<p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
							<span className="material-icons" style={{ fontSize: '16px' }}>email</span>
							{quotation.vendorId?.email || 'No vendor email provided'}
						</p>
						<div className="mt-4 grid grid-cols-2 gap-3 text-sm">
							<div className="rounded-xl bg-gray-50 px-3 py-3">
								<p className="text-gray-500 flex items-center gap-1">
									<span className="material-icons" style={{ fontSize: '16px' }}>attach_money</span>
									Total Price
								</p>
								<p className="font-bold text-gray-900">{formatValue(quotation.totalPrice)}</p>
							</div>
							<div className="rounded-xl bg-gray-50 px-3 py-3">
								<p className="text-gray-500 flex items-center gap-1">
									<span className="material-icons" style={{ fontSize: '16px' }}>widgets</span>
									Components
								</p>
								<p className="font-bold text-gray-900">{quotation.components?.length || 0}</p>
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
				<div className="border-b border-gray-200 px-5 py-4">
					<h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
						<span className="material-icons" style={{ fontSize: '24px', color: '#3b82f6' }}>table_chart</span>
						Side-by-side component comparison
					</h2>
				</div>

				{comparisonRows.length === 0 ? (
					<div className="px-5 py-8 text-gray-500 flex items-center gap-2">
						<span className="material-icons" style={{ fontSize: '24px' }}>info</span>
						No component data available for comparison.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200 text-sm">
							<thead className="bg-gray-50 text-left text-gray-600">
								<tr>
									<th className="px-5 py-3 font-semibold flex items-center gap-2">
										<span className="material-icons" style={{ fontSize: '18px' }}>category</span>
										Category
									</th>
									{quotations.map((quotation, index) => (
										<th key={quotation._id} className="px-5 py-3 font-semibold">
											<div className="flex items-center gap-2">
												<span className="material-icons" style={{ fontSize: '18px' }}>receipt</span>
												Quotation {index + 1}
											</div>
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200 bg-white">
								{comparisonRows.map((row) => (
									<tr key={row.category} className="align-top">
										<td className="px-5 py-4 font-semibold text-gray-900">{row.category}</td>
										{quotations.map((quotation) => {
											const component = row.components.get(quotation._id);
											return (
												<td key={quotation._id} className="px-5 py-4 text-gray-700">
													{component ? (
														<div className="space-y-1">
															<p className="flex items-center gap-2">
																<span className="material-icons" style={{ fontSize: '16px', color: '#3b82f6' }}>label</span>
																<span className="font-medium text-gray-500">Name:</span> {formatValue(component.name)}
															</p>
															<p className="flex items-center gap-2">
																<span className="material-icons" style={{ fontSize: '16px', color: '#3b82f6' }}>attach_money</span>
																<span className="font-medium text-gray-500">Price:</span> {formatValue(component.unitPrice)}
															</p>
															<p className="flex items-center gap-2">
																<span className="material-icons" style={{ fontSize: '16px', color: '#3b82f6' }}>verified</span>
																<span className="font-medium text-gray-500">Warranty:</span> {formatValue(component.warranty)}
															</p>
														</div>
													) : (
														<span className="text-gray-400 flex items-center gap-2">
															<span className="material-icons" style={{ fontSize: '16px' }}>close</span>
															Not included
														</span>
													)}
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default CompareQuotation;
