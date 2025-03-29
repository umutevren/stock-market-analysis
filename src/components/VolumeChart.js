import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import './VolumeChart.css';

const VolumeChart = ({ symbol }) => {
  const [timeframe, setTimeframe] = useState('1mo');
  const [volumeData, setVolumeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVolumeData = async () => {
      if (!symbol) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const interval = timeframe === '1d' ? '5m' : 
                      timeframe === '5d' ? '30m' : 
                      timeframe === '1mo' ? '1d' : 
                      timeframe === '6mo' ? '1d' : '1wk';
        
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
          const volumes = result.indicators.quote[0].volume || [];
          
          // Format data for Recharts
          const formattedData = timestamps.map((timestamp, index) => {
            const date = new Date(timestamp * 1000);
            let dateStr;
            
            if (timeframe === '1d') {
              dateStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (timeframe === '5d') {
              dateStr = `${date.getMonth()+1}/${date.getDate()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            } else {
              dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
            
            return {
              date: dateStr,
              volume: volumes[index] || 0
            };
          });
          
          setVolumeData(formattedData);
        } else {
          throw new Error('Invalid data format from Yahoo Finance API');
        }
      } catch (err) {
        console.error('Error fetching volume data:', err);
        setError('Failed to load volume data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVolumeData();
  }, [symbol, timeframe]);
  
  const formatYAxis = (value) => {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value;
  };

  return (
    <div className="volume-chart">
      <div className="chart-header">
        <h3>Volume Chart</h3>
        <div className="timeframe-selector">
          <button className={timeframe === '1d' ? 'active' : ''} onClick={() => setTimeframe('1d')}>1D</button>
          <button className={timeframe === '5d' ? 'active' : ''} onClick={() => setTimeframe('5d')}>5D</button>
          <button className={timeframe === '1mo' ? 'active' : ''} onClick={() => setTimeframe('1mo')}>1M</button>
          <button className={timeframe === '6mo' ? 'active' : ''} onClick={() => setTimeframe('6mo')}>6M</button>
        </div>
      </div>
      
      <div className="chart-container">
        {loading ? (
          <div className="loading-indicator">Loading volume data...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : volumeData.length === 0 ? (
          <div className="no-data-message">No volume data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: '#E0E0E0' }}
                minTickGap={10}
              />
              <YAxis 
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#E0E0E0' }}
                width={50}
              />
              <Tooltip 
                formatter={(value) => [formatYAxis(value), 'Volume']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E0E0E0',
                  borderRadius: '4px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              />
              <Bar 
                dataKey="volume" 
                fill="#4a6cf7" 
                fillOpacity={0.8}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default VolumeChart; 