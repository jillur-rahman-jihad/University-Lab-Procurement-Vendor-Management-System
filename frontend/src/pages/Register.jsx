import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [role, setRole] = useState('university');
  const navigate = useNavigate();

  // Common Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    // University
    department: '',
    authRepName: '',
    authRepEmail: '',
    authRepPhone: '',
    // Vendor
    tradeLicenseNumber: '',
    // Consultant
    professionalCredentials: '',
    relevantExperience: '',
    certificationInformation: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Build payload matching backend expectations
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        role,
      };

      if (role === 'university') {
        payload.department = formData.department;
        payload.authorizedRepresentative = {
          name: formData.authRepName,
          email: formData.authRepEmail,
          phone: formData.authRepPhone
        };
      } else if (role === 'vendor') {
        payload.tradeLicenseNumber = formData.tradeLicenseNumber;
      } else if (role === 'consultant') {
        payload.professionalCredentials = formData.professionalCredentials;
        payload.relevantExperience = formData.relevantExperience;
        payload.certificationInformation = formData.certificationInformation;
      }

      const response = await axios.post('http://localhost:5001/api/auth/register', payload);
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div>
          <div className="flex justify-center mb-4">
            <span className="material-icons text-4xl text-blue-600">person_add</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex justify-center mb-8 border-b gap-4">
          {['university', 'vendor', 'consultant'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-4 py-2 capitalize font-medium text-sm transition-colors flex items-center gap-2 ${
                role === r
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>
                {r === 'university' ? 'school' : r === 'vendor' ? 'business' : 'engineering'}
              </span>
              {r}
            </button>
          ))}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
            {/* Common Fields */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>badge</span>
                Account Name
              </label>
              <input name="name" type="text" required value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder={role === 'university' ? 'University Name' : role === 'vendor' ? 'Company Name' : 'Full Name'} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>email</span>
                Email Address
              </label>
              <input name="email" type="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>lock</span>
                Password
              </label>
              <input name="password" type="password" required value={formData.password} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>phone</span>
                Phone Number
              </label>
              <input name="phone" type="text" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>location_on</span>
                Physical Address
              </label>
              <input name="address" type="text" value={formData.address} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>

            {/* University Specific Fields */}
            {role === 'university' && (
              <>
                <div className="sm:col-span-2 pt-4 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: '24px', color: '#3b82f6' }}>school</span>
                    University Details
                  </h3>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>category</span>
                    Department
                  </label>
                  <input name="department" type="text" required value={formData.department} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div className="sm:col-span-2 mt-2"><label className="block text-sm font-medium text-gray-500 flex items-center gap-2"><span className="material-icons" style={{ fontSize: '20px', color: '#9ca3af' }}>info</span>Authorized Representative</label></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>person</span>
                    Rep Name
                  </label>
                  <input name="authRepName" type="text" required value={formData.authRepName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>email</span>
                    Rep Email
                  </label>
                  <input name="authRepEmail" type="email" required value={formData.authRepEmail} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>phone</span>
                    Rep Phone
                  </label>
                  <input name="authRepPhone" type="text" required value={formData.authRepPhone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
              </>
            )}

            {/* Vendor Specific Fields */}
            {role === 'vendor' && (
              <>
                <div className="sm:col-span-2 pt-4 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: '24px', color: '#3b82f6' }}>business</span>
                    Vendor Details
                  </h3>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>assignment</span>
                    Trade License Number
                  </label>
                  <input name="tradeLicenseNumber" type="text" required value={formData.tradeLicenseNumber} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
              </>
            )}

            {/* Consultant Specific Fields */}
            {role === 'consultant' && (
              <>
                <div className="sm:col-span-2 pt-4 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: '24px', color: '#3b82f6' }}>engineering</span>
                    Consultant Details
                  </h3>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>card_membership</span>
                    Professional Credentials
                  </label>
                  <textarea name="professionalCredentials" required value={formData.professionalCredentials} onChange={handleChange} rows="2" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>work_history</span>
                    Relevant Experience
                  </label>
                  <textarea name="relevantExperience" required value={formData.relevantExperience} onChange={handleChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: '20px', color: '#3b82f6' }}>verified</span>
                    Certification Information
                  </label>
                  <textarea name="certificationInformation" required value={formData.certificationInformation} onChange={handleChange} rows="2" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
