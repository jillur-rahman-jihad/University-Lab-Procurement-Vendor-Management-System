import React, { useEffect, useState } from "react";
import axios from "axios";

const VendorContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo?.token;

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/vendor/contracts", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setContracts(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [token]);

  if (loading) return <p className="p-6">Loading contracts...</p>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Accepted Contracts</h1>

      <div className="grid gap-4">
        {contracts.map((contract) => (
          <div key={contract._id} className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold">
              {contract.labProjectId?.labName || "Lab Project"}
            </h2>
            <p className="text-gray-600">Final Cost: {contract.finalCost}</p>
            <p className="text-gray-600">
              Admin Approved: {contract.approvedByAdmin ? "Yes" : "No"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorContracts;