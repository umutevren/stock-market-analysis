import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import axios from 'axios';
import './AdvancedDashboard.css';

const AdvancedDashboard = ({ symbol }) => {
  const [timeframe, setTimeframe] = useState('1mo');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previousClose, setPreviousClose] = useState(null);
  
  React.useEffect(() => {
    const fetchData = async () => {
      if (!symbol) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Determine appropriate interval based on timeframe
        const interval = timeframe === '1d' ? '5m' : 
                      timeframe === '5d' ? '30m' : 
                      timeframe === '1mo' ? '1d' : 
                      timeframe === '6mo' ? '1d' :
                      timeframe === '1y' ? '1d' :
                      timeframe === '3y' ? '1wk' :
                      timeframe === '5y' ? '1wk' : '1mo';
        
        // Using a CORS proxy to access Yahoo Finance data
        const proxyUrl = 'https://corsproxy.io/?';
        const baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?`;
        
        const params = new URLSearchParams({
          interval: interval,
          range: timeframe
        }).toString();
        
        const response = await axios.get(`${proxyUrl}${baseUrl}${params}`);
        
        if (response.data && response.data.chart && 
            response.data.chart.result && 
            response.data.chart.result[0]) {
          
          const result = response.data.chart.result[0];
          const timestamps = result.timestamp || [];
          const quotes = result.indicators.quote[0] || {};
          const closes = quotes.close || [];
          const volumes = quotes.volume || [];
          
          // Get previous close for reference line
          setPreviousClose(result.meta.previousClose);
          
          // Format data for charts
          const formattedData = timestamps.map((timestamp, index) => {
            const date = new Date(timestamp * 1000);
            let dateStr;
            
            // Format dates differently based on timeframe
            if (timeframe === '1d') {
              dateStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (timeframe === '5d') {
              dateStr = `${date.getMonth()+1}/${date.getDate()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            } else if (['1mo', '6mo', '1y'].includes(timeframe)) {
              dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            } else {
              // For longer timeframes, just show month and year
              dateStr = date.toLocaleDateString([], { month: 'short', year: 'numeric' });
            }
            
            return {
              date: dateStr,
              close: closes[index] || null,
              volume: volumes[index] || 0,
              timestamp
            };
          }).filter(item => item.close !== null);
          
          setChartData(formattedData);
        } else {
          throw new Error('Invalid data format from Yahoo Finance API');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [symbol, timeframe]);
  
  const formatVolume = (value) => {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value;
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Custom tooltip for price chart
  const PriceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{data.date}</p>
          <p className="tooltip-price">{formatCurrency(data.close)}</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for volume chart
  const VolumeTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{data.date}</p>
          <p className="tooltip-volume">{formatVolume(data.volume)} shares</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="advanced-dashboard">
      <div className="dashboard-header">
        <h3>Advanced Chart Dashboard</h3>
        <div className="timeframe-selector">
          <button className={timeframe === '1d' ? 'active' : ''} onClick={() => setTimeframe('1d')}>1D</button>
          <button className={timeframe === '5d' ? 'active' : ''} onClick={() => setTimeframe('5d')}>5D</button>
          <button className={timeframe === '1mo' ? 'active' : ''} onClick={() => setTimeframe('1mo')}>1M</button>
          <button className={timeframe === '6mo' ? 'active' : ''} onClick={() => setTimeframe('6mo')}>6M</button>
          <button className={timeframe === '1y' ? 'active' : ''} onClick={() => setTimeframe('1y')}>1Y</button>
          <button className={timeframe === '3y' ? 'active' : ''} onClick={() => setTimeframe('3y')}>3Y</button>
          <button className={timeframe === '5y' ? 'active' : ''} onClick={() => setTimeframe('5y')}>5Y</button>
          <button className={timeframe === 'max' ? 'active' : ''} onClick={() => setTimeframe('max')}>MAX</button>
        </div>
      </div>
      
      <div className="dashboard-content">
        {loading ? (
          <div className="loading-indicator">Loading data...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : chartData.length === 0 ? (
          <div className="no-data-message">No data available</div>
        ) : (
          <>
            {/* Price Chart */}
            <div className="price-chart-container">
              <h4>Price</h4>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={{ stroke: '#E0E0E0' }}
                    minTickGap={20} // Increase gap for better readability on longer timeframes
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E0E0E0' }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<PriceTooltip />} />
                  {previousClose && ['1d', '5d'].includes(timeframe) && (
                    <ReferenceLine 
                      y={previousClose} 
                      stroke="#888888" 
                      strokeDasharray="3 3"
                      label={{ 
                        value: `Prev Close: $${previousClose.toFixed(2)}`,
                        position: 'insideBottomRight',
                        fill: '#888888',
                        fontSize: 10
                      }}
                    />
                  )}
                  <Area 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#4a6cf7" 
                    fill="url(#priceGradient)" 
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4a6cf7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4a6cf7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Volume Chart */}
            <div className="volume-chart-container">
              <h4>Volume</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={{ stroke: '#E0E0E0' }}
                    minTickGap={20} // Increase gap for better readability on longer timeframes
                  />
                  <YAxis 
                    tickFormatter={formatVolume}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E0E0E0' }}
                    width={60}
                  />
                  <Tooltip content={<VolumeTooltip />} />
                  <Bar 
                    dataKey="volume" 
                    fill="#10b981" 
                    fillOpacity={0.8}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
      
      <div className="dashboard-footer">
        <p>Updated in real-time</p>
      </div>
    </div>
  );
};

export default AdvancedDashboard; 