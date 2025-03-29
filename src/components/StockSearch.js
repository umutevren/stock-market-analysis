import React, { useState } from 'react';
import './StockSearch.css';

const StockSearch = ({ onStockChange, currentStock }) => {
  const [inputValue, setInputValue] = useState(currentStock || '');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onStockChange(inputValue.trim());
    }
  };

  // List of popular stocks for quick selection
  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'GOOGL', name: 'Alphabet' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'JPM', name: 'JPMorgan Chase' }
  ];

  return (
    <div className="stock-search">
      <form onSubmit={handleSubmit}>
        <div className="search-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter stock symbol (e.g., AAPL)"
            aria-label="Stock symbol"
          />
          <button type="submit">Track</button>
        </div>
      </form>
      
      <div className="popular-stocks">
        <h3>Popular Stocks:</h3>
        <div className="stock-buttons">
          {popularStocks.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => {
                setInputValue(stock.symbol);
                onStockChange(stock.symbol);
              }}
              className={currentStock === stock.symbol ? 'active' : ''}
            >
              {stock.symbol} - {stock.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockSearch; 