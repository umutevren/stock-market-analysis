import React from 'react';
import './CompanyInfo.css';

const CompanyInfo = ({ profile, symbol }) => {
  if (!profile || Object.keys(profile).length === 0) {
    return <div className="no-company-data">Company information not available</div>;
  }
  
  const formatMarketCap = (marketCap) => {
    if (!marketCap) return 'N/A';
    
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(2)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(2)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  };

  return (
    <div className="company-info">
      <div className="company-header">
        {profile.logo && (
          <img src={profile.logo} alt={`${profile.name} logo`} className="company-logo" />
        )}
        <div className="company-title">
          <h3>{profile.name || 'N/A'}</h3>
          <p className="ticker-exchange">{profile.ticker || symbol || 'N/A'} • {profile.exchange || 'N/A'}</p>
        </div>
      </div>
      
      {profile.industry && (
        <div className="company-description">
          <p className="industry">{profile.industry}</p>
          {profile.description && <p>{profile.description}</p>}
        </div>
      )}
      
      <div className="company-details">
        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Country</span>
            <span className="detail-value">{profile.country || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Currency</span>
            <span className="detail-value">{profile.currency || 'N/A'}</span>
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Market Cap</span>
            <span className="detail-value">{formatMarketCap(profile.marketCap)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Exchange</span>
            <span className="detail-value">{profile.exchange || 'N/A'}</span>
          </div>
        </div>
        
        {profile.weburl && (
          <div className="detail-row">
            <div className="detail-item full-width">
              <span className="detail-label">Website</span>
              <span className="detail-value">
                <a href={profile.weburl} target="_blank" rel="noopener noreferrer">
                  {profile.weburl}
                </a>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyInfo; 