import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VendorDashboard from "./VendorDashboard";
import LabPlanningDashboard from "./LabPlanningDashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  useEffect(() => {
    if (!userInfo) {
      navigate("/login");
    }
  }, [userInfo, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
    navigate("/login");
  };


  if (!userInfo) return null;

  if (userInfo.role === "vendor") {
    return <VendorDashboard />;
  }

  if (userInfo.role === "university") {
    return <LabPlanningDashboard />;
  }

  if (userInfo.role === "consultant") {
    navigate("/consultant-dashboard");
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              User Dashboard
            </h3>
            <p className="text-sm text-gray-500">
              Personal details and application status.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/lab-planning")}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create Lab
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="border-t px-4 py-5">
          <dl className="divide-y">
            <div className="py-3 grid grid-cols-3">
              <dt className="text-gray-500">Name</dt>
              <dd className="col-span-2">{userInfo.name}</dd>
            </div>

            <div className="py-3 grid grid-cols-3">
              <dt className="text-gray-500">Role</dt>
              <dd className="col-span-2 capitalize">
                {userInfo.role}
              </dd>
            </div>

            <div className="py-3 grid grid-cols-3">
              <dt className="text-gray-500">Email</dt>
              <dd className="col-span-2">{userInfo.email}</dd>
            </div>

            <div className="py-3 grid grid-cols-3">
              <dt className="text-gray-500">Token</dt>
              <dd className="col-span-2 truncate">
                {userInfo.token}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;