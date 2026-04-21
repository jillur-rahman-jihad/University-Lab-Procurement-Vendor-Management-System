import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsultantProfile from '../components/ConsultantProfile';
import ProjectProgress from '../components/ProjectProgress';

const ConsultantDashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">Consultant Dashboard</h1>
        <div className="flex gap-3">
          {/* MODULE 2 - Task 2A: My Assignments Button */}
          <button
            onClick={() => navigate('/my-assignments')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
          >
            My Assignments
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-2 font-semibold border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`py-4 px-2 font-semibold border-b-2 transition ${
              activeTab === 'progress'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Project Progress & Documentation
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'profile' && <ConsultantProfile />}
        {activeTab === 'progress' && <ProjectProgress />}
      </div>
    </div>
  );
};

export default ConsultantDashboard;
