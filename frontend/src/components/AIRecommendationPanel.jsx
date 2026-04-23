import React, { useState, useEffect } from 'react';
import './AIRecommendationPanel.css';

const AIRecommendationPanel = ({ labProjectId, token }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('components');
  const [isGeneratedInCurrentSession, setIsGeneratedInCurrentSession] = useState(false);

  // Generate AI recommendation
  const generateRecommendation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:5001/api/labs/generate-recommendation/${labProjectId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate recommendation');
      }

      const data = await response.json();
      setRecommendation(data.recommendation);
      setIsGeneratedInCurrentSession(true);
    } catch (err) {
      setError(err.message);
      console.error('Error generating recommendation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Download recommendation as PDF
  const downloadRecommendationPDF = async () => {
    if (!recommendation) {
      setError('No recommendation available to download');
      return;
    }

    setDownloadLoading(true);
    try {
      // Generate CSV content from recommendation data
      let csvContent = 'AI BUILD RECOMMENDATION REPORT\n';
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Lab Project ID: ${labProjectId}\n`;
      csvContent += '\n---\n\n';

      // COMPONENTS SECTION
      csvContent += 'SECTION 1: RECOMMENDED COMPONENTS\n';
      csvContent += 'Category,Component Name,Unit Price,Quantity,Subtotal,Specs\n';
      recommendation.components?.forEach((comp) => {
        csvContent += `"${comp.category}","${comp.name}","৳${comp.unitPrice?.toLocaleString() || 0}","${comp.quantity}","৳${comp.subtotal?.toLocaleString() || 0}","${comp.specs || 'N/A'}"\n`;
      });
      csvContent += '\n---\n\n';

      // COST ANALYSIS SECTION
      csvContent += 'SECTION 2: COST ANALYSIS\n';
      csvContent += 'Metric,Value\n';
      csvContent += `"Component Cost","৳${recommendation.costAnalysis?.componentCost?.toLocaleString() || 0}"\n`;
      csvContent += `"Bulk Discount","${recommendation.costAnalysis?.bulkDiscountPercentage || '0'}%"\n`;
      csvContent += `"Discount Amount","৳${recommendation.costAnalysis?.discountAmount?.toLocaleString() || 0}"\n`;
      csvContent += `"Final Total Cost","৳${recommendation.costAnalysis?.finalTotalCost?.toLocaleString() || 0}"\n`;
      csvContent += `"Cost Per System","৳${recommendation.costAnalysis?.costPerSystem?.toLocaleString() || 0}"\n`;
      csvContent += `"Budget Status","${recommendation.costAnalysis?.budgetStatus || 'N/A'}"\n`;
      csvContent += '\n';

      // DETAILED BREAKDOWN TABLE
      csvContent += 'DETAILED BREAKDOWN\n';
      csvContent += 'Category,Component,Unit Price,Quantity,Subtotal\n';
      recommendation.costAnalysis?.costPerComponent?.forEach((item) => {
        csvContent += `"${item.category}","${item.name}","৳${item.unitPrice?.toLocaleString() || 0}","${item.quantity}","৳${item.subtotal?.toLocaleString() || 0}"\n`;
      });
      csvContent += '\n---\n\n';

      // POWER REQUIREMENTS SECTION
      csvContent += 'SECTION 3: POWER REQUIREMENTS\n';
      csvContent += 'Metric,Value\n';
      csvContent += `"Power Per System","${recommendation.powerRequirements?.powerPerSystem || 0} W"\n`;
      csvContent += `"Total Power Consumption","${recommendation.powerRequirements?.totalPowerConsumption || 0} W"\n`;
      csvContent += `"Recommended PSU Wattage","${recommendation.powerRequirements?.recommendedPSUWattage || 'N/A'}"\n`;
      csvContent += `"Recommended UPS Capacity","${recommendation.powerRequirements?.recommendedUPSCapacity || 'N/A'}"\n`;
      
      if (recommendation.powerRequirements?.coolingRecommendation) {
        csvContent += `"Heat Output (BTU/hr)","${recommendation.powerRequirements.coolingRecommendation.btuPerHour?.toLocaleString() || 0}"\n`;
        csvContent += `"Cooling Capacity (tons)","${recommendation.powerRequirements.coolingRecommendation.tonsCooling || 0}"\n`;
        csvContent += `"Cooling Recommendation","${recommendation.powerRequirements.coolingRecommendation.recommendation || 'N/A'}"\n`;
      }
      csvContent += '\n---\n\n';

      // SOFTWARE STACK SECTION
      csvContent += 'SECTION 4: SOFTWARE STACK\n';
      csvContent += 'Software\n';
      recommendation.softwareStack?.forEach((software) => {
        csvContent += `"${software}"\n`;
      });
      csvContent += '\n---\n\n';

      // ADDITIONAL RECOMMENDATIONS
      csvContent += 'SECTION 5: ADDITIONAL RECOMMENDATIONS\n';
      csvContent += 'Metric,Value\n';
      csvContent += `"Estimated Delivery Time","${recommendation.recommendations?.estimatedDeliveryTime || 'N/A'}"\n`;
      csvContent += `"Warranty Period","${recommendation.recommendations?.warrantyPeriod || 'N/A'}"\n`;
      csvContent += `"Annual Maintenance Cost","৳${recommendation.recommendations?.maintenanceCost?.toLocaleString() || 0}"\n`;
      csvContent += `"Equipment Lifespan","${recommendation.recommendations?.estimatedLifespan || 'N/A'}"\n`;

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `AI_Recommendation_${labProjectId}_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadLoading(false);
    } catch (err) {
      setError('Failed to download recommendation: ' + err.message);
      console.error('Error downloading PDF:', err);
      setDownloadLoading(false);
    }
  };

  // Fetch existing recommendation on mount or when lab changes
  useEffect(() => {
    // Reset session flag when lab changes
    setIsGeneratedInCurrentSession(false);
    setRecommendation(null);

    const fetchRecommendation = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/labs/get-recommendation/${labProjectId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.hasRecommendation) {
            setRecommendation(data.recommendation);
          }
        }
      } catch (err) {
        console.error('Error fetching recommendation:', err);
      }
    };

    if (labProjectId && token) {
      fetchRecommendation();
    }
  }, [labProjectId, token]);

  return (
    <div className="ai-recommendation-panel">
      <div className="recommendation-header">
        <h2>🤖 AI Build Recommendation System</h2>
        <p>Get intelligent hardware recommendations optimized for your lab type and budget</p>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      {!recommendation ? (
        <div className="generate-section">
          <p>Click the button below to generate AI-powered hardware recommendations based on your lab requirements.</p>
          <button
            className="generate-btn"
            onClick={generateRecommendation}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Generating Recommendations...
              </>
            ) : (
              <>✨ Generate AI Recommendations</>
            )}
          </button>
        </div>
      ) : (
        <div className="recommendation-content">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === 'components' ? 'active' : ''}`}
              onClick={() => setActiveTab('components')}
            >
              📦 Components
            </button>
            <button
              className={`tab-btn ${activeTab === 'cost' ? 'active' : ''}`}
              onClick={() => setActiveTab('cost')}
            >
              💰 Cost Analysis
            </button>
            <button
              className={`tab-btn ${activeTab === 'power' ? 'active' : ''}`}
              onClick={() => setActiveTab('power')}
            >
              ⚡ Power Requirements
            </button>
            <button
              className={`tab-btn ${activeTab === 'software' ? 'active' : ''}`}
              onClick={() => setActiveTab('software')}
            >
              💻 Software Stack
            </button>
          </div>

          {/* Components Tab */}
          {activeTab === 'components' && (
            <div className="tab-content">
              <h3>Recommended Components</h3>
              <div className="components-grid">
                {recommendation.components?.map((component, index) => (
                  <div key={index} className="component-card">
                    <div className="component-header">
                      <h4>{component.category}</h4>
                      <span className="qty-badge">×{component.quantity}</span>
                    </div>
                    <p className="component-name">{component.name}</p>
                    <p className="component-specs">{component.specs}</p>
                    <div className="component-footer">
                      <span className="price">৳{component.unitPrice?.toLocaleString()}</span>
                      <span className="subtotal">Subtotal: ৳{component.subtotal?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Analysis Tab */}
          {activeTab === 'cost' && (
            <div className="tab-content">
              <h3>Cost Analysis</h3>
              <div className="cost-summary">
                <div className="cost-row">
                  <span className="label">Component Cost:</span>
                  <span className="value">৳{recommendation.costAnalysis?.componentCost?.toLocaleString()}</span>
                </div>
                <div className="cost-row">
                  <span className="label">Bulk Discount ({recommendation.costAnalysis?.bulkDiscountPercentage}):</span>
                  <span className="value discount">-৳{recommendation.costAnalysis?.discountAmount?.toLocaleString()}</span>
                </div>
                <div className="cost-row total">
                  <span className="label">Final Total Cost:</span>
                  <span className="value total-price">{recommendation.costAnalysis?.finalTotalCostFormatted || `৳${recommendation.costAnalysis?.finalTotalCost?.toLocaleString()}`}</span>
                </div>
                <div className="cost-row">
                  <span className="label">Cost Per System:</span>
                  <span className="value">৳{recommendation.costAnalysis?.costPerSystem?.toLocaleString()}</span>
                </div>
              </div>

              <div className="budget-status">
                <h4>Budget Status</h4>
                <p className={recommendation.costAnalysis?.withinBudget ? 'status-good' : 'status-warning'}>
                  {recommendation.costAnalysis?.budgetStatus}
                </p>
              </div>

              <div className="detailed-breakdown">
                <h4>Detailed Breakdown</h4>
                <table className="breakdown-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Component</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendation.costAnalysis?.costPerComponent?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.category}</td>
                        <td>{item.name}</td>
                        <td>৳{item.unitPrice?.toLocaleString()}</td>
                        <td>{item.quantity}</td>
                        <td>৳{item.subtotal?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Power Requirements Tab */}
          {activeTab === 'power' && (
            <div className="tab-content">
              <h3>Power & Infrastructure Requirements</h3>

              <div className="power-summary">
                <div className="power-card">
                  <h4>Per System</h4>
                  <p className="power-value">{recommendation.powerRequirements?.powerPerSystem} W</p>
                </div>
                <div className="power-card">
                  <h4>Total Lab</h4>
                  <p className="power-value">{recommendation.powerRequirements?.totalPowerConsumption} W</p>
                </div>
              </div>

              <div className="infrastructure-requirements">
                <h4>Infrastructure Recommendations</h4>

                <div className="requirement-card">
                  <h5>⚡ PSU Wattage</h5>
                  <p>{recommendation.powerRequirements?.recommendedPSUWattage}</p>
                </div>

                <div className="requirement-card">
                  <h5>🔋 UPS Capacity</h5>
                  <p>{recommendation.powerRequirements?.recommendedUPSCapacity}</p>
                </div>

                <div className="requirement-card">
                  <h5>❄️ Cooling Requirements</h5>
                  <p>
                    <strong>Heat Output:</strong> {recommendation.powerRequirements?.coolingRecommendation?.btuPerHour?.toLocaleString()} BTU/hr<br/>
                    <strong>Cooling Capacity:</strong> {recommendation.powerRequirements?.coolingRecommendation?.tonsCooling} tons<br/>
                    <strong>Recommendation:</strong> {recommendation.powerRequirements?.coolingRecommendation?.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Software Stack Tab */}
          {activeTab === 'software' && (
            <div className="tab-content">
              <h3>Recommended Software Stack</h3>
              <div className="software-list">
                {recommendation.softwareStack?.map((software, index) => (
                  <div key={index} className="software-item">
                    <span className="software-icon">📦</span>
                    <span className="software-name">{software}</span>
                  </div>
                ))}
              </div>

              <div className="recommendations-box">
                <h4>Additional Recommendations</h4>
                <ul>
                  <li>
                    <strong>Estimated Delivery Time:</strong> {recommendation.recommendations?.estimatedDeliveryTime}
                  </li>
                  <li>
                    <strong>Warranty Period:</strong> {recommendation.recommendations?.warrantyPeriod}
                  </li>
                  <li>
                    <strong>Annual Maintenance Cost:</strong> ৳{recommendation.recommendations?.maintenanceCost?.toLocaleString()}
                  </li>
                  <li>
                    <strong>Equipment Lifespan:</strong> {recommendation.recommendations?.estimatedLifespan}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="regenerate-btn"
              onClick={generateRecommendation}
              disabled={loading}
            >
              🔄 Regenerate Recommendations
            </button>
            {recommendation && (
              <button 
                className="download-btn"
                onClick={downloadRecommendationPDF}
                disabled={downloadLoading || !isGeneratedInCurrentSession}
              >
                {downloadLoading ? (
                  <>
                    <span className="spinner"></span>
                    Downloading...
                  </>
                ) : (
                  <>📥 Download PDF</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommendationPanel;
