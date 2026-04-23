import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
const LabPlanningDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedLabType, setSelectedLabType] = useState(null);
  const [entryMethod, setEntryMethod] = useState('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [originalProjectId, setOriginalProjectId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(false);

  const [formData, setFormData] = useState({
    labName: '',
    mainRequirement: '',
    software: '',
    numberOfSystems: '',
    budgetMin: '',
    budgetMax: '',
    performancePriority: '',
    timeline: ''
  });

  // Check for reorder mode on mount
  useEffect(() => {
    const reorderId = searchParams.get('reorder');
    if (reorderId) {
      setIsReorderMode(true);
      setOriginalProjectId(reorderId);
      fetchProjectForPrefill(reorderId);
    }
  }, [searchParams]);

  const fetchProjectForPrefill = async (projectId) => {
    try {
      setInitialLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;

      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/labs/${projectId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const project = response.data;

      // Prefill the form
      setSelectedLabType(project.labType);
      setFormData({
        labName: project.labName,
        mainRequirement: project.requirements?.mainRequirement || '',
        software: (project.requirements?.software || []).join(', '),
        numberOfSystems: project.requirements?.systems || '',
        budgetMin: project.requirements?.budgetMin || '',
        budgetMax: project.requirements?.budgetMax || '',
        performancePriority: project.requirements?.performancePriority || '',
        timeline: project.requirements?.timeline || ''
      });

      setStep(2); // Go directly to form step
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project for reordering.');
    } finally {
      setInitialLoading(false);
    }
  };
  
  const labTypes = [
    { value: 'Normal', label: 'Normal Usage Lab' },
    { value: 'Graphics', label: 'Graphics Lab' },
    { value: 'Networking', label: 'Networking Lab' },
    { value: 'Thesis', label: 'Thesis/Research Lab' },
    { value: 'AI', label: 'AI/ML Lab' },
    { value: 'Other', label: 'Other' }
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
        if (!formData.labName || !formData.mainRequirement || !formData.software || !formData.numberOfSystems || !formData.budgetMin || !formData.budgetMax || !formData.timeline) {
          setError('Please fill in all required fields.');
          setLoading(false);
          return;
        }

        const softwareArray = formData.software
          .split(',')
          .map(sw => sw.trim())
          .filter(sw => sw);

        const payload = {
          labName: formData.labName,
          labType: selectedLabType,
          requirements: {
            mainRequirement: formData.mainRequirement,
            systems: Number(formData.numberOfSystems),
            budgetMin: Number(formData.budgetMin),
            budgetMax: Number(formData.budgetMax),
            performancePriority: formData.performancePriority,
            software: softwareArray,
            ...(formData.timeline && { timeline: formData.timeline })
          }
        };

        const response = await axios.post(
          `${API_URL}/api/labs/create`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setSuccess(isReorderMode ? 'Reorder created successfully as a new draft!' : 'Lab created successfully!');
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

      const formDataPayload = new FormData();
      formDataPayload.append('document', file);

      const response = await axios.post(
        `${API_URL}/api/labs/upload-pdf`,
        formDataPayload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const { requirements } = response.data;
      
      setFormData(prev => ({
        ...prev,
        mainRequirement: requirements.mainRequirement || '',
        software: requirements.software || ''
      }));
      
      setSuccess('PDF parsed successfully! Please review the extracted details.');
      setEntryMethod('manual'); // switch back to manual entry to allow user to review
    } catch (err) {
      console.error('Upload Error:', err);
      setError(err.response?.data?.message || 'Failed to parse PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Select Lab Type
  if (step === 1) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="material-icons text-4xl text-blue-600">construction</span>
                <h1 className="text-3xl font-extrabold text-gray-900">Create Lab Project</h1>
              </div>
              <p className="mt-4 text-lg text-gray-600">Select the type of lab you want to create</p>
            </div>

          </div>
        </div>

        {/* Lab Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {labTypes.map((type) => {
            const iconMap = {
              'Normal': 'computer',
              'Graphics': 'palette',
              'Networking': 'cloud',
              'Thesis': 'school',
              'AI': 'smart_toy',
              'Other': 'more_horiz'
            };
            return (
              <div
                key={type.value}
                onClick={() => handleLabTypeSelect(type.value)}
                className={`p-8  cursor-pointer transition-all transform hover:scale-105 ${
                  selectedLabType === type.value
                    ? 'bg-white border-2 border-blue-600 shadow-lg'
                    : 'bg-white border-2 border-gray-200 shadow'
                }`}
              >
                <div className="text-center">
                  <span className="material-icons text-4xl" style={{ display: 'inline-block', color: selectedLabType === type.value ? '#3b82f6' : '#6b7280', marginBottom: '8px' }}>{iconMap[type.value]}</span>
                  <h2 className="text-xl font-bold text-black">{type.label}</h2>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>arrow_back</span>
            Back
          </button>
          <button
            onClick={handleNextStep}
            disabled={!selectedLabType}
            className={`px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white flex items-center gap-2 ${
              selectedLabType
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>arrow_forward</span>
            Next
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Enter Lab Details
  if (initialLoading && isReorderMode) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-gray-600">Loading project for reorder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-icons text-4xl text-blue-600">{isReorderMode ? 'refresh' : 'edit'}</span>
            <h1 className="text-3xl font-extrabold text-gray-900">
              {isReorderMode ? 'Reorder Lab' : 'Create Lab'} - {labTypes.find(t => t.value === selectedLabType)?.label}
            </h1>
          </div>
          <p className="mt-2 text-gray-600">
            {isReorderMode ? 'Edit the lab details and create a new draft' : 'Fill in the lab details'}
          </p>
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

      <form onSubmit={handleSubmit} className="bg-white shadow ">
        <div className="p-8">
          {/* Lab Name */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>label</span>
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
            <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>input</span>
              How would you like to enter lab details? *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setEntryMethod('manual')}
                className={`p-6  border-2 cursor-pointer transition-all ${
                  entryMethod === 'manual'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="material-icons" style={{ fontSize: '24px', color: '#3b82f6' }}>edit_note</span>
                  Manual Entry
                </h3>
                <p className="text-sm text-gray-600">Enter lab components and specifications manually</p>
              </div>

              <div
                onClick={() => setEntryMethod('upload')}
                className={`p-6  border-2 cursor-pointer transition-all ${
                  entryMethod === 'upload'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="material-icons" style={{ fontSize: '24px', color: '#3b82f6' }}>cloud_upload</span>
                  Upload Document
                </h3>
                <p className="text-sm text-gray-600">Upload  course outline of the lab</p>
              </div>
            </div>
          </div>

          {/* Manual Entry Fields */}
          {entryMethod === 'manual' && (
            <div className="space-y-6 bg-gray-100 p-6 rounded">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>assignment</span>
                  Main Lab Project Requirement *
                </label>
                <textarea
                  name="mainRequirement"
                  value={formData.mainRequirement}
                  onChange={handleInputChange}
                  placeholder="e.g., We need a high-performance lab capable of rendering 3D graphics and running neural network models."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>apps</span>
                  Required Software * (comma separated)
                </label>
                <textarea
                  name="software"
                  value={formData.software}
                  onChange={handleInputChange}
                  placeholder="e.g., MATLAB, AutoCAD, VS Code"
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                  <span className="material-icons" style={{ fontSize: '14px' }}>info</span>
                  Separate each software with a comma
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>devices</span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>trending_down</span>
                    Minimum Budget * 
                  </label>
                  <input
                    type="number"
                    name="budgetMin"
                    value={formData.budgetMin}
                    onChange={handleInputChange}
                    placeholder="e.g., 10000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>trending_up</span>
                    Maximum Budget *
                  </label>
                  <input
                    type="number"
                    name="budgetMax"
                    value={formData.budgetMax}
                    onChange={handleInputChange}
                    placeholder="e.g., 50000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>speed</span>
                  Performance Priority *
                </label>
                <select
                  name="performancePriority"
                  value={formData.performancePriority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>calendar_today</span>
                  Timeline / Expected Completion Date *
                </label>
                <input
                  type="date"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Upload Document Option */}
          {entryMethod === 'upload' && (
            <div className="bg-gray-50 p-6 ">
              <label className={`w-full px-10 py-3 border-2 border-dashed ${loading ? 'border-blue-800 bg-blue-50' : 'border-gray-400 hover:border-blue-900'}  transition-all cursor-pointer block`}> 
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  disabled={loading}
                />
                <div className="text-center">
                  <span className="material-icons text-4xl text-blue-600" style={{ display: 'inline-block' }}>file_upload</span>
                  <p className="text-gray-600 mt-2">Upload Course Outline</p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                    <span className="material-icons" style={{ fontSize: '14px' }}>description</span>
                    PDF Only
                  </p>
                </div>
              </label>
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
            className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>arrow_back</span>
            Back
          </button>
          {entryMethod === 'manual' && (
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white flex items-center gap-2 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>{loading ? 'hourglass_top' : 'check_circle'}</span>
              {loading ? 'Creating...' : (isReorderMode ? 'Create Reorder' : 'Create Lab')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default LabPlanningDashboard;
