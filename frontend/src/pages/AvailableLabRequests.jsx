import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const AvailableLabRequests = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState(null);

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
    <>
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

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelectedLab(lab)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Review
                </button>

                <Link
                  to={`/vendor/labs/${lab._id}/quote`}
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit Quotation
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedLab && (
        <LabReviewModal lab={selectedLab} onClose={() => setSelectedLab(null)} />
      )}
    </>
  );
};

// Modal rendered when a lab is selected for review
const LabReviewModal = ({ lab, onClose }) => {
  const requirements = lab?.requirements || {};
  const [quotations, setQuotations] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo?.token;

  useEffect(() => {
    if (!lab?._id) return;

    const fetchQuotations = async () => {
      setLoadingQuotes(true);
      try {
        const res = await axios.get(`http://localhost:5001/api/vendor/labs/${lab._id}/quotations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuotations(res.data || []);
      } catch (err) {
        setQuotations([]);
      } finally {
        setLoadingQuotes(false);
      }
    };

    fetchQuotations();
  }, [lab?._id, token]);

  if (!lab) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative bg-white max-w-3xl w-full mx-4 rounded shadow-lg p-6 z-10">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{lab.labName}</h2>
            <p className="text-sm text-gray-500">Type: {lab.labType}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">Close</button>
        </div>

        <div className="mt-4 grid gap-3">
          {lab.description && <p className="text-gray-700">{lab.description}</p>}

          <div>
            <h3 className="font-semibold">Requirements</h3>
            <div className="mt-2 space-y-2 text-sm text-gray-700">
              {Object.keys(requirements).length === 0 && <p>No detailed requirements provided.</p>}
              {Object.entries(requirements).map(([key, value]) => (
                <div key={key} className="flex">
                  <div className="w-40 font-medium text-gray-600">{key}:</div>
                  <div className="flex-1">
                    {Array.isArray(value) ? (
                      <ul className="list-disc ml-5">
                        {value.map((v, i) => (
                          <li key={i}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</li>
                        ))}
                      </ul>
                    ) : typeof value === 'object' && value !== null ? (
                      <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                    ) : (
                      <span>{String(value)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Close</button>
            <Link to={`/vendor/labs/${lab._id}/quote`} className="px-4 py-2 bg-blue-600 text-white rounded">Submit Quotation</Link>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Competing Offers</h3>
          {loadingQuotes ? (
            <p className="text-sm text-gray-500">Loading competing offers...</p>
          ) : quotations.length === 0 ? (
            <p className="text-sm text-gray-500">No competing offers yet.</p>
          ) : (
            <div className="space-y-3">
              {quotations.map((q) => {
                const isMine = q.vendorId && (q.vendorId._id === (userInfo && userInfo._id));
                return (
                  <div key={q._id} className={`p-3 rounded border ${isMine ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold">{q.vendorId?.vendorInfo?.shopName || q.vendorId?.name || 'Vendor'}</div>
                        <div className="text-sm text-gray-500">Submitted: {new Date(q.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{q.totalPrice}</div>
                        <div className="text-sm text-gray-500">Status: {q.status}</div>
                      </div>
                    </div>

                    <div className="mt-2 text-sm">
                      <div className="font-medium">Components:</div>
                      <ul className="list-disc ml-5">
                        {q.components && q.components.map((c, i) => (
                          <li key={i}>{c.name} — {c.quantity} × {c.unitPrice} ({c.warranty || 'no warranty'})</li>
                        ))}
                      </ul>
                    </div>

                    {isMine && (
                      <div className="mt-2 flex gap-2 justify-end">
                        <Link to="/vendor/quotations" className="px-3 py-1 bg-yellow-500 text-white rounded">Edit My Quotation</Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailableLabRequests;