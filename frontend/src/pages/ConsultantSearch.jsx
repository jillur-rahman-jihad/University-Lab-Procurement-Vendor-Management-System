import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ConsultantSearchCard from '../components/ConsultantSearchCard';

const ConsultantSearch = () => {
  const navigate = useNavigate();
  const [selectedExpertise, setSelectedExpertise] = useState('');
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const EXPERTISE_OPTIONS = ["Networking", "Graphics", "Research", "AI Infrastructure"];
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // MODULE 2 - Task 1: Search consultants by expertise
  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSearched(true);

    try {
      const url = selectedExpertise 
        ? `${API_URL}/api/university/search-consultants?expertise=${selectedExpertise}`
        : `${API_URL}/api/university/search-consultants`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConsultants(response.data.consultants || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search consultants: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">Search Consultants</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
        >
          Logout
        </button>
      </nav>

      {/* Search Section */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Search Consultants by Expertise</h2>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Expertise Area
              </label>
              <select
                value={selectedExpertise}
                onChange={(e) => setSelectedExpertise(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- All Expertise Areas --</option>
                {EXPERTISE_OPTIONS.map((exp) => (
                  <option key={exp} value={exp}>
                    {exp}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedExpertise('');
                  setConsultants([]);
                  setSearched(false);
                  setError(null);
                }}
                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium"
              >
                Clear
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="space-y-4">
          {searched && (
            <>
              {loading ? (
                <div className="text-center p-8">
                  <p className="text-gray-500">Loading consultants...</p>
                </div>
              ) : consultants.length > 0 ? (
                <>
                  <h3 className="text-lg font-semibold">
                    Found {consultants.length} Consultant{consultants.length !== 1 ? 's' : ''}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {consultants.map((consultant) => (
                      <ConsultantSearchCard
                        key={consultant._id}
                        consultant={consultant}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center p-8 bg-white rounded-lg">
                  <p className="text-gray-500">No consultants found matching your criteria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultantSearch;
