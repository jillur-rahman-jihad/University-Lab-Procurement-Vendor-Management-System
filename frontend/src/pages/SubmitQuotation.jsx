import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const SubmitQuotation = () => {
  const { labId } = useParams();
  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo?.token;

  const [formData, setFormData] = useState({
    componentName: "",
    category: "CPU",
    unitPrice: "",
    quantity: "",
    warranty: "",
    deliveryTime: "",
    totalPrice: "",
    bulkDiscount: "",
    installationIncluded: false,
    maintenanceIncluded: false
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload = {
        labProjectId: labId,
        components: [
          {
            category: formData.category,
            name: formData.componentName,
            unitPrice: Number(formData.unitPrice),
            quantity: Number(formData.quantity),
            warranty: formData.warranty,
            deliveryTime: formData.deliveryTime
          }
        ],
        totalPrice: Number(formData.totalPrice),
        bulkDiscount: Number(formData.bulkDiscount || 0),
        installationIncluded: formData.installationIncluded,
        maintenanceIncluded: formData.maintenanceIncluded
      };

      await axios.post("http://localhost:5001/api/vendor/quotations", payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess("Quotation submitted successfully");

      setTimeout(() => {
        navigate("/vendor/quotations");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit quotation");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Submit Quotation</h1>

      {error && (
        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-100 text-green-700 p-3 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <input
          type="text"
          name="componentName"
          placeholder="Component Name"
          value={formData.componentName}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />

        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="CPU">CPU</option>
          <option value="GPU">GPU</option>
          <option value="RAM">RAM</option>
          <option value="Storage">Storage</option>
          <option value="Networking">Networking</option>
          <option value="UPS">UPS</option>
        </select>

        <input
          type="number"
          name="unitPrice"
          placeholder="Unit Price"
          value={formData.unitPrice}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />

        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />

        <input
          type="text"
          name="warranty"
          placeholder="Warranty"
          value={formData.warranty}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />

        <input
          type="text"
          name="deliveryTime"
          placeholder="Delivery Timeline"
          value={formData.deliveryTime}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />

        <input
          type="number"
          name="totalPrice"
          placeholder="Total Price"
          value={formData.totalPrice}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />

        <input
          type="number"
          name="bulkDiscount"
          placeholder="Bulk Discount"
          value={formData.bulkDiscount}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="installationIncluded"
            checked={formData.installationIncluded}
            onChange={handleChange}
          />
          Installation Included
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="maintenanceIncluded"
            checked={formData.maintenanceIncluded}
            onChange={handleChange}
          />
          Maintenance Included
        </label>

        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit Quotation
        </button>
      </form>
    </div>
  );
};

export default SubmitQuotation;