import React from 'react';
import ConsultantProfile from '../components/ConsultantProfile';

const ConsultantDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <h1 className="text-2xl font-bold text-blue-600">Consultant Dashboard</h1>
      </nav>
      <div className="p-6">
        <ConsultantProfile />
      </div>
    </div>
  );
};

export default ConsultantDashboard;
