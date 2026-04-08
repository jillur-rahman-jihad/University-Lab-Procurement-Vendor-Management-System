import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo?.token;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/vendor/analytics", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setAnalytics(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (!userInfo || userInfo.role !== "vendor") {
      navigate("/login");
      return;
    }

    fetchAnalytics();
  }, [navigate, token, userInfo]);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage lab offers, quotations, contracts and analytics
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Quotations</p>
            <h2 className="text-2xl font-bold">{analytics?.totalQuotations || 0}</h2>
          </div>
          <div className="bg-white p-5 rounded-lg shadow">
            <p className="text-sm text-gray-500">Accepted</p>
            <h2 className="text-2xl font-bold">{analytics?.acceptedQuotations || 0}</h2>
          </div>
          <div className="bg-white p-5 rounded-lg shadow">
            <p className="text-sm text-gray-500">Pending</p>
            <h2 className="text-2xl font-bold">{analytics?.pendingQuotations || 0}</h2>
          </div>
          <div className="bg-white p-5 rounded-lg shadow">
            <p className="text-sm text-gray-500">Win Ratio</p>
            <h2 className="text-2xl font-bold">{analytics?.winRatio || 0}%</h2>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/vendor/labs"
          className="bg-blue-600 text-white p-5 rounded-lg shadow hover:bg-blue-700"
        >
          View Lab Requests
        </Link>

        <Link
          to="/vendor/quotations"
          className="bg-green-600 text-white p-5 rounded-lg shadow hover:bg-green-700"
        >
          My Quotations
        </Link>

        <Link
          to="/vendor/contracts"
          className="bg-purple-600 text-white p-5 rounded-lg shadow hover:bg-purple-700"
        >
          Accepted Contracts
        </Link>

        <Link
          to="/vendor/analytics"
          className="bg-gray-800 text-white p-5 rounded-lg shadow hover:bg-gray-900"
        >
          Analytics
        </Link>
      </div>
    </div>
  );
};

export default VendorDashboard;