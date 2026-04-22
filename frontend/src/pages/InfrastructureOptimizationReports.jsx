import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const InfrastructureOptimizationReports = () => {
	const navigate = useNavigate();
	const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
	const token = userInfo?.token;

	const [hasAccess, setHasAccess] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [reports, setReports] = useState([]);
	const [statistics, setStatistics] = useState(null);
	const [view, setView] = useState('list'); // 'list', 'create', or 'details'
	const [selectedReport, setSelectedReport] = useState(null);
	const [filterStatus, setFilterStatus] = useState('all');
	const [filterType, setFilterType] = useState('all');
	const [labProjects, setLabProjects] = useState([]);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [createForm, setCreateForm] = useState({
		labProjectId: '',
		reportTitle: '',
		reportType: 'comprehensive',
		analysisData: {
			executiveSummary: {
				overview: '',
				keyFindings: [],
				estimatedSavings: {
					amount: 0,
					currency: 'USD',
					timeframe: 'yearly'
				},
				priority: 'medium'
			},
			currentSystemAnalysis: {
				componentsAnalyzed: [],
				overallHealthScore: 0,
				uptime: 99.9,
				reliabilityScore: 0
			},
			recommendations: [],
			performanceMetrics: {
				currentMetrics: {
					powerConsumption: { value: 0, unit: 'kW' },
					cpuUtilization: 0,
					memoryUtilization: 0,
					storageUtilization: 0,
					networkBandwidthUsage: { value: 0, unit: 'Mbps' }
				},
				projectedMetrics: {
					powerConsumption: { value: 0, unit: 'kW' },
					cpuUtilization: 0,
					memoryUtilization: 0,
					storageUtilization: 0,
					networkBandwidthUsage: { value: 0, unit: 'Mbps' }
				}
			},
			costAnalysis: {
				currentAnnualCost: {
					operational: 0,
					maintenance: 0,
					energy: 0,
					licensing: 0,
					total: 0
				},
				projectedAnnualCost: {
					operational: 0,
					maintenance: 0,
					energy: 0,
					licensing: 0,
					total: 0
				},
				estimatedSavings: {
					amount: 0,
					percentage: 0,
					paybackPeriod: { value: 0, unit: 'months' }
				}
			},
			capacityPlanning: {
				currentCapacity: {
					storage: { value: 0, unit: 'TB' },
					computeNodes: 0,
					networkCapacity: { value: 0, unit: 'Gbps' }
				},
				projectedNeeds: {
					timeframe: { value: 0, unit: 'years' },
					storage: { value: 0, unit: 'TB' },
					computeNodes: 0,
					networkCapacity: { value: 0, unit: 'Gbps' }
				},
				growthRate: 0
			},
			implementationRoadmap: [],
			riskAssessment: {
				implementationRisks: [],
				downtimeRisk: {
					likelihood: 'low',
					potentialDowntime: { value: 0, unit: 'minutes' },
					mitigation: ''
				}
			}
		}
	});

	const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

	const reportTypes = [
		{ value: 'energy-efficiency', label: '⚡ Energy Efficiency' },
		{ value: 'performance-optimization', label: '🚀 Performance Optimization' },
		{ value: 'cost-analysis', label: '💰 Cost Analysis' },
		{ value: 'capacity-planning', label: '📈 Capacity Planning' },
		{ value: 'comprehensive', label: '📊 Comprehensive Analysis' }
	];

	const statuses = ['draft', 'completed', 'archived'];
	const priorities = ['critical', 'high', 'medium', 'low'];

	// Check access and fetch data
	useEffect(() => {
		checkAccess();
		fetchLabProjects();
	}, [token]);

	useEffect(() => {
		if (hasAccess) {
			fetchReports();
			fetchStatistics();
		}
	}, [filterStatus, filterType, page, hasAccess]);

	const checkAccess = async () => {
		try {
			const response = await axios.get(
				`${API_URL}/api/subscription/check-infrastructure-optimization`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setHasAccess(response.data.allowed);
		} catch (err) {
			console.error('Error checking access:', err);
			setHasAccess(false);
		} finally {
			setLoading(false);
		}
	};

	const fetchLabProjects = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/labs/user-projects`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			setLabProjects(response.data.projects || []);
		} catch (err) {
			console.error('Error fetching lab projects:', err);
		}
	};

	const fetchReports = async () => {
		try {
			let url = `${API_URL}/api/infrastructure-optimization/my-reports`;
			const params = new URLSearchParams();
			if (filterStatus !== 'all') params.append('status', filterStatus);
			if (filterType !== 'all') params.append('reportType', filterType);
			params.append('page', page);
			params.append('limit', pageSize);

			if (params.toString()) {
				url += '?' + params.toString();
			}

			const response = await axios.get(url, {
				headers: { Authorization: `Bearer ${token}` }
			});
			setReports(response.data.reports || []);
		} catch (err) {
			console.error('Error fetching reports:', err);
			setError('Failed to fetch optimization reports');
		}
	};

	const fetchStatistics = async () => {
		try {
			const response = await axios.get(
				`${API_URL}/api/infrastructure-optimization/statistics`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setStatistics(response.data);
		} catch (err) {
			console.error('Error fetching statistics:', err);
		}
	};

	const handleCreateReport = async () => {
		try {
			if (!createForm.labProjectId || !createForm.reportTitle) {
				setError('Please fill in all required fields');
				return;
			}

			const response = await axios.post(
				`${API_URL}/api/infrastructure-optimization/generate-report`,
				{
					labProjectId: createForm.labProjectId,
					reportTitle: createForm.reportTitle,
					reportType: createForm.reportType,
					analysisData: createForm.analysisData
				},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.report) {
				setReports([response.data.report, ...reports]);
				setCreateForm({
					...createForm,
					labProjectId: '',
					reportTitle: '',
					analysisData: {
						...createForm.analysisData,
						executiveSummary: {
							...createForm.analysisData.executiveSummary,
							overview: '',
							keyFindings: [],
							estimatedSavings: { amount: 0, currency: 'USD', timeframe: 'yearly' },
							priority: 'medium'
						}
					}
				});
				setView('list');
				setError(null);
				alert('Report generated successfully!');
			}
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to generate report');
		}
	};

	const handleViewDetails = async (reportId) => {
		try {
			const response = await axios.get(
				`${API_URL}/api/infrastructure-optimization/report/${reportId}`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setSelectedReport(response.data);
			setView('details');
		} catch (err) {
			setError('Failed to fetch report details');
		}
	};

	const handleUpdateRecommendations = async () => {
		try {
			const response = await axios.put(
				`${API_URL}/api/infrastructure-optimization/report/${selectedReport._id}`,
				{ recommendations: selectedReport.recommendations },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setSelectedReport(response.data.report);
			alert('Report updated successfully!');
		} catch (err) {
			setError('Failed to update report');
		}
	};

	const handleDeleteReport = async (reportId) => {
		if (window.confirm('Are you sure you want to archive this report?')) {
			try {
				await axios.delete(
					`${API_URL}/api/infrastructure-optimization/report/${reportId}`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				setReports(reports.filter(r => r._id !== reportId));
				alert('Report archived successfully!');
			} catch (err) {
				setError('Failed to archive report');
			}
		}
	};

	const handleExportReport = async (reportId, format = 'json') => {
		try {
			const response = await axios.get(
				`${API_URL}/api/infrastructure-optimization/export/${reportId}?format=${format}`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			console.log('Export data:', response.data);
			alert(`Report exported as ${format.toUpperCase()}`);
		} catch (err) {
			setError('Failed to export report');
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p className="text-gray-500">Loading...</p>
			</div>
		);
	}

	if (!hasAccess) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
				<div className="max-w-2xl mx-auto">
					<div className="bg-white rounded-lg shadow-lg p-8 text-center">
						<div className="mb-4 text-5xl">🔒</div>
						<h1 className="text-2xl font-bold text-gray-800 mb-2">Premium Feature</h1>
						<p className="text-gray-600 mb-6">
							Infrastructure Optimization Reports are only available on the Premium Plan.
						</p>
						<button
							onClick={() => navigate('/subscription-plans')}
							className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
						>
							Upgrade to Premium
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<button
						onClick={() => navigate('/dashboard')}
						className="text-indigo-600 hover:text-indigo-800 mb-4"
					>
						← Back to Dashboard
					</button>
					<h1 className="text-4xl font-bold text-gray-800">Infrastructure Optimization Reports</h1>
					<p className="text-gray-600 mt-2">Generate and analyze detailed optimization reports for your lab infrastructure</p>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
						<p className="text-red-800">{error}</p>
						<button
							onClick={() => setError(null)}
							className="text-red-600 hover:text-red-800 mt-2"
						>
							Dismiss
						</button>
					</div>
				)}

				{/* Statistics Dashboard */}
				{view === 'list' && statistics && (
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
						<div className="bg-white rounded-lg shadow p-6">
							<p className="text-gray-600 text-sm">Total Reports</p>
							<p className="text-3xl font-bold text-indigo-600">{statistics.totalReports || 0}</p>
						</div>
						<div className="bg-white rounded-lg shadow p-6">
							<p className="text-gray-600 text-sm">Completed</p>
							<p className="text-3xl font-bold text-green-600">{statistics.reportsByStatus?.completed || 0}</p>
						</div>
						<div className="bg-white rounded-lg shadow p-6">
							<p className="text-gray-600 text-sm">Average Savings</p>
							<p className="text-3xl font-bold text-purple-600">
								${(statistics.averageSavings?.amount || 0).toLocaleString()}
							</p>
						</div>
						<div className="bg-white rounded-lg shadow p-6">
							<p className="text-gray-600 text-sm">Total Savings</p>
							<p className="text-3xl font-bold text-blue-600">
								${(statistics.averageSavings?.totalSavings || 0).toLocaleString()}
							</p>
						</div>
					</div>
				)}

				{/* Main Content */}
				{view === 'list' && (
					<div className="bg-white rounded-lg shadow-lg p-6">
						{/* View Toggle */}
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-bold text-gray-800">My Reports</h2>
							<button
								onClick={() => setView('create')}
								className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
							>
								+ Generate New Report
							</button>
						</div>

						{/* Filters */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
								<select
									value={filterStatus}
									onChange={(e) => {
										setFilterStatus(e.target.value);
										setPage(1);
									}}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
								>
									<option value="all">All Status</option>
									{statuses.map(s => (
										<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
								<select
									value={filterType}
									onChange={(e) => {
										setFilterType(e.target.value);
										setPage(1);
									}}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
								>
									<option value="all">All Types</option>
									{reportTypes.map(t => (
										<option key={t.value} value={t.value}>{t.label}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Items per Page</label>
								<select
									value={pageSize}
									onChange={(e) => {
										setPageSize(parseInt(e.target.value));
										setPage(1);
									}}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
								>
									<option value={5}>5</option>
									<option value={10}>10</option>
									<option value={20}>20</option>
									<option value={50}>50</option>
								</select>
							</div>
						</div>

						{/* Reports List */}
						{reports.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-gray-500">No reports generated yet. Create your first optimization report!</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b border-gray-300">
											<th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
											<th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
											<th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
											<th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
											<th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
										</tr>
									</thead>
									<tbody>
										{reports.map(report => (
											<tr key={report._id} className="border-b border-gray-200 hover:bg-gray-50">
												<td className="py-3 px-4">{report.reportTitle}</td>
												<td className="py-3 px-4">
													<span className="text-sm">
														{reportTypes.find(t => t.value === report.reportType)?.label}
													</span>
												</td>
												<td className="py-3 px-4">
													<span className={`px-3 py-1 rounded-full text-sm ${
														report.status === 'completed' ? 'bg-green-100 text-green-800' :
														report.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
														'bg-gray-100 text-gray-800'
													}`}>
														{report.status.charAt(0).toUpperCase() + report.status.slice(1)}
													</span>
												</td>
												<td className="py-3 px-4 text-sm text-gray-600">
													{new Date(report.generatedDate).toLocaleDateString()}
												</td>
												<td className="py-3 px-4">
													<div className="flex gap-2">
														<button
															onClick={() => handleViewDetails(report._id)}
															className="text-indigo-600 hover:text-indigo-800 text-sm"
														>
															View
														</button>
														<button
															onClick={() => handleExportReport(report._id, 'json')}
															className="text-green-600 hover:text-green-800 text-sm"
														>
															Export
														</button>
														<button
															onClick={() => handleDeleteReport(report._id)}
															className="text-red-600 hover:text-red-800 text-sm"
														>
															Archive
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				)}

				{/* Create Report View */}
				{view === 'create' && (
					<div className="bg-white rounded-lg shadow-lg p-6">
						<h2 className="text-2xl font-bold text-gray-800 mb-6">Generate New Report</h2>

						<div className="space-y-6">
							{/* Report Basics */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Lab Project *</label>
									<select
										value={createForm.labProjectId}
										onChange={(e) => setCreateForm({ ...createForm, labProjectId: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
									>
										<option value="">Select a lab project</option>
										{labProjects.map(project => (
											<option key={project._id} value={project._id}>
												{project.projectName}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Report Type *</label>
									<select
										value={createForm.reportType}
										onChange={(e) => setCreateForm({ ...createForm, reportType: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
									>
										{reportTypes.map(t => (
											<option key={t.value} value={t.value}>{t.label}</option>
										))}
									</select>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Report Title *</label>
								<input
									type="text"
									value={createForm.reportTitle}
									onChange={(e) => setCreateForm({ ...createForm, reportTitle: e.target.value })}
									placeholder="Enter report title"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
								/>
							</div>

							{/* Executive Summary */}
							<div className="border-t pt-6">
								<h3 className="text-lg font-bold text-gray-800 mb-4">Executive Summary</h3>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Overview</label>
										<textarea
											value={createForm.analysisData.executiveSummary.overview}
											onChange={(e) => setCreateForm({
												...createForm,
												analysisData: {
													...createForm.analysisData,
													executiveSummary: {
														...createForm.analysisData.executiveSummary,
														overview: e.target.value
													}
												}
											})}
											placeholder="Provide an overview of the analysis"
											rows="4"
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
										<select
											value={createForm.analysisData.executiveSummary.priority}
											onChange={(e) => setCreateForm({
												...createForm,
												analysisData: {
													...createForm.analysisData,
													executiveSummary: {
														...createForm.analysisData.executiveSummary,
														priority: e.target.value
													}
												}
											})}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
										>
											{priorities.map(p => (
												<option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
											))}
										</select>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Estimated Savings Amount</label>
											<input
												type="number"
												value={createForm.analysisData.executiveSummary.estimatedSavings.amount}
												onChange={(e) => setCreateForm({
													...createForm,
													analysisData: {
														...createForm.analysisData,
														executiveSummary: {
															...createForm.analysisData.executiveSummary,
															estimatedSavings: {
																...createForm.analysisData.executiveSummary.estimatedSavings,
																amount: parseFloat(e.target.value) || 0
															}
														}
													}
												})}
												placeholder="0.00"
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Health Score (0-100)</label>
											<input
												type="number"
												min="0"
												max="100"
												value={createForm.analysisData.currentSystemAnalysis.overallHealthScore}
												onChange={(e) => setCreateForm({
													...createForm,
													analysisData: {
														...createForm.analysisData,
														currentSystemAnalysis: {
															...createForm.analysisData.currentSystemAnalysis,
															overallHealthScore: parseInt(e.target.value) || 0
														}
													}
												})}
												placeholder="0-100"
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
											/>
										</div>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-4 pt-6 border-t">
								<button
									onClick={handleCreateReport}
									className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
								>
									Generate Report
								</button>
								<button
									onClick={() => setView('list')}
									className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Report Details View */}
				{view === 'details' && selectedReport && (
					<div className="bg-white rounded-lg shadow-lg p-6">
						<div className="flex justify-between items-start mb-6">
							<div>
								<h2 className="text-2xl font-bold text-gray-800">{selectedReport.reportTitle}</h2>
								<p className="text-gray-600 mt-2">
									{reportTypes.find(t => t.value === selectedReport.reportType)?.label}
								</p>
							</div>
							<button
								onClick={() => setView('list')}
								className="text-indigo-600 hover:text-indigo-800"
							>
								← Back to List
							</button>
						</div>

						{/* Report Summary */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
							<div className="bg-blue-50 rounded-lg p-4">
								<p className="text-gray-600 text-sm">Status</p>
								<p className="text-lg font-bold text-blue-600">
									{selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
								</p>
							</div>
							<div className="bg-green-50 rounded-lg p-4">
								<p className="text-gray-600 text-sm">Health Score</p>
								<p className="text-lg font-bold text-green-600">
									{selectedReport.currentSystemAnalysis?.overallHealthScore || 0}%
								</p>
							</div>
							<div className="bg-purple-50 rounded-lg p-4">
								<p className="text-gray-600 text-sm">Estimated Savings</p>
								<p className="text-lg font-bold text-purple-600">
									${(selectedReport.executiveSummary?.estimatedSavings?.amount || 0).toLocaleString()}
								</p>
							</div>
						</div>

						{/* Executive Summary */}
						<div className="mb-8 pb-8 border-b">
							<h3 className="text-xl font-bold text-gray-800 mb-4">Executive Summary</h3>
							<p className="text-gray-700 mb-4">{selectedReport.executiveSummary?.overview}</p>
							<p className="text-sm text-gray-600">
								<strong>Priority:</strong> {selectedReport.executiveSummary?.priority?.charAt(0).toUpperCase() + selectedReport.executiveSummary?.priority?.slice(1)}
							</p>
						</div>

						{/* Performance Metrics */}
						{selectedReport.performanceMetrics && (
							<div className="mb-8 pb-8 border-b">
								<h3 className="text-xl font-bold text-gray-800 mb-4">Performance Metrics</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<h4 className="font-bold text-gray-700 mb-3">Current Metrics</h4>
										<div className="space-y-2 text-sm">
											<p>CPU: {selectedReport.performanceMetrics.currentMetrics?.cpuUtilization}%</p>
											<p>Memory: {selectedReport.performanceMetrics.currentMetrics?.memoryUtilization}%</p>
											<p>Storage: {selectedReport.performanceMetrics.currentMetrics?.storageUtilization}%</p>
										</div>
									</div>
									<div>
										<h4 className="font-bold text-gray-700 mb-3">Projected Metrics</h4>
										<div className="space-y-2 text-sm">
											<p>CPU: {selectedReport.performanceMetrics.projectedMetrics?.cpuUtilization}%</p>
											<p>Memory: {selectedReport.performanceMetrics.projectedMetrics?.memoryUtilization}%</p>
											<p>Storage: {selectedReport.performanceMetrics.projectedMetrics?.storageUtilization}%</p>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Recommendations */}
						{selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
							<div className="mb-8 pb-8 border-b">
								<h3 className="text-xl font-bold text-gray-800 mb-4">Recommendations</h3>
								<div className="space-y-4">
									{selectedReport.recommendations.map((rec, idx) => (
										<div key={idx} className="bg-gray-50 p-4 rounded-lg">
											<div className="flex justify-between items-start mb-2">
												<h4 className="font-bold text-gray-800">{rec.category}</h4>
												<span className={`text-xs px-2 py-1 rounded ${
													rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
													rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
													rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
													'bg-green-100 text-green-800'
												}`}>
													{rec.priority}
												</span>
											</div>
											<p className="text-gray-700 mb-2">{rec.description}</p>
											<p className="text-sm text-gray-600">Cost: ${(rec.implementationCost?.estimated || 0).toLocaleString()}</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Action Buttons */}
						<div className="flex gap-4 pt-6 border-t">
							<button
								onClick={() => handleExportReport(selectedReport._id, 'json')}
								className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
							>
								Export as JSON
							</button>
							<button
								onClick={() => handleDeleteReport(selectedReport._id)}
								className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
							>
								Archive Report
							</button>
							<button
								onClick={() => setView('list')}
								className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
							>
								Back
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default InfrastructureOptimizationReports;
