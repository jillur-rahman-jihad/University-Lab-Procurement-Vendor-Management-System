import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AIRecommendationPanel from '../components/AIRecommendationPanel';
import API_URL from '../config/api';
const blankComponent = {
	category: 'CPU',
	name: '',
	unitPrice: '',
	quantity: 1,
	warranty: '',
	deliveryTime: ''
};

const LEAFLET_SCRIPT_ID = 'quotation-leaflet-script';
const LEAFLET_STYLE_ID = 'quotation-leaflet-style';
const DEFAULT_MAP_CENTER = [23.8103, 90.4125];

const escapeHtml = (value) => {
	if (value === undefined || value === null) return '';

	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
};

const buildVendorPopupContent = (quotation) => {
	const vendorName = quotation.vendorId?.vendorInfo?.shopName || quotation.vendorId?.name || 'Vendor';
	const distanceText = quotation._distanceKm !== null ? `${quotation._distanceKm.toFixed(2)} km away` : 'Distance unavailable';
	const vendorRating = Number(quotation.vendorId?.vendorInfo?.rating || 0);
	const ratingText = `${vendorRating.toFixed(1)} / 5`;
	const totalPrice = quotation.totalPrice ?? 'N/A';
	const reviews = Array.isArray(quotation.vendorReviews) ? quotation.vendorReviews : [];
	const reviewsCount = Number(quotation.vendorReviewsCount || reviews.length || 0);

	const reviewsSection = reviews.length > 0
		? reviews.slice(0, 3).map((review) => {
			const reviewerName = review.reviewerName || 'University';
			const reviewRating = Number(review.rating || 0).toFixed(1);
			const labName = review.labName || 'Lab Project';
			const comment = review.comment && review.comment.trim()
				? review.comment.trim()
				: 'No comment provided.';

			return `
				<div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">
					<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:600;color:#111827;">
						<span>${escapeHtml(reviewerName)}</span>
						<span style="color:#ca8a04;">${escapeHtml(reviewRating)} ★</span>
					</div>
					<div style="font-size:11px;color:#6b7280;margin-top:2px;">${escapeHtml(labName)}</div>
					<div style="font-size:12px;color:#374151;margin-top:4px;">${escapeHtml(comment)}</div>
				</div>
			`;
		}).join('')
		: '<div style="margin-top:8px;font-size:12px;color:#6b7280;">No vendor reviews available yet.</div>';

	return `
		<div style="min-width:240px;max-width:280px;">
			<div style="font-size:14px;font-weight:700;color:#111827;">${escapeHtml(vendorName)}</div>
			<div style="font-size:12px;color:#374151;margin-top:4px;">Total: ${escapeHtml(totalPrice)}</div>
			<div style="font-size:12px;color:#374151;">${escapeHtml(distanceText)}</div>
			<div style="font-size:12px;color:#92400e;margin-top:4px;">Rating: ${escapeHtml(ratingText)}</div>
			<div style="font-size:12px;color:#374151;margin-top:8px;font-weight:600;">Reviews (${reviewsCount})</div>
			${reviewsSection}
		</div>
	`;
};

const getVendorCoordinates = (quotation) => {
	const directLocation = quotation?.vendorId?.location;
	if (
		directLocation &&
		typeof directLocation.lat === 'number' &&
		typeof directLocation.lng === 'number'
	) {
		return { lat: directLocation.lat, lng: directLocation.lng };
	}

	const nestedLocation = quotation?.vendorId?.vendorInfo?.location;
	if (
		nestedLocation &&
		typeof nestedLocation.lat === 'number' &&
		typeof nestedLocation.lng === 'number'
	) {
		return { lat: nestedLocation.lat, lng: nestedLocation.lng };
	}

	return null;
};

const calculateDistanceKm = (from, to) => {
	if (!from || !to) return null;

	const toRad = (value) => (value * Math.PI) / 180;
	const earthRadiusKm = 6371;
	const dLat = toRad(to.lat - from.lat);
	const dLng = toRad(to.lng - from.lng);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
		Math.sin(dLng / 2) * Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return earthRadiusKm * c;
};

