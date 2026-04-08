import React, { useEffect, useState } from "react";
import axios from "axios";

const VendorAnalytics = () => {
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

    fetchAnalytics();
  }, [token]);

  if (loading) return <p className="p-6">Loading analytics...</p>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Vendor Analytics</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-5">
          <p>Total Quotations</p>
          <h2 className="text-2xl font-bold">{analytics?.totalQuotations}</h2>
        </div>
        <div className="bg-white shadow rounded-lg p-5">
          <p>Accepted Quotations</p>
          <h2 className="text-2xl font-bold">{analytics?.acceptedQuotations}</h2>
        </div>
        <div className="bg-white shadow rounded-lg p-5">
          <p>Rejected Quotations</p>
          <h2 className="text-2xl font-bold">{analytics?.rejectedQuotations}</h2>
        </div>
        <div className="bg-white shadow rounded-lg p-5">
          <p>Pending Quotations</p>
          <h2 className="text-2xl font-bold">{analytics?.pendingQuotations}</h2>
        </div>
        <div className="bg-white shadow rounded-lg p-5 md:col-span-2">
          <p>Win Ratio</p>
          <h2 className="text-2xl font-bold">{analytics?.winRatio}%</h2>
        </div>
      </div>
    </div>
  );
};

export default VendorAnalytics;