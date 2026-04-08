import React, { useState } from 'react';
import ConsultantProfile from '../components/ConsultantProfile';
import AssignedProjects from '../components/AssignedProjects';

const ConsultantDashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <h1 className="text-2xl font-bold text-blue-600">Consultant Dashboard</h1>
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
            onClick={() => setActiveTab('projects')}
            className={`py-4 px-2 font-semibold border-b-2 transition ${
              activeTab === 'projects'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Assigned Projects
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'profile' && <ConsultantProfile />}
        {activeTab === 'projects' && <AssignedProjects />}
      </div>
    </div>
  );
};

export default ConsultantDashboard;
