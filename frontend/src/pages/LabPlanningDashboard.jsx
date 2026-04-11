import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LabPlanningDashboard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedLabType, setSelectedLabType] = useState(null);
  const [entryMethod, setEntryMethod] = useState('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    labName: '',
    components: '',
    numberOfSystems: '',
    budgetRange: ''
  });
  
  const labTypes = [
    'Normal Usage Lab',
    'Graphics Lab',
    'Networking Lab',
    'Thesis/Research Lab',
    'AI/ML Lab',
    'Custom Lab'
  ];

  const handleLabTypeSelect = (type) => {
    setSelectedLabType(type);
  };

  const handleNextStep = () => {
    if (selectedLabType) {
      setStep(2);
      setError('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;

      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      if (entryMethod === 'manual') {
        if (!formData.labName || !formData.components || !formData.numberOfSystems || !formData.budgetRange) {
          setError('Please fill in all required fields.');
          setLoading(false);
          return;
        }

        const componentsArray = formData.components
          .split(',')
          .map(comp => comp.trim())
          .filter(comp => comp);

        const payload = {
          name: formData.labName,
          type: selectedLabType,
          components: componentsArray,
          budget: parseInt(formData.budgetRange),
          performancePriority: 'medium'
        };

        const response = await axios.post(
          'http://localhost:5001/api/labs/create',
          payload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setSuccess('Lab created successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create lab. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Select Lab Type
  if (step === 1) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900">Create Lab Project</h1>
          <p className="mt-4 text-lg text-gray-600">Select the type of lab you want to create</p>
        </div>

        {/* Lab Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {labTypes.map((type) => (
            <div
              key={type}
              onClick={() => handleLabTypeSelect(type)}
              className={`p-8 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                selectedLabType === type
                  ? 'bg-white border-2 border-blue-600 shadow-lg'
                  : 'bg-white border-2 border-gray-200 shadow'
              }`}
            >
              <h2 className="text-xl font-bold text-black text-center">{type}</h2>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleNextStep}
            disabled={!selectedLabType}
            className={`px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
              selectedLabType
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Enter Lab Details
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Create Lab - {selectedLabType}</h1>
        <p className="mt-2 text-gray-600">Fill in the lab details</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 p-4 rounded-md">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
        <div className="p-8">
          {/* Lab Name */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lab Name *
            </label>
            <input
              type="text"
              name="labName"
              value={formData.labName}
              onChange={handleInputChange}
              placeholder="Enter lab name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Entry Method Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              How would you like to enter lab details? *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setEntryMethod('manual')}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  entryMethod === 'manual'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">Manual Entry</h3>
                <p className="text-sm text-gray-600">Enter lab components and specifications manually</p>
              </div>

              <div
                onClick={() => setEntryMethod('upload')}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  entryMethod === 'upload'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">Upload Document</h3>
                <p className="text-sm text-gray-600">Upload a document with lab specifications</p>
              </div>
            </div>
          </div>

          {/* Manual Entry Fields */}
          {entryMethod === 'manual' && (
            <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Components * (comma separated)
                </label>
                <textarea
                  name="components"
                  value={formData.components}
                  onChange={handleInputChange}
                  placeholder="e.g., Microscope, Centrifuge, Incubator"
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Separate each component with a comma</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Systems *
                </label>
                <input
                  type="number"
                  name="numberOfSystems"
                  value={formData.numberOfSystems}
                  onChange={handleInputChange}
                  placeholder="e.g., 5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Range * (USD)
                </label>
                <input
                  type="number"
                  name="budgetRange"
                  value={formData.budgetRange}
                  onChange={handleInputChange}
                  placeholder="e.g., 50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Upload Document Option */}
          {entryMethod === 'upload' && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <button
                type="button"
                className="w-full px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-all"
              >
                <div className="text-center">
                  <p className="text-gray-600">Upload Lab Specifications Document</p>
                  <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOC, DOCX</p>
                </div>
              </button>
              <p className="mt-4 text-sm text-gray-600 text-center">
                (This feature will be implemented in the next phase)
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-100 px-8 py-6 flex gap-4 justify-end rounded-b-lg">
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setError('');
            }}
            className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </button>
          {entryMethod === 'manual' && (
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Creating...' : 'Create Lab'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default LabPlanningDashboard;
