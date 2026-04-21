// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';
// import LabPlanningDashboard from './pages/LabPlanningDashboard';

// function App() {
//   return (
//     <Router>
//       <div className="min-h-screen bg-gray-50 flex flex-col">
//         <nav className="bg-white shadow">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="flex justify-between h-16">
//               <div className="flex items-center">
//                 <span className="text-xl font-bold text-blue-600">ULPVMS</span>
//               </div>
//             </div>
//           </div>
//         </nav>
//         <main className="flex-1">
//           <Routes>
//             <Route path="/" element={<Navigate to="/login" replace />} />
//             <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/lab-planning" element={<LabPlanningDashboard />} />
//           </Routes>
//         </main>
//       </div>
//     </Router>
//   );
// }

// export default App;


import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LabPlanningDashboard from './pages/LabPlanningDashboard';
import ConsultantDashboard from './pages/ConsultantDashboard';
import ConsultantSearch from './pages/ConsultantSearch';
import AvailableLabRequests from './pages/AvailableLabRequests';
import MyQuotations from './pages/MyQuotations';
import VendorContracts from './pages/VendorContracts';
import VendorAnalytics from './pages/VendorAnalytics';
import QuotationSystem from './pages/QuotationSystem';
import CompareQuotation from './pages/CompareQuotation';
import ViewAndAccept from './pages/ViewAndAccept';
// MODULE 2 - Task 2A: Hire Consultant Pages
import HireConsultant from './pages/HireConsultant';
import ConsultantAssignmentDashboard from './pages/ConsultantAssignmentDashboard';
import MyHireRequests from './pages/MyHireRequests';
import ConsultantRRSystem from './pages/ConsultantRRSystem';
import UniversityConsultantSuggestions from './pages/UniversityConsultantSuggestions';
import ConsultantManagementSystem from './pages/ConsultantManagementSystem';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-xl font-bold text-blue-600">ULPVMS</span>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lab-planning" element={<LabPlanningDashboard />} />
            <Route path="/consultant-dashboard" element={<ConsultantDashboard />} />
            <Route path="/search-consultants" element={<ConsultantSearch />} />
            {/* MODULE 2 - Task 2A: Hire Consultant Routes */}
            <Route path="/hire-consultant" element={<HireConsultant />} />
            <Route path="/my-hire-requests" element={<MyHireRequests />} />
            <Route path="/my-assignments" element={<ConsultantAssignmentDashboard />} />
            <Route path="/university/consultant-suggestions" element={<UniversityConsultantSuggestions />} />
            <Route path="/consultant-management" element={<ConsultantManagementSystem />} />
            <Route path="/quotation-system" element={<QuotationSystem />} />
            <Route path="/compare-quotation" element={<CompareQuotation />} />
            <Route path="/view-and-accept/:quotationId" element={<ViewAndAccept />} />

            <Route path="/vendor/labs" element={<AvailableLabRequests />} />
            <Route path="/vendor/labs/:labId/quote" element={<QuotationSystem />} />
            <Route path="/vendor/quotations" element={<MyQuotations />} />
            <Route path="/vendor/contracts" element={<VendorContracts />} />
            <Route path="/vendor/analytics" element={<VendorAnalytics />} />
            
            {/* Consultant Rating & Ranking System */}
            <Route path="/consultant-rr-system" element={<ConsultantRRSystem />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;