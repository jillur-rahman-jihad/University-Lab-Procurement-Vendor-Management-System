import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const AvailableLabRequests = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo?.token;

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/vendor/labs", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setLabs(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchLabs();
  }, [token]);

  if (loading) return <p className="p-6">Loading lab requests...</p>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Available Lab Requests</h1>

      <div className="grid gap-4">
        {labs.map((lab) => (
          <div key={lab._id} className="bg-white p-6 shadow rounded-lg">
            <h2 className="text-xl font-bold">{lab.labName}</h2>
            <p className="text-gray-600 mt-1">Lab Type: {lab.labType}</p>
            <p className="text-gray-600">
              Systems: {lab.requirements?.systems || "N/A"}
            </p>
            <p className="text-gray-600">
              Budget: {lab.requirements?.budgetMin || 0} - {lab.requirements?.budgetMax || 0}
            </p>
            <p className="text-gray-600">
              Performance Priority: {lab.requirements?.performancePriority || "N/A"}
            </p>

            <Link
              to={`/vendor/labs/${lab._id}/quote`}
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit Quotation
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableLabRequests;