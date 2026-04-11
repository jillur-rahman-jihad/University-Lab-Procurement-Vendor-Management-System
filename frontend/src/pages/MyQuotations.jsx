import React, { useEffect, useState } from "react";
import axios from "axios";

const MyQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo?.token;

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/vendor/quotations/my", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setQuotations(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, [token]);

  if (loading) return <p className="p-6">Loading quotations...</p>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">My Quotations</h1>

      <div className="grid gap-4">
        {quotations.map((quotation) => (
          <div key={quotation._id} className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold">
              {quotation.labProjectId?.labName || "Lab Project"}
            </h2>
            <p className="text-gray-600">Status: {quotation.status}</p>
            <p className="text-gray-600">Total Price: {quotation.totalPrice}</p>
            <p className="text-gray-600">Bulk Discount: {quotation.bulkDiscount}</p>
            <div className="mt-4 flex gap-2">
              <a
                href={`/vendor/labs/${quotation.labProjectId?._id || ''}/quote?quotationId=${quotation._id}`}
                className="px-3 py-1 bg-yellow-500 text-white rounded"
              >
                Edit
              </a>
              <a
                href={`/vendor/labs/${quotation.labProjectId?._id || ''}/quote`}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Submit New
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyQuotations;