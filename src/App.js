import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import StockDashboard from './components/StockDashboard';

function App() {
  const [stockData, setStockData] = useState(null);
  const [symbol, setSymbol] = useState('AAPL'); // Default to Apple
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchStockData = useCallback(async (stockSymbol) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate successful API response for testing purposes
      const mockQuoteData = {
        regularMarketPrice: (stockSymbol === 'AAPL') ? 150.25 : 
                           (stockSymbol === 'MSFT') ? 325.50 : 
                           (stockSymbol === 'GOOGL') ? 135.85 : 
                           (stockSymbol === 'AMZN') ? 178.35 : 
                           (stockSymbol === 'TSLA') ? 215.45 : 
                           (stockSymbol === 'META') ? 410.85 : 
                           (stockSymbol === 'NFLX') ? 590.65 : 180.00,
        previousClose: (stockSymbol === 'AAPL') ? 148.75 : 
                      (stockSymbol === 'MSFT') ? 322.25 : 
                      (stockSymbol === 'GOOGL') ? 134.25 : 
                      (stockSymbol === 'AMZN') ? 175.65 : 
                      (stockSymbol === 'TSLA') ? 218.95 : 
                      (stockSymbol === 'META') ? 405.25 : 
                      (stockSymbol === 'NFLX') ? 585.35 : 178.50,
        regularMarketDayHigh: (stockSymbol === 'AAPL') ? 152.00 : 
                             (stockSymbol === 'MSFT') ? 328.75 : 
                             (stockSymbol === 'GOOGL') ? 137.50 : 
                             (stockSymbol === 'AMZN') ? 180.25 : 
                             (stockSymbol === 'TSLA') ? 220.85 : 
                             (stockSymbol === 'META') ? 415.95 : 
                             (stockSymbol === 'NFLX') ? 595.25 : 182.50,
        regularMarketDayLow: (stockSymbol === 'AAPL') ? 149.50 : 
                            (stockSymbol === 'MSFT') ? 321.75 : 
                            (stockSymbol === 'GOOGL') ? 134.15 : 
                            (stockSymbol === 'AMZN') ? 175.15 : 
                            (stockSymbol === 'TSLA') ? 213.25 : 
                            (stockSymbol === 'META') ? 404.75 : 
                            (stockSymbol === 'NFLX') ? 583.15 : 177.50,
        regularMarketOpen: (stockSymbol === 'AAPL') ? 149.75 : 
                          (stockSymbol === 'MSFT') ? 323.15 : 
                          (stockSymbol === 'GOOGL') ? 134.95 : 
                          (stockSymbol === 'AMZN') ? 176.45 : 
                          (stockSymbol === 'TSLA') ? 217.85 : 
                          (stockSymbol === 'META') ? 406.55 : 
                          (stockSymbol === 'NFLX') ? 587.85 : 179.25,
        longName: (stockSymbol === 'AAPL') ? "Apple Inc." : 
                 (stockSymbol === 'MSFT') ? "Microsoft Corporation" : 
                 (stockSymbol === 'GOOGL') ? "Alphabet Inc." : 
                 (stockSymbol === 'AMZN') ? "Amazon.com, Inc." : 
                 (stockSymbol === 'TSLA') ? "Tesla, Inc." : 
                 (stockSymbol === 'META') ? "Meta Platforms, Inc." : 
                 (stockSymbol === 'NFLX') ? "Netflix, Inc." : 
                 stockSymbol + " Inc.",
        symbol: stockSymbol,
        fullExchangeName: "NASDAQ",
        industry: (stockSymbol === 'AAPL' || stockSymbol === 'MSFT') ? "Technology" : 
                 (stockSymbol === 'GOOGL' || stockSymbol === 'META') ? "Internet Content & Information" : 
                 (stockSymbol === 'AMZN') ? "Internet Retail" : 
                 (stockSymbol === 'TSLA') ? "Auto Manufacturers" : 
                 (stockSymbol === 'NFLX') ? "Entertainment" : "Technology",
        marketCap: (stockSymbol === 'AAPL') ? 2450000000000 :
                  (stockSymbol === 'MSFT') ? 2500000000000 : 
                  (stockSymbol === 'GOOGL') ? 1750000000000 : 
                  (stockSymbol === 'AMZN') ? 1850000000000 : 
                  (stockSymbol === 'TSLA') ? 686000000000 : 
                  (stockSymbol === 'META') ? 1050000000000 : 
                  (stockSymbol === 'NFLX') ? 258000000000 : 500000000000,
        country: "United States",
        currency: "USD"
      };
      
      // Format quote data
      const formattedQuote = {
        c: mockQuoteData.regularMarketPrice || 0,
        pc: mockQuoteData.previousClose || 0,
        h: mockQuoteData.regularMarketDayHigh || 0,
        l: mockQuoteData.regularMarketDayLow || 0,
        o: mockQuoteData.regularMarketOpen || 0
      };
      
      // Format company profile data
      const formattedProfile = {
        name: mockQuoteData.longName || mockQuoteData.shortName || '',
        ticker: mockQuoteData.symbol || '',
        exchange: mockQuoteData.fullExchangeName || '',
        industry: mockQuoteData.industry || '',
        marketCap: mockQuoteData.marketCap || 0,
        country: mockQuoteData.country || '',
        currency: mockQuoteData.currency || 'USD'
      };
      
      // Mock news data
      const mockNews = [
        {
          category: "article",
          datetime: new Date().toISOString(),
          headline: "Latest News About " + stockSymbol,
          id: "news-1",
          related: stockSymbol,
          source: "Financial News",
          summary: "This is a sample news article about " + stockSymbol + " for demonstration purposes.",
          url: "https://example.com/news/1"
        },
        {
          category: "article",
          datetime: new Date().toISOString(),
          headline: "Market Analysis: " + stockSymbol + " Performance",
          id: "news-2",
          related: stockSymbol,
          source: "Market Insights",
          summary: "A comprehensive analysis of " + stockSymbol + "'s market performance and future outlook.",
          url: "https://example.com/news/2"
        }
      ];
      
      setStockData({
        symbol: stockSymbol,
        quote: formattedQuote,
        profile: formattedProfile,
        news: mockNews
      });
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError(`Failed to fetch stock data. Please check the symbol and try again.`);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Function to change the company
  const changeCompany = (newSymbol) => {
    setSymbol(newSymbol);
  };
  
  // Expose the changeCompany function globally for the buttons to use
  React.useEffect(() => {
    window.stockApp = {
      changeCompany
    };
    return () => {
      delete window.stockApp;
    };
  }, []);
  
  // Automatically load data for the selected symbol
  useEffect(() => {
    fetchStockData(symbol);
  }, [symbol, fetchStockData]);
  
  return (
    <div className="app">
      <Header />
      
      <main className="app-content">
        <div className="container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading stock data...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <h2>Oops!</h2>
              <p>{error}</p>
            </div>
          ) : stockData && (
            <StockDashboard
              symbol={stockData.symbol}
              quote={stockData.quote}
              profile={stockData.profile}
              news={stockData.news}
              apiKey=""
            />
          )}
        </div>
      </main>
      
      <footer className="app-footer">
        <div className="container">
          <p>StockVision &copy; {new Date().getFullYear()} | Advanced Stock Analysis & Predictions</p>
        </div>
      </footer>
    </div>
  );
}

export default App; 