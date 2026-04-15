import React from 'react';
import { useNavigate } from 'react-router-dom';

const UniversityDashboard = () => {
	const navigate = useNavigate();
	const userInfo = JSON.parse(localStorage.getItem('userInfo'));

	const handleLogout = () => {
		localStorage.removeItem('userInfo');
		navigate('/login');
	};

	if (!userInfo) {
		navigate('/login');
		return null;
	}

	return (
		<div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			<div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
				<div className="px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">University Dashboard</h1>
						<p className="mt-1 text-sm text-gray-500">
							Choose where you want to go next.
						</p>
					</div>

					<button
						onClick={handleLogout}
						className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
					>
						Logout
					</button>
				</div>

				<div className="grid gap-6 md:grid-cols-3 p-6 sm:p-8">
					<button
						onClick={() => navigate('/quotation-system')}
						className="text-left rounded-2xl border border-blue-100 bg-blue-50 hover:bg-blue-100 p-6 shadow-sm transition-all hover:-translate-y-0.5"
					>
						<span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
							Option 1
						</span>
						<h2 className="mt-4 text-xl font-semibold text-gray-900">Quotation System</h2>
						<p className="mt-2 text-sm text-gray-600">
							Review and manage quotations for university procurement.
						</p>
					</button>

					<button
						onClick={() => navigate('/lab-planning')}
						className="text-left rounded-2xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 p-6 shadow-sm transition-all hover:-translate-y-0.5"
					>
						<span className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
							Option 2
						</span>
						<h2 className="mt-4 text-xl font-semibold text-gray-900">Lab Planning Dashboard</h2>
						<p className="mt-2 text-sm text-gray-600">
							Create and plan lab requirements before requesting quotations.
						</p>
					</button>

					{/* MODULE 2 - Task 1: Search Consultants */}
					<button
						onClick={() => navigate('/search-consultants')}
						className="text-left rounded-2xl border border-purple-100 bg-purple-50 hover:bg-purple-100 p-6 shadow-sm transition-all hover:-translate-y-0.5"
					>
						<span className="inline-flex items-center rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
							Option 3
						</span>
						<h2 className="mt-4 text-xl font-semibold text-gray-900">Search Consultants</h2>
						<p className="mt-2 text-sm text-gray-600">
							Find and view available technical consultants by expertise.
						</p>
					</button>

					{/* MODULE 2 - Task 2A: Hire Consultant */}
					<button
						onClick={() => navigate('/hire-consultant')}
						className="text-left rounded-2xl border border-pink-100 bg-pink-50 hover:bg-pink-100 p-6 shadow-sm transition-all hover:-translate-y-0.5"
					>
						<span className="inline-flex items-center rounded-full bg-pink-600 px-3 py-1 text-xs font-semibold text-white">
							Option 4
						</span>
						<h2 className="mt-4 text-xl font-semibold text-gray-900">Hire Consultant</h2>
						<p className="mt-2 text-sm text-gray-600">
							Create hire requests for consultants for specific lab projects.
						</p>
					</button>

					{/* MODULE 2 - Task 2A: My Hire Requests */}
					<button
						onClick={() => navigate('/my-hire-requests')}
						className="text-left rounded-2xl border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 p-6 shadow-sm transition-all hover:-translate-y-0.5"
					>
						<span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
							Option 5
						</span>
						<h2 className="mt-4 text-xl font-semibold text-gray-900">My Hire Requests</h2>
						<p className="mt-2 text-sm text-gray-600">
							Track and manage all your consultant hire requests and assignments.
						</p>
					</button>
				</div>
			</div>
		</div>
	);
};

export default UniversityDashboard;