function QuotationSystem() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
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
	const mapContainerRef = useRef(null);
	const mapRef = useRef(null);
	const markerLayerRef = useRef(null);
	const universityMarkerRef = useRef(null);
	const [isLeafletReady, setIsLeafletReady] = useState(false);

	const requestedLabId = searchParams.get('labId');
	const requestedView = searchParams.get('view');

	const universityCoordinates = useMemo(() => {
		if (
			labDetails?.universityLocation &&
			typeof labDetails.universityLocation.lat === 'number' &&
			typeof labDetails.universityLocation.lng === 'number'
		) {
			return {
				lat: labDetails.universityLocation.lat,
				lng: labDetails.universityLocation.lng
			};
		}

		return null;
	}, [labDetails]);

	const quotationsWithDistance = useMemo(() => {
		return quotations.map((quotation) => {
			const vendorCoordinates = getVendorCoordinates(quotation);
			const distanceKm = calculateDistanceKm(universityCoordinates, vendorCoordinates);

			return {
				...quotation,
				_vendorCoordinates: vendorCoordinates,
				_distanceKm: distanceKm
			};
		});
	}, [quotations, universityCoordinates]);

	const sortedQuotations = useMemo(() => {
		return [...quotationsWithDistance].sort((a, b) => {
			if (a._distanceKm === null && b._distanceKm === null) return 0;
			if (a._distanceKm === null) return 1;
			if (b._distanceKm === null) return -1;
			return a._distanceKm - b._distanceKm;
		});
	}, [quotationsWithDistance]);

	useEffect(function () {
		if (role !== 'university') {
			return undefined;
		}

		const initLeaflet = () => {
			if (window.L) {
				setIsLeafletReady(true);
			}
		};

		if (window.L) {
			setIsLeafletReady(true);
			return undefined;
		}

		if (!document.getElementById(LEAFLET_STYLE_ID)) {
			const style = document.createElement('link');
			style.id = LEAFLET_STYLE_ID;
			style.rel = 'stylesheet';
			style.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			style.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
			style.crossOrigin = '';
			document.head.appendChild(style);
		}

		const existingScript = document.getElementById(LEAFLET_SCRIPT_ID);
		if (existingScript) {
			existingScript.addEventListener('load', initLeaflet);
			return () => {
				existingScript.removeEventListener('load', initLeaflet);
			};
		}

		const script = document.createElement('script');
		script.id = LEAFLET_SCRIPT_ID;
		script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
		script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
		script.crossOrigin = '';
		script.onload = initLeaflet;
		document.body.appendChild(script);

		return () => {
			script.removeEventListener('load', initLeaflet);
		};
	}, [role]);

	useEffect(() => {
		if (role !== 'university' || !isLeafletReady || !mapContainerRef.current || !window.L) {
			return;
		}

		if (!mapRef.current) {
			mapRef.current = window.L.map(mapContainerRef.current).setView(DEFAULT_MAP_CENTER, 11);
			window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; OpenStreetMap contributors'
			}).addTo(mapRef.current);
			markerLayerRef.current = window.L.layerGroup().addTo(mapRef.current);
		}

		const map = mapRef.current;
		const markerLayer = markerLayerRef.current;
		if (!map || !markerLayer) {
			return;
		}

		markerLayer.clearLayers();
		const bounds = [];

		if (universityCoordinates) {
			if (universityMarkerRef.current) {
				map.removeLayer(universityMarkerRef.current);
			}

			const universityIcon = window.L.divIcon({
				className: '',
				html: '<div style="width:30px;height:30px;border-radius:50%;background:#7c3aed;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.28);border:2px solid #ffffff;">🎓</div>',
				iconSize: [30, 30],
				iconAnchor: [15, 15]
			});

			universityMarkerRef.current = window.L.marker([universityCoordinates.lat, universityCoordinates.lng], { icon: universityIcon })
				.bindTooltip('University', {
					permanent: true,
					direction: 'top',
					offset: [0, -16]
				})
				.bindPopup('University Location')
				.addTo(map);
			bounds.push([universityCoordinates.lat, universityCoordinates.lng]);
		}

		sortedQuotations.forEach((quotation) => {
			if (!quotation._vendorCoordinates) return;

			const vendorName = quotation.vendorId?.vendorInfo?.shopName || quotation.vendorId?.name || 'Vendor';

			window.L.marker([quotation._vendorCoordinates.lat, quotation._vendorCoordinates.lng])
				.bindTooltip(vendorName, {
					permanent: true,
					direction: 'top',
					offset: [0, -12],
					className: 'vendor-name-tooltip'
				})
				.bindPopup(buildVendorPopupContent(quotation), { maxWidth: 320 })
				.addTo(markerLayer);

			bounds.push([quotation._vendorCoordinates.lat, quotation._vendorCoordinates.lng]);
		});

		if (bounds.length > 1) {
			map.fitBounds(bounds, { padding: [30, 30] });
		} else if (bounds.length === 1) {
			map.setView(bounds[0], 13);
		}
	}, [role, isLeafletReady, universityCoordinates, sortedQuotations]);

	useEffect(() => {
		return () => {
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
				markerLayerRef.current = null;
				universityMarkerRef.current = null;
			}
		};
	}, []);

	useEffect(function () {
		async function fetchLabs() {
			setLoading(true);
			setError('');
			try {
				const res = await axios.get(`${API_URL}/api/quotation-system/labs`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				const availableLabs = res.data || [];
				setLabs(availableLabs);
				if (availableLabs.length > 0) {
					const matchedLab = requestedLabId
						? availableLabs.find((lab) => lab._id === requestedLabId)
						: null;
					setSelectedLab(matchedLab || availableLabs[0]);
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
	}, [token, requestedLabId]);

	useEffect(function () {
		async function fetchLabDetails() {
			if (!selectedLab || !selectedLab._id) {
				return;
			}

			setLoadingDetails(true);
			setError('');
			try {
				const labPromise = axios.get(`${API_URL}/api/quotation-system/labs/${selectedLab._id}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				const quotationPromise = axios.get(`${API_URL}/api/quotation-system/labs/${selectedLab._id}/quotations`, {
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

	useEffect(() => {
		if (requestedView === 'map' && role === 'university' && mapContainerRef.current) {
			mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}, [requestedView, role, selectedLab]);

	const totalPrice = useMemo(function () {
		return components.reduce(function (sum, component) {
			const unitPrice = Number(component.unitPrice || 0);
			const quantity = Number(component.quantity || 1);
			return sum + unitPrice * quantity;
		}, 0);
	}, [components]);

	const bestQuotation = useMemo(function () {
		if (role !== 'university' || sortedQuotations.length === 0) {
			return null;
		}

		return sortedQuotations.reduce(function (currentBest, quotation) {
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
	}, [sortedQuotations, role]);

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

		// Filter out empty components
		const validComponents = components.filter(
			(component) => component.name && component.name.trim() && component.unitPrice
		);

		if (validComponents.length === 0) {
			setError('Please add at least one complete component (name and unit price required).');
			return;
		}

		try {
			const payload = {
				labProjectId: selectedLab._id,
				components: validComponents,
				totalPrice,
				bulkDiscount: Number(bulkDiscount || 0),
				installationIncluded,
				maintenanceIncluded
			};

			if (editingQuotationId) {
				await axios.put(`${API_URL}/api/quotation-system/quotations/${editingQuotationId}`, payload, {
					headers: { Authorization: `Bearer ${token}` }
				});
				setSuccess('Quotation updated successfully.');
			} else {
				await axios.post(`${API_URL}/api/quotation-system/quotations`, payload, {
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
					<div className="flex items-center gap-3 mb-2">
						<span className="material-icons text-4xl text-blue-600">receipt_long</span>
						<h1 className="text-3xl font-bold text-gray-900">Quotation System</h1>
					</div>
					<p className="text-gray-600 mt-1">
						{role === 'vendor'
							? 'Review available lab projects and submit your offer.'
							: 'Review your lab projects and inspect vendor quotations.'}
					</p>
				</div>
				<button
					onClick={() => navigate('/dashboard')}
					className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2"
				>
					<span className="material-icons" style={{ fontSize: '20px' }}>arrow_back</span>
					Back to Dashboard
				</button>
			</div>

			{error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</div>}
			{success && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">{success}</div>}

			<div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
				<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
							<span className="material-icons" style={{ fontSize: '24px', color: '#3b82f6' }}>lab</span>
							Lab Projects
						</h2>
						<span className="text-sm text-gray-500 flex items-center gap-1">
							<span className="material-icons" style={{ fontSize: '16px' }}>done_all</span>
							{labs.length} found
						</span>
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
					<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<span className="material-icons" style={{ fontSize: '24px', color: '#3b82f6' }}>folder_open</span>
						Project Details
					</h2>

					{loadingDetails ? (
						<p className="text-gray-500">Loading details...</p>
					) : !labDetails ? (
						<p className="text-gray-500">Select a lab project to view details.</p>
					) : (
						<div className="space-y-5">
							<div>
							<p className="text-sm text-gray-500 flex items-center gap-1">
								<span className="material-icons" style={{ fontSize: '16px' }}>label</span>
								Lab Name
							</p>
							<p className="font-semibold text-gray-900">{labDetails.labName}</p>
						</div>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p className="text-gray-500 flex items-center gap-1">
									<span className="material-icons" style={{ fontSize: '16px' }}>school</span>
									University
								</p>
								<p className="font-medium text-gray-900">{labDetails.universityName}</p>
							</div>
							<div>
								<p className="text-gray-500 flex items-center gap-1">
									<span className="material-icons" style={{ fontSize: '16px' }}>category</span>
									Type
								</p>
								<p className="font-medium text-gray-900">{labDetails.labType}</p>
							</div>
							<div>
								<p className="text-gray-500 flex items-center gap-1">
									<span className="material-icons" style={{ fontSize: '16px' }}>attach_money</span>
									Min Budget
								</p>
								<p className="font-medium text-gray-900">{labDetails.minBudget}</p>
							</div>
							<div>
								<p className="text-gray-500 flex items-center gap-1">
									<span className="material-icons" style={{ fontSize: '16px' }}>trending_up</span>
									Max Budget
								</p>
								</div>
							</div>

							<div>
							<p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
								<span className="material-icons" style={{ fontSize: '16px' }}>assignment</span>
								Main Requirement
							</p>
							<p className="text-sm text-gray-700 leading-7">{labDetails.requirements?.mainRequirement || 'No requirement provided.'}</p>
						</div>

						<div>
							<p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
								<span className="material-icons" style={{ fontSize: '16px' }}>apps</span>
								Software
							</p>
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
									<p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
										<span className="material-icons" style={{ fontSize: '18px', color: '#3b82f6' }}>{role === 'university' ? 'list_alt' : 'edit'}</span>
										{role === 'university' ? 'Vendor Quotations' : 'Your Quotation'}
									</p>
									{role === 'university' && <span className="text-sm text-gray-500 flex items-center gap-1">
										<span className="material-icons" style={{ fontSize: '16px' }}>inventory_2</span>
										{sortedQuotations.length} offers
									</span>}
								</div>
								{role === 'university' && (
									<>
									<div className="mb-3 rounded-xl border border-gray-200 bg-white p-3">
										<p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
											<span className="material-icons" style={{ fontSize: '18px', color: '#3b82f6' }}>map</span>
											Nearby Vendor Quotations Map
										</p>
										<div ref={mapContainerRef} className="h-72 w-full rounded-lg border border-gray-200" />
										<p className="mt-2 text-xs text-gray-500">
											Vendors are plotted when location coordinates are available.
										</p>
									</div>
									<div className="mb-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-900">
										<p className="font-semibold flex items-center gap-2">
											<span className="material-icons" style={{ fontSize: '18px' }}>star</span>
											Best offer based on price
										</p>
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
										<span className="flex items-center gap-2">
											<span className="material-icons" style={{ fontSize: '16px' }}>check_circle</span>
											{selectedQuotations.length} of 2 quotations selected for comparison
										</span>
										<button
											type="button"
											onClick={compareSelectedQuotations}
											disabled={selectedQuotations.length !== 2}
											className={`rounded-lg px-4 py-2 font-semibold text-white transition flex items-center gap-2 ${selectedQuotations.length === 2 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
										>
											<span className="material-icons" style={{ fontSize: '18px' }}>compare</span>
											Compare Selected
										</button>
									</div>
									</>
								)}
								{compareError && <p className="mb-3 text-sm text-red-600">{compareError}</p>}

								{role === 'university' ? (
									<div className="space-y-3 max-h-72 overflow-auto pr-1">
										{sortedQuotations.length === 0 ? (
											<p className="text-sm text-gray-500">No quotations have been submitted yet.</p>
										) : sortedQuotations.map((quotation) => (
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
															<span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${quotation.status === 'accepted' ? 'bg-green-100 text-green-800' : quotation.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
																{quotation.status || 'pending'}
															</span>
														</div>
														<p className="text-gray-500">{quotation.vendorId?.email}</p>
														<p className="text-xs text-gray-500">
															{quotation._distanceKm !== null ? `Distance: ${quotation._distanceKm.toFixed(2)} km` : 'Distance unavailable'}
														</p>
														<p className="text-xs text-yellow-700">
															Rating: {Number(quotation.vendorId?.vendorInfo?.rating || 0).toFixed(1)} / 5
														</p>
													</div>
													<div className="text-right">
														<p className="font-semibold text-blue-700">{quotation.totalPrice} Taka</p>
														<button
															type="button"
															onClick={() => toggleQuotationSelection(quotation)}
															className="mt-2 border border-blue-600 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1"
														>
															<span className="material-icons" style={{ fontSize: '14px' }}>{selectedQuotations.some((item) => item._id === quotation._id) ? 'remove_circle' : 'add_circle'}</span>
															{selectedQuotations.some((item) => item._id === quotation._id) ? 'Remove from comparison' : 'Select for comparison'}
														</button>
														<button
															type="button"
															onClick={() => navigate(`/view-and-accept/${quotation._id}`, { state: { quotation } })}
															className="mt-2 ml-3 border border-green-600 text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1 px-2 py-1"
														>
															<span className="material-icons" style={{ fontSize: '14px' }}>visibility</span>
															{quotation.status === 'accepted' ? 'View Details' : 'View & Accept'}
														</button>
														{quotation.status === 'accepted' && (
															<button
																type="button"
																onClick={() => navigate(`/view-and-accept/${quotation._id}`, { state: { quotation } })}
																className="mt-2 ml-3 border border-yellow-500 text-xs font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1 px-2 py-1"
															>
																<span className="material-icons" style={{ fontSize: '14px' }}>star</span>
																Review & Rate Vendor
															</button>
														)}
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
													<p className="font-medium text-gray-900 flex items-center gap-2">
														<span className="material-icons" style={{ fontSize: '18px', color: '#3b82f6' }}>widgets</span>
														Component {index + 1}
													</p>
													{components.length > 1 && (
														<button type="button" onClick={() => removeComponent(index)} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
															<span className="material-icons" style={{ fontSize: '16px' }}>delete</span>
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

										<button type="button" onClick={addComponent} className="rounded-lg border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50 flex items-center gap-2">
											<span className="material-icons" style={{ fontSize: '20px' }}>add</span>
											Add Component
										</button>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<div>
												<label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
													<span className="material-icons" style={{ fontSize: '16px' }}>discount</span>
													Bulk Discount
												</label>
												<input
													type="number"
													value={bulkDiscount}
													onChange={(e) => setBulkDiscount(e.target.value)}
													placeholder="Bulk discount"
													className="w-full rounded-lg border border-gray-300 px-3 py-2"
												/>
											</div>

											<div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
												<p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-1">
													<span className="material-icons" style={{ fontSize: '16px' }}>calculate</span>
													Current total
												</p>
												<p className="text-xl font-bold text-gray-900">{totalPrice}</p>
											</div>
										</div>

										<div className="flex flex-wrap gap-4 text-sm text-gray-700">
											<label className="flex items-center gap-2">
												<input type="checkbox" checked={installationIncluded} onChange={(e) => setInstallationIncluded(e.target.checked)} />
												<span className="material-icons" style={{ fontSize: '16px', color: '#3b82f6' }}>build</span>
												Installation included
											</label>
											<label className="flex items-center gap-2">
												<input type="checkbox" checked={maintenanceIncluded} onChange={(e) => setMaintenanceIncluded(e.target.checked)} />
												<span className="material-icons" style={{ fontSize: '16px', color: '#3b82f6' }}>settings</span>
												Maintenance included
											</label>
										</div>

										<button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 flex items-center justify-center gap-2">
											<span className="material-icons" style={{ fontSize: '20px' }}>{editingQuotationId ? 'edit' : 'send'}</span>
											{editingQuotationId ? 'Update Quotation' : 'Submit Quotation'}
										</button>
									</form>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* ============ AI BUILD RECOMMENDATION PANEL ============ */}
			{selectedLab && role === 'university' && (
				<div className="mt-8">
					<AIRecommendationPanel 
						labProjectId={selectedLab._id} 
						token={token}
					/>
				</div>
			)}
		</div>
	);
};

export default QuotationSystem;
