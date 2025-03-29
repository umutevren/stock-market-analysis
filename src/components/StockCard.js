import React from 'react';
import './StockCard.css';

const StockCard = ({ symbol, currentPrice, previousClose, high, low }) => {
  // Calculate price change in dollars and percentage
  const priceChange = currentPrice - previousClose;
  const priceChangePercent = (priceChange / previousClose) * 100;
  
  // Determine if price is up or down for styling
  const priceDirection = priceChange >= 0 ? 'up' : 'down';
  
  return (
    <div className="stock-card">
      <div className="stock-header">
        <h2>{symbol}</h2>
        <div className={`current-price ${priceDirection}`}>
          ${currentPrice.toFixed(2)}
        </div>
      </div>
      
      <div className={`price-change ${priceDirection}`}>
        <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)</span>
        <span className="time">Today</span>
      </div>
      
      <div className="stock-details">
        <div className="detail-item">
          <span className="label">Previous Close:</span>
          <span className="value">${previousClose.toFixed(2)}</span>
        </div>
        <div className="detail-item">
          <span className="label">Day Range:</span>
          <span className="value">${low.toFixed(2)} - ${high.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="range-visualization">
        <div className="range-bar">
          <div className="range-low">${low.toFixed(2)}</div>
          <div className="range-current" 
               style={{ 
                 left: `${((currentPrice - low) / (high - low)) * 100}%` 
               }}>
          </div>
          <div className="range-high">${high.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default StockCard; 