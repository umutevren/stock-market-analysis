import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-container">
          <h1 className="logo">StockVision</h1>
          <p className="tagline">Advanced Stock Analysis & Predictions</p>
        </div>
      </div>
    </header>
  );
};

export default Header; 