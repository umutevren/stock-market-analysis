import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './PriceChart.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Cache duration for historical data (15 minutes)
const CACHE_DURATION = 15 * 60 * 1000;

const PriceChart = ({ symbol, apiKey, dataCache, setDataCache }) => {
  const [chartData, setChartData] = useState(null);
  const [timeRange, setTimeRange] = useState('1D'); // Default to 1 day
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState({});

  useEffect(() => {
    if (!symbol || !apiKey) return;

    const fetchHistoricalData = async () => {
      // Skip fetch if API key isn't provided
      if (!apiKey.trim()) {
        setError('Please enter your Finnhub API key');
        return;
      }
      
      // Generate a cache key based on symbol and time range
      const cacheKey = `${symbol}_${timeRange}_history`;
      
      // Check if we have cached data that's still fresh
      const cachedData = dataCache[cacheKey];
      const lastFetch = lastFetchTime[cacheKey] || 0;
      const now = Date.now();
      
      // If we have fresh cached data, use it
      if (cachedData && (now - lastFetch < CACHE_DURATION)) {
        setChartData(cachedData);
        setLoading(false);
        setError('');
        return;
      }
      
      setLoading(true);
      setError('');
      
      try {
        // Add a small delay to prevent hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Calculate time range parameters
        const to = Math.floor(Date.now() / 1000);
        let from, resolution;
        
        switch (timeRange) {
          case '1D':
            from = to - 24 * 60 * 60; // 1 day in seconds
            resolution = '30'; // 30 minute intervals (reduced from 5 for free tier)
            break;
          case '1W':
            from = to - 7 * 24 * 60 * 60; // 1 week in seconds
            resolution = '60'; // 1 hour intervals
            break;
          case '1M':
            from = to - 30 * 24 * 60 * 60; // 1 month in seconds
            resolution = 'D'; // Daily intervals
            break;
          case '3M':
            from = to - 90 * 24 * 60 * 60; // 3 months in seconds
            resolution = 'D'; // Daily intervals
            break;
          case '1Y':
            from = to - 365 * 24 * 60 * 60; // 1 year in seconds
            resolution = 'W'; // Weekly intervals
            break;
          default:
            from = to - 24 * 60 * 60; // Default to 1 day
            resolution = '30'; // 30 minute intervals
        }
        
        const response = await fetch(
          `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`
        );
        
        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
          } else if (response.status === 403) {
            throw new Error('API access denied. Please check your API key.');
          } else {
            throw new Error(`Failed to fetch historical data (Status: ${response.status})`);
          }
        }
        
        const data = await response.json();
        
        if (data.s === 'no_data') {
          throw new Error('No historical data available for this time range. This may be because the stock is not supported in the free tier.');
        }
        
        // Process data for Chart.js
        const labels = data.t.map(timestamp => {
          const date = new Date(timestamp * 1000);
          
          if (timeRange === '1D') {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else if (timeRange === '1W' || timeRange === '1M') {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
          }
        });
        
        // Prepare data for Chart.js
        const processedData = {
          labels,
          datasets: [
            {
              label: symbol,
              data: data.c, // Closing prices
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              tension: 0.1,
            },
          ],
        };
        
        // Update the chart data
        setChartData(processedData);
        
        // Save to cache
        if (setDataCache) {
          setDataCache(prev => ({
            ...prev,
            [cacheKey]: processedData
          }));
          
          setLastFetchTime(prev => ({
            ...prev,
            [cacheKey]: now
          }));
        }
        
        setError('');
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError(err.message || 'Error fetching historical data');
        setChartData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [symbol, timeRange, apiKey, dataCache, setDataCache]);

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${symbol} Price History (${timeRange})`,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `$${value.toFixed(2)}`,
        },
      },
    },
  };

  return (
    <div className="price-chart">
      <div className="time-range-selector">
        <button 
          className={timeRange === '1D' ? 'active' : ''} 
          onClick={() => setTimeRange('1D')}
        >
          1D
        </button>
        <button 
          className={timeRange === '1W' ? 'active' : ''} 
          onClick={() => setTimeRange('1W')}
        >
          1W
        </button>
        <button 
          className={timeRange === '1M' ? 'active' : ''} 
          onClick={() => setTimeRange('1M')}
        >
          1M
        </button>
        <button 
          className={timeRange === '3M' ? 'active' : ''} 
          onClick={() => setTimeRange('3M')}
        >
          3M
        </button>
        <button 
          className={timeRange === '1Y' ? 'active' : ''} 
          onClick={() => setTimeRange('1Y')}
        >
          1Y
        </button>
      </div>
      
      {loading && <div className="loading">Loading chart data...</div>}
      {error && <div className="chart-error">{error}</div>}
      
      {chartData && !loading && !error && (
        <div className="chart-container">
          <Line options={options} data={chartData} />
        </div>
      )}
      
      <div className="chart-info">
        <p className="chart-note">Note: Historical data is cached for 15 minutes to reduce API calls</p>
        <p className="api-limits">Free Finnhub account limits apply</p>
      </div>
    </div>
  );
};

export default PriceChart; 