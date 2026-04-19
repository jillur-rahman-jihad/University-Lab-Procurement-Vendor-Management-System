import React from 'react';

const ConsultantSearchCard = ({ consultant }) => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  const info = consultant.consultantInfo || {};

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      {/* Profile Photo */}
      <div className="flex justify-center mb-4">
        {info.profilePhoto ? (
          <img
            src={`${API_URL}${info.profilePhoto}`}
            alt={consultant.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-blue-600"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center border-2 border-gray-400">
            <span className="text-gray-500 text-sm">No Photo</span>
          </div>
        )}
      </div>

      {/* Consultant Name and Type Badge */}
      <div className="text-center mb-3">
        <h3 className="text-lg font-semibold mb-2">{consultant.name}</h3>
        {/* Consultant Type Badge */}
        <div className="flex justify-center mb-2">
          {(() => {
            const level = info.experienceLevel || 'General';
            let badgeColor = 'bg-blue-100 text-blue-800';
            let badgeEmoji = '👤';
            
            if (level === 'Certified') {
              badgeColor = 'bg-amber-100 text-amber-800';
              badgeEmoji = '⭐';
            } else if (level === 'Professional') {
              badgeColor = 'bg-purple-100 text-purple-800';
              badgeEmoji = '💎';
            }
            
            return (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}>
                {badgeEmoji} {level}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Email and Phone */}
      <div className="text-sm text-gray-600 space-y-1 mb-3 border-b pb-3">
        <p><strong>Email:</strong> {consultant.email}</p>
        <p><strong>Phone:</strong> {consultant.phone || 'N/A'}</p>
      </div>

      {/* Expertise */}
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 mb-1">
          <strong>Expertise:</strong>
        </p>
        {info.expertise && info.expertise.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {info.expertise.map((exp) => (
              <span key={exp} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                {exp}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No expertise listed</p>
        )}
      </div>

      {/* Rating */}
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700">
          <strong>Rating:</strong> <span className="text-yellow-500">{info.rating || 0} ⭐</span>
        </p>
      </div>

      {/* Availability */}
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
        <span className="text-sm font-medium text-gray-700">Availability:</span>
        <span className={`text-sm font-semibold ${info.availability ? 'text-green-600' : 'text-red-600'}`}>
          {info.availability ? '✓ Available' : '✗ Not Available'}
        </span>
      </div>
    </div>
  );
};

export default ConsultantSearchCard;
