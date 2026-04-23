import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import API_URL from "../config/api";
const VendorDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [vendorReviews, setVendorReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo?.token;
  const displayName = vendorProfile?.vendorInfo?.shopName || vendorProfile?.name || userInfo?.name || "Vendor";
  const displayEmail = vendorProfile?.email || userInfo?.email || "No email";
  const displayPhone = vendorProfile?.phone || userInfo?.phone || "No phone";
  const displayAddress = vendorProfile?.vendorInfo?.location?.address || vendorProfile?.address || userInfo?.address || "No address";

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [analyticsRes, profileRes] = await Promise.all([
          axios.get(`${API_URL}/api/vendor/analytics`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          axios.get(`${API_URL}/api/vendor/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ]);

        setAnalytics(analyticsRes.data);
        setVendorProfile(profileRes.data?.vendor || null);
        setVendorReviews(profileRes.data?.reviews || []);
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
        <div className="flex gap-2 items-center">
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {displayName}
            </h2>
            <p className="text-gray-600 mt-1">{displayEmail}</p>
            <p className="text-gray-600">{displayPhone}</p>
            <p className="text-gray-600">{displayAddress}</p>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-sm font-semibold">
                Rating: {Number(vendorProfile?.vendorInfo?.rating || 0).toFixed(1)} / 5
              </span>
              {vendorProfile?.vendorInfo?.isVerified && (
                <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-sm font-semibold">
                  Verified Vendor
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowReviews((prev) => !prev)}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {showReviews ? "Hide Reviews" : `Show Reviews (${vendorReviews.length})`}
          </button>
        </div>

        {showReviews && (
          <div className="mt-5 border-t pt-4">
            {vendorReviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-auto pr-1">
                {vendorReviews.map((review) => (
                  <div key={review._id} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                    <div className="flex justify-between items-center gap-3">
                      <p className="font-semibold text-gray-900">{review.reviewerName}</p>
                      <span className="text-yellow-600 font-semibold">{Number(review.rating || 0).toFixed(1)} ★</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{review.labName}</p>
                    <p className="text-sm text-gray-700 mt-2">{review.comment || "No comment provided."}</p>
                    <p className="text-xs text-gray-500 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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