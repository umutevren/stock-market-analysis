import React, { useState, useEffect } from 'react';
import './StockDashboard.css';
import StockOverview from './StockOverview';
import CompanyInfo from './CompanyInfo';
import NewsPanel from './NewsPanel';
import TechnicalAnalysis from './TechnicalAnalysis';
import AdvancedDashboard from './AdvancedDashboard';
import StockPredictions from './StockPredictions';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

const StockDashboard = ({ symbol, quote, profile, news, apiKey }) => {
  const [formattedQuote, setFormattedQuote] = useState(null);
  
  // Format quote data for display
  useEffect(() => {
    if (quote) {
      try {
        // Safely get values with fallbacks
        const currentPrice = quote.c || 0;
        const previousClose = quote.pc || currentPrice || 0;
        
        // Avoid division by zero
        const changeAmount = currentPrice - previousClose;
        const changePercent = previousClose !== 0 ? (changeAmount / previousClose) * 100 : 0;
        
        setFormattedQuote({
          currentPrice: currentPrice,
          previousClose: previousClose,
          change: changeAmount,
          changePercent: changePercent,
          high: quote.h || currentPrice || 0,
          low: quote.l || currentPrice || 0,
          open: quote.o || currentPrice || 0
        });
      } catch (err) {
        console.error('Error formatting quote data:', err);
      }
    }
  }, [quote]);
  
  if (!quote || !formattedQuote) return null;

  return (
    <div className="stock-dashboard">
      <div className="dashboard-header">
        <h2 className="stock-symbol">{symbol}</h2>
        {profile && profile.name && (
          <h3 className="company-name">{profile.name}</h3>
        )}
      </div>
      
      <div className="company-selector">
        <span className="selector-label">Select Company:</span>
        <div className="company-buttons">
          <button className={symbol === 'AAPL' ? 'active' : ''} onClick={() => window.stockApp.changeCompany('AAPL')}>AAPL</button>
          <button className={symbol === 'MSFT' ? 'active' : ''} onClick={() => window.stockApp.changeCompany('MSFT')}>MSFT</button>
          <button className={symbol === 'GOOGL' ? 'active' : ''} onClick={() => window.stockApp.changeCompany('GOOGL')}>GOOGL</button>
          <button className={symbol === 'AMZN' ? 'active' : ''} onClick={() => window.stockApp.changeCompany('AMZN')}>AMZN</button>
          <button className={symbol === 'TSLA' ? 'active' : ''} onClick={() => window.stockApp.changeCompany('TSLA')}>TSLA</button>
          <button className={symbol === 'META' ? 'active' : ''} onClick={() => window.stockApp.changeCompany('META')}>META</button>
          <button className={symbol === 'NFLX' ? 'active' : ''} onClick={() => window.stockApp.changeCompany('NFLX')}>NFLX</button>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <StockOverview symbol={symbol} quote={formattedQuote} />
        
        <Tabs className="dashboard-tabs">
          <TabList>
            <Tab>Advanced</Tab>
            <Tab>Technical</Tab>
            <Tab>Predictions</Tab>
            <Tab>Company Info</Tab>
            <Tab>News</Tab>
          </TabList>
          
          <TabPanel>
            <AdvancedDashboard symbol={symbol} />
          </TabPanel>
          
          <TabPanel>
            <TechnicalAnalysis symbol={symbol} />
          </TabPanel>
          
          <TabPanel>
            <StockPredictions symbol={symbol} />
          </TabPanel>
          
          <TabPanel>
            <CompanyInfo profile={profile} symbol={symbol} />
          </TabPanel>
          
          <TabPanel>
            <NewsPanel news={news} />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
};

export default StockDashboard; 