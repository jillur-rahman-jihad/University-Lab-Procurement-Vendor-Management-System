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
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-8 rounded-lg shadow h-40 flex flex-col justify-center">
            <p className="text-sm text-gray-500">Total Quotations</p>
            <h2 className="text-3xl font-bold">{analytics?.totalQuotations || 0}</h2>
          </div>
          <div className="bg-white p-8 rounded-lg shadow h-40 flex flex-col justify-center">
            <p className="text-sm text-gray-500">Accepted</p>
            <h2 className="text-3xl font-bold">{analytics?.acceptedQuotations || 0}</h2>
          </div>
          <div className="bg-white p-8 rounded-lg shadow h-40 flex flex-col justify-center">
            <p className="text-sm text-gray-500">Pending</p>
            <h2 className="text-3xl font-bold">{analytics?.pendingQuotations || 0}</h2>
          </div>
          <div className="bg-white p-8 rounded-lg shadow h-40 flex flex-col justify-center">
            <p className="text-sm text-gray-500">Win Ratio</p>
            <h2 className="text-3xl font-bold">{analytics?.winRatio || 0}%</h2>
          </div>

          <div className="bg-white p-8 rounded-lg shadow h-40 flex flex-col justify-center">
            <p className="text-sm text-gray-500">Institutional Acceptance Rate</p>
            <h2 className="text-3xl font-bold">{analytics?.institutionalAcceptanceRate ?? 'N/A'}</h2>
          </div>
          <div className="bg-white p-8 rounded-lg shadow h-40 flex flex-col justify-center">
            <p className="text-sm text-gray-500">Active Bids</p>
            <h2 className="text-3xl font-bold">{analytics?.activeBids || 0}</h2>
          </div>
          <div className="bg-white p-8 rounded-lg shadow h-40 flex flex-col justify-center">
            <p className="text-sm text-gray-500">Avg Response Time</p>
            <h2 className="text-3xl font-bold">{analytics?.avgResponseTime ?? analytics?.averageResponseTime ?? 'N/A'} hrs</h2>
          </div>
          <div className="bg-white p-8 rounded-lg shadow h-40 flex flex-col justify-center">
            <p className="text-sm text-gray-500">Competing Offers (recent)</p>
            <h2 className="text-3xl font-bold">{analytics?.competingOffers || 0}</h2>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Link
          to="/quotation-system"
          className="bg-blue-600 text-white p-8 rounded-lg shadow hover:bg-blue-700 h-32 flex items-center justify-center text-center font-semibold"
        >
          Quotation System
        </Link>

        <Link
          to="/vendor/labs"
          className="bg-blue-600 text-white p-8 rounded-lg shadow hover:bg-blue-700 h-32 flex items-center justify-center text-center font-semibold"
        >
          View Lab Requests
        </Link>

        <Link
          to="/vendor/quotations"
          className="bg-green-600 text-white p-8 rounded-lg shadow hover:bg-green-700 h-32 flex items-center justify-center text-center font-semibold"
        >
          My Quotations
        </Link>

        <Link
          to="/vendor/contracts"
          className="bg-purple-600 text-white p-8 rounded-lg shadow hover:bg-purple-700 h-32 flex items-center justify-center text-center font-semibold"
        >
          Accepted Contracts
        </Link>

        <Link
          to="/vendor/analytics"
          className="bg-gray-800 text-white p-8 rounded-lg shadow hover:bg-gray-900 h-32 flex items-center justify-center text-center font-semibold"
        >
          Analytics
        </Link>
      </div>

      {/* Recent Lab Requests preview */}
    </div>
  );
};

export default VendorDashboard;

// Small helper component to preview recent labs
const RecentLabRequests = ({ token }) => {
  const [labs, setLabs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState(null);

  React.useEffect(() => {
    const fetchLabs = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/vendor/labs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLabs(res.data && res.data.slice ? res.data.slice(0, 5) : res.data || []);
      } catch (err) {
        setLabs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLabs();
  }, [token]);

  if (loading) return <p>Loading recent requests...</p>;
  if (!labs || labs.length === 0) return <p className="text-gray-500">No recent lab requests available.</p>;

  return (
    <div className="grid gap-4">
      {labs.map((lab) => (
        <div key={lab._id} className="bg-white p-4 rounded shadow">
          <div className="flex justify-between">
            <div>
              <h3 className="font-semibold">{lab.labName}</h3>
              <p className="text-sm text-gray-500">Type: {lab.labType}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Systems: {lab.requirements?.systems || 'N/A'}</p>
              <p className="text-sm text-gray-500">Budget: {lab.requirements?.budgetMin || 0} - {lab.requirements?.budgetMax || 0}</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={() => setExpandedId(expandedId === lab._id ? null : lab._id)} className="px-3 py-1 bg-indigo-600 text-white rounded">Review</button>
            <Link to={`/vendor/labs/${lab._id}/quote`} className="px-3 py-1 bg-blue-600 text-white rounded">Submit Quotation</Link>
          </div>

          {expandedId === lab._id && (
            <div className="mt-3 text-sm text-gray-700 border-t pt-3">
              {lab.description && <p className="mb-2">{lab.description}</p>}
              <div className="space-y-2">
                {Object.entries(lab.requirements || {}).map(([k, v]) => (
                  <div key={k} className="flex">
                    <div className="w-40 font-medium text-gray-600">{k}:</div>
                    <div className="flex-1">
                      {Array.isArray(v) ? (
                        <ul className="list-disc ml-5">
                          {v.map((item, idx) => <li key={idx}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>)}
                        </ul>
                      ) : typeof v === 'object' && v !== null ? (
                        <pre className="whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>
                      ) : (
                        <span>{String(v)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};