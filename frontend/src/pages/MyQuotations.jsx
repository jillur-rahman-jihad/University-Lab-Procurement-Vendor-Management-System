import React, { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../config/api";
const blankComponent = {
  category: "CPU",
  name: "",
  unitPrice: "",
  quantity: 1,
  warranty: "",
  deliveryTime: ""
};

const MyQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingQuotationId, setEditingQuotationId] = useState(null);
  const [viewingQuotation, setViewingQuotation] = useState(null);
  const [editForm, setEditForm] = useState({
    components: [{ ...blankComponent }],
    bulkDiscount: "",
    installationIncluded: false,
    maintenanceIncluded: false
  });

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo?.token;

  useEffect(() => {
    const fetchQuotations = async () => {
      setError("");
      try {
        const res = await axios.get(`${API_URL}/api/vendor/quotations/my`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setQuotations(res.data);
      } catch (error) {
        setError(error?.response?.data?.message || "Failed to load quotations.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchQuotations();
    } else {
      setLoading(false);
      setError("Please log in to view quotations.");
    }
  }, [token]);

  const updateComponent = (index, key, value) => {
    setEditForm((prev) => ({
      ...prev,
      components: prev.components.map((component, componentIndex) =>
        componentIndex === index ? { ...component, [key]: value } : component
      )
    }));
  };

  const addComponent = () => {
    setEditForm((prev) => ({
      ...prev,
      components: [...prev.components, { ...blankComponent }]
    }));
  };

  const removeComponent = (index) => {
    setEditForm((prev) => {
      if (prev.components.length === 1) return prev;
      return {
        ...prev,
        components: prev.components.filter((_, componentIndex) => componentIndex !== index)
      };
    });
  };

  const startEditing = (quotation) => {
    setError("");
    setSuccess("");
    setEditingQuotationId(quotation._id);
    setEditForm({
      components:
        quotation.components && quotation.components.length
          ? quotation.components.map((component) => ({
              category: component.category || "CPU",
              name: component.name || "",
              unitPrice: component.unitPrice ?? "",
              quantity: component.quantity ?? 1,
              warranty: component.warranty || "",
              deliveryTime: component.deliveryTime || ""
            }))
          : [{ ...blankComponent }],
      bulkDiscount: quotation.bulkDiscount ?? "",
      installationIncluded: Boolean(quotation.installationIncluded),
      maintenanceIncluded: Boolean(quotation.maintenanceIncluded)
    });
  };

  const cancelEditing = () => {
    setEditingQuotationId(null);
  };

  const handleUpdateQuotation = async (quotationId) => {
    setError("");
    setSuccess("");

    try {
      const totalPrice = editForm.components.reduce((sum, component) => {
        const unitPrice = Number(component.unitPrice || 0);
        const quantity = Number(component.quantity || 1);
        return sum + unitPrice * quantity;
      }, 0);

      const payload = {
        components: editForm.components,
        totalPrice,
        bulkDiscount: Number(editForm.bulkDiscount || 0),
        installationIncluded: Boolean(editForm.installationIncluded),
        maintenanceIncluded: Boolean(editForm.maintenanceIncluded)
      };

      const res = await axios.put(
        `${API_URL}/api/vendor/quotations/${quotationId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const updatedQuotation = res?.data?.quotation;
      setQuotations((prev) =>
        prev.map((quotation) =>
          quotation._id === quotationId ? { ...quotation, ...(updatedQuotation || payload), totalPrice } : quotation
        )
      );

      setSuccess("Quotation updated successfully.");
      setEditingQuotationId(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update quotation.");
    }
  };

  const handleDeleteQuotation = async (quotationId) => {
    if (!window.confirm("Are you sure you want to delete this quotation?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await axios.delete(`${API_URL}/api/vendor/quotations/${quotationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setQuotations((prev) => prev.filter((quotation) => quotation._id !== quotationId));
      if (editingQuotationId === quotationId) {
        setEditingQuotationId(null);
      }
      setSuccess("Quotation deleted successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete quotation.");
    }
  };

  if (loading) return <p className="p-6">Loading quotations...</p>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">My Quotations</h1>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">{success}</div>}

      {!quotations.length && <p className="text-gray-600">No quotations submitted yet.</p>}

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
              <button
                type="button"
                onClick={() => setViewingQuotation(quotation)}
                className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                View
              </button>
              <button
                type="button"
                onClick={() =>
                  editingQuotationId === quotation._id
                    ? cancelEditing()
                    : startEditing(quotation)
                }
                disabled={quotation.status !== "pending"}
                className="px-3 py-1 bg-yellow-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingQuotationId === quotation._id ? "Cancel" : "Edit"}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteQuotation(quotation._id)}
                disabled={quotation.status !== "pending"}
                className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>

            {editingQuotationId === quotation._id && (
              <div className="mt-5 border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Edit Quotation</h3>

                <div className="space-y-3">
                  {editForm.components.map((component, index) => (
                    <div key={index} className="grid gap-2 md:grid-cols-6 items-end">
                      <div>
                        <label className="text-xs text-gray-500">Category</label>
                        <select
                          className="w-full border rounded px-2 py-1"
                          value={component.category}
                          onChange={(e) => updateComponent(index, "category", e.target.value)}
                        >
                          {[
                            "CPU",
                            "GPU",
                            "RAM",
                            "Storage",
                            "Motherboard",
                            "Networking",
                            "UPS",
                            "Other"
                          ].map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Name</label>
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={component.name}
                          onChange={(e) => updateComponent(index, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full border rounded px-2 py-1"
                          value={component.unitPrice}
                          onChange={(e) => updateComponent(index, "unitPrice", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full border rounded px-2 py-1"
                          value={component.quantity}
                          onChange={(e) => updateComponent(index, "quantity", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Warranty</label>
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={component.warranty}
                          onChange={(e) => updateComponent(index, "warranty", e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeComponent(index)}
                        className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Remove
                      </button>

                      <div className="md:col-span-5">
                        <label className="text-xs text-gray-500">Delivery Time</label>
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={component.deliveryTime}
                          onChange={(e) => updateComponent(index, "deliveryTime", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addComponent}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Add Component
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-xs text-gray-500">Bulk Discount</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded px-2 py-1"
                      value={editForm.bulkDiscount}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, bulkDiscount: e.target.value }))}
                    />
                  </div>
                  <label className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      checked={editForm.installationIncluded}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, installationIncluded: e.target.checked }))
                      }
                    />
                    Installation Included
                  </label>
                  <label className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      checked={editForm.maintenanceIncluded}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, maintenanceIncluded: e.target.checked }))
                      }
                    />
                    Maintenance Included
                  </label>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleUpdateQuotation(quotation._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {viewingQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setViewingQuotation(null)}
          />

          <div className="relative z-10 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Full Quotation</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {viewingQuotation.labProjectId?.labName || "Lab Project"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingQuotation(null)}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-gray-700 md:grid-cols-2">
              <p><span className="font-semibold">Status:</span> {viewingQuotation.status}</p>
              <p><span className="font-semibold">Total Price:</span> {viewingQuotation.totalPrice}</p>
              <p><span className="font-semibold">Bulk Discount:</span> {viewingQuotation.bulkDiscount || 0}</p>
              <p>
                <span className="font-semibold">Installation Included:</span>{" "}
                {viewingQuotation.installationIncluded ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-semibold">Maintenance Included:</span>{" "}
                {viewingQuotation.maintenanceIncluded ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-semibold">Created At:</span>{" "}
                {viewingQuotation.createdAt ? new Date(viewingQuotation.createdAt).toLocaleString() : "N/A"}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Components</h3>

              {!viewingQuotation.components || viewingQuotation.components.length === 0 ? (
                <p className="text-gray-500">No components added.</p>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Category</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Unit Price</th>
                        <th className="px-3 py-2 text-left">Quantity</th>
                        <th className="px-3 py-2 text-left">Warranty</th>
                        <th className="px-3 py-2 text-left">Delivery Time</th>
                        <th className="px-3 py-2 text-left">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingQuotation.components.map((component, index) => {
                        const subtotal = Number(component.unitPrice || 0) * Number(component.quantity || 1);
                        return (
                          <tr key={index} className="border-t">
                            <td className="px-3 py-2">{component.category || "-"}</td>
                            <td className="px-3 py-2">{component.name || "-"}</td>
                            <td className="px-3 py-2">{component.unitPrice || 0}</td>
                            <td className="px-3 py-2">{component.quantity || 1}</td>
                            <td className="px-3 py-2">{component.warranty || "-"}</td>
                            <td className="px-3 py-2">{component.deliveryTime || "-"}</td>
                            <td className="px-3 py-2">{subtotal}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyQuotations;