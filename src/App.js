import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Import axios
import './App.css';
import Header from './components/Header';
import StockDashboard from './components/StockDashboard';

function App() {
  const [stockData, setStockData] = useState(null);
  const [symbol, setSymbol] = useState('AAPL'); // Default to Apple
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // List of companies for the buttons
  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'GOOGL', name: 'Google' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'NFLX', name: 'Netflix' },
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'JPM', name: 'JPMorgan' },
    { symbol: 'BRK-B', name: 'Berkshire' },
  ];
  
  const fetchStockData = useCallback(async (stockSymbol) => {
    setLoading(true);
    setError(null);
    setStockData(null); // Clear previous data

    // --- Use local backend API ---
    const backendStockUrl = `http://localhost:5001/api/stock/${stockSymbol}`;

    try {
      console.log(`Fetching data for ${stockSymbol} from backend...`);
      
      // Fetch quote and profile data from local backend
      const stockResponse = await axios.get(backendStockUrl);

      if (!stockResponse.data) {
        throw new Error(`No data returned from backend for symbol ${stockSymbol}.`);
      }
      
      if (stockResponse.data.error) {
        throw new Error(stockResponse.data.error);
      }

      const backendData = stockResponse.data;
      
      // Verify key data is present
      if (!backendData.quote || !backendData.profile) {
        throw new Error(`Incomplete data received for ${stockSymbol}.`);
      }
      
      // Data is already formatted by the backend
      const formattedQuote = backendData.quote;
      const formattedProfile = backendData.profile;

      setStockData({
        symbol: stockSymbol,
        quote: formattedQuote,
        profile: formattedProfile
      });

    } catch (err) {
      console.error('Error fetching stock data:', err);
      let errorMessage = `Failed to fetch stock data for ${stockSymbol}.`;
      
      // Handle specific error messages from our backend
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } 
      // Handle specific error message formats from yfinance
      else if (err.message && (
        err.message.includes('No data found') || 
        err.message.includes('Invalid symbol') ||
        err.message.includes('Incomplete data')
      )) {
        errorMessage = err.message;
      } 
      // Handle HTTP status codes
      else if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          errorMessage = `Symbol ${stockSymbol} not found or invalid.`;
        } else if (err.response?.status === 500) {
          errorMessage = `Server error while fetching data for ${stockSymbol}. Please try again later.`;
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = `Request timeout. The backend server took too long to respond.`;
        } else if (!err.response && err.request) {
          // Network error - can't reach backend
          errorMessage = `Could not connect to backend server. Please ensure the Python backend is running.`;
        }
      }
      
      setError(errorMessage);
      setStockData(null); // Ensure no stale data is shown on error
    } finally {
      setLoading(false);
    }
  }, []); // Removed apiKey dependency as it's not used here
  
  // Function to change the company
  const changeCompany = (newSymbol) => {
    setSymbol(newSymbol);
  };
  
  // Automatically load data for the selected symbol
  useEffect(() => {
    fetchStockData(symbol);
  }, [symbol, fetchStockData]);
  
  return (
    <div className="app">
      <Header />
      
      <main className="app-content">
        <div className="container">
          {/* Add Company Selection Buttons */}
          <div className="company-selector">
            <p>Select Company:</p>
            {popularStocks.map((stock) => (
              <button 
                key={stock.symbol} 
                onClick={() => changeCompany(stock.symbol)}
                className={symbol === stock.symbol ? 'active' : ''}
              >
                {stock.name} ({stock.symbol})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading stock data...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <h2>Oops!</h2>
              <p>{error}</p>
              <p className="error-help">
                Make sure the Python backend server is running on port 5001.
              </p>
            </div>
          ) : stockData && (
            <StockDashboard
              symbol={stockData.symbol}
              quote={stockData.quote}
              profile={stockData.profile}
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