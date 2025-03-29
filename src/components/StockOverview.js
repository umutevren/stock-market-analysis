import React from 'react';
import './StockOverview.css';

const StockOverview = ({ symbol, quote }) => {
  // Determine class based on whether the stock price increased or decreased
  const priceChangeClass = quote.change >= 0 ? 'positive' : 'negative';
  
  // Format numbers for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const formatPercentage = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always'
    }).format(value / 100);
  };

  // Calculate the position percentage for the current price in the day's range
  const rangePercentage = Math.max(0, Math.min(100, ((quote.currentPrice - quote.low) / (quote.high - quote.low)) * 100));

  return (
    <div className="stock-overview">
      <div className="current-price-container">
        <span className="current-price">{formatCurrency(quote.currentPrice)}</span>
        <div className={`price-change ${priceChangeClass}`}>
          <span className="change-icon">
            {quote.change >= 0 ? '▲' : '▼'}
          </span>
          <span className="change-amount">{formatCurrency(quote.change)}</span>
          <span className="change-percent">{formatPercentage(quote.changePercent)}</span>
        </div>
      </div>
      
      <div className="stats-container">
        <div className="stat-row">
          <div className="stat-item">
            <span className="stat-label">Previous Close</span>
            <span className="stat-value">{formatCurrency(quote.previousClose)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Open</span>
            <span className="stat-value">{formatCurrency(quote.open)}</span>
          </div>
        </div>
        
        <div className="stat-row">
          <div className="stat-item">
            <span className="stat-label">Day's High</span>
            <span className="stat-value">{formatCurrency(quote.high)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Day's Low</span>
            <span className="stat-value">{formatCurrency(quote.low)}</span>
          </div>
        </div>
      </div>
      
      <div className="range-bar-container">
        <h4 className="range-title">Today's Price Range</h4>
        <div className="range-bar">
          <div className="range-bar-track">
            <div 
              className="range-bar-fill" 
              style={{ 
                width: `${rangePercentage}%` 
              }}
            ></div>
            <div 
              className="range-marker" 
              style={{ 
                left: `${rangePercentage}%` 
              }}
            ></div>
          </div>
          <div className="range-labels">
            <span className="range-low">{formatCurrency(quote.low)}</span>
            <span className="range-high">{formatCurrency(quote.high)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockOverview; 