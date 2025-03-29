import React, { useState, useEffect, useCallback } from 'react';
import './StockChart.css';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ReferenceLine
} from 'recharts';
import moment from 'moment';
import { PulseLoader } from 'react-spinners';

// Time range options
const TIME_RANGES = [
  { key: '1D', label: '1D', interval: '5m', duration: { days: 1 } },
  { key: '1W', label: '1W', interval: '60m', duration: { weeks: 1 } },
  { key: '1M', label: '1M', interval: '1d', duration: { months: 1 } },
  { key: '3M', label: '3M', interval: '1d', duration: { months: 3 } },
  { key: '1Y', label: '1Y', interval: '1wk', duration: { years: 1 } }
];

// Cache duration in milliseconds (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

// Chart type options
const CHART_TYPES = [
  { key: 'area', label: 'Area' },
  { key: 'candle', label: 'Candle' },
  { key: 'combo', label: 'Price + Volume' }
];

const StockChart = ({ symbol }) => {
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('1D');
  const [chartType, setChartType] = useState('combo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataCache, setDataCache] = useState({});
  const [lastFetchTime, setLastFetchTime] = useState({});
  const [previousClose, setPreviousClose] = useState(null);
  const [stats, setStats] = useState({
    high: null,
    low: null,
    avgVolume: null
  });

  // Fetch data from Yahoo Finance
  const fetchYahooFinanceData = useCallback(async (ticker, interval, range) => {
    try {
      // Yahoo Finance query parameters
      const params = new URLSearchParams({
        interval: interval,
        range: range
      }).toString();
      
      // Using a CORS proxy to access Yahoo Finance data
      const proxyUrl = 'https://corsproxy.io/?';
      const baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?`;
      
      const response = await fetch(`${proxyUrl}${baseUrl}${params}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Yahoo Finance data:', error);
      throw new Error(error.message || 'Failed to fetch chart data');
    }
  }, []);

  // Fetch historical data based on selected time range
  useEffect(() => {
    if (!symbol) return;

    const fetchHistoricalData = async () => {
      // Find the selected time range configuration
      const rangeConfig = TIME_RANGES.find(r => r.key === timeRange);
      if (!rangeConfig) return;

      // Generate cache key
      const cacheKey = `${symbol}_${timeRange}_chart`;
      
      // Check if we have cached data that's still fresh
      const cachedData = dataCache[cacheKey];
      const lastFetch = lastFetchTime[cacheKey] || 0;
      const now = Date.now();
      
      // If we have fresh cached data, use it
      if (cachedData && (now - lastFetch < CACHE_DURATION)) {
        setChartData(cachedData);
        // Calculate stats from cached data
        calculateStats(cachedData);
        return;
      }
      
      setLoading(true);
      setError('');
      
      try {
        // Convert the duration to a Yahoo Finance compatible range string
        let yahooRange;
        if (timeRange === '1D') yahooRange = '1d';
        else if (timeRange === '1W') yahooRange = '5d';
        else if (timeRange === '1M') yahooRange = '1mo';
        else if (timeRange === '3M') yahooRange = '3mo';
        else if (timeRange === '1Y') yahooRange = '1y';
        
        // Fetch stock data from Yahoo Finance
        const yahooData = await fetchYahooFinanceData(
          symbol, 
          rangeConfig.interval, 
          yahooRange
        );
        
        // Check if we got valid data
        if (!yahooData || !yahooData.chart || !yahooData.chart.result || yahooData.chart.result.length === 0) {
          throw new Error('No data available for this time range');
        }
        
        const result = yahooData.chart.result[0];
        
        // Get previous close for reference line
        setPreviousClose(result.meta.previousClose);
        
        // Process the data for the chart
        const processedData = processYahooData(result, rangeConfig);
        
        // Calculate stats from the data
        calculateStats(processedData);
        
        // Cache the data
        setDataCache(prev => ({
          ...prev,
          [cacheKey]: processedData
        }));
        
        setLastFetchTime(prev => ({
          ...prev,
          [cacheKey]: now
        }));
        
        setChartData(processedData);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError(err.message || 'Failed to load chart data');
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Process Yahoo Finance data into format usable by recharts
    const processYahooData = (data, rangeConfig) => {
      const { timestamp, indicators } = data;
      
      if (!timestamp || !indicators || !indicators.quote || !indicators.quote[0]) {
        return [];
      }
      
      const quotes = indicators.quote[0];
      
      return timestamp.map((time, index) => {
        const date = new Date(time * 1000);
        let formattedTime;
        
        // Format date based on the time range
        if (rangeConfig.key === '1D') {
          formattedTime = moment(date).format('HH:mm');
        } else if (rangeConfig.key === '1W') {
          formattedTime = moment(date).format('ddd HH:mm');
        } else if (rangeConfig.key === '1M') {
          formattedTime = moment(date).format('MMM DD');
        } else {
          formattedTime = moment(date).format('MMM DD, YYYY');
        }
        
        return {
          timestamp: time,
          time: formattedTime,
          open: quotes.open ? quotes.open[index] : null,
          high: quotes.high ? quotes.high[index] : null,
          low: quotes.low ? quotes.low[index] : null,
          close: quotes.close ? quotes.close[index] : null,
          volume: quotes.volume ? quotes.volume[index] : null,
        };
      }).filter(item => item.close !== null);
    };

    // Calculate stats from chart data
    const calculateStats = (data) => {
      if (!data || data.length === 0) return;
      
      const closes = data.map(d => d.close).filter(c => c !== null);
      const volumes = data.map(d => d.volume).filter(v => v !== null);
      
      setStats({
        high: Math.max(...closes),
        low: Math.min(...closes),
        avgVolume: volumes.length > 0 ? 
          volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length : 0
      });
    };

    fetchHistoricalData();
  }, [symbol, timeRange, fetchYahooFinanceData, dataCache, lastFetchTime]);

  // Format volume for display
  const formatVolume = (volume) => {
    if (volume >= 1_000_000_000) {
      return `${(volume / 1_000_000_000).toFixed(2)}B`;
    } else if (volume >= 1_000_000) {
      return `${(volume / 1_000_000).toFixed(2)}M`;
    } else if (volume >= 1_000) {
      return `${(volume / 1_000).toFixed(2)}K`;
    }
    return volume.toString();
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">{data.time}</p>
          <p className="tooltip-price">
            <span className="label">Price: </span>
            <span className="value">${data.close.toFixed(2)}</span>
          </p>
          <div className="tooltip-details">
            {data.open !== null && <p><span className="label">Open:</span> <span className="value">${data.open.toFixed(2)}</span></p>}
            {data.high !== null && <p><span className="label">High:</span> <span className="value">${data.high.toFixed(2)}</span></p>}
            {data.low !== null && <p><span className="label">Low:</span> <span className="value">${data.low.toFixed(2)}</span></p>}
            {data.volume !== null && <p><span className="label">Volume:</span> <span className="value">{formatVolume(data.volume)}</span></p>}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChartContent = () => {
    if (loading) {
      return (
        <div className="chart-loading">
          <PulseLoader color="#2563eb" size={10} />
          <p>Loading chart data...</p>
        </div>
      );
    } 
    
    if (error) {
      return (
        <div className="chart-error">
          <p>{error}</p>
        </div>
      );
    } 
    
    if (chartData.length === 0) {
      return (
        <div className="no-data-message">No chart data available</div>
      );
    }

    if (chartType === 'combo') {
      return (
        <div className="combo-chart-container">
          <div className="chart-stats">
            <div className="stat-item">
              <span className="stat-label">High</span>
              <span className="stat-value">${stats.high?.toFixed(2) || '-'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Low</span>
              <span className="stat-value">${stats.low?.toFixed(2) || '-'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg Volume</span>
              <span className="stat-value">{stats.avgVolume ? formatVolume(stats.avgVolume) : '-'}</span>
            </div>
          </div>
          
          {/* Price Chart */}
          <div className="price-chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" />
                <XAxis 
                  dataKey="time" 
                  tickMargin={10}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  style={{ fontSize: '12px' }}
                  tickMargin={10}
                  orientation="right"
                />
                <Tooltip content={<CustomTooltip />} />
                {previousClose && (
                  <ReferenceLine 
                    y={previousClose} 
                    stroke="#888888" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: `Prev Close: $${previousClose.toFixed(2)}`,
                      position: 'insideBottomRight',
                      fill: '#888888',
                      fontSize: 12
                    }}
                  />
                )}
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#2563eb" 
                  fill="url(#colorGradient)" 
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Volume Chart */}
          <div className="volume-chart-container">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 0 }}
                barSize={timeRange === '1D' ? 3 : timeRange === '1W' ? 6 : 10}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  tickMargin={10}
                  style={{ fontSize: '12px' }}
                  hide={true}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => formatVolume(value)}
                  style={{ fontSize: '12px' }}
                  tickMargin={10}
                  orientation="right"
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value) => [formatVolume(value), 'Volume']}
                  labelFormatter={(label) => 'Volume'}
                />
                <Bar 
                  dataKey="volume" 
                  fill="#10b981" 
                  opacity={0.7}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    
    // Default to regular area chart
    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" />
          <XAxis 
            dataKey="time" 
            tickMargin={10}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            style={{ fontSize: '12px' }}
            tickMargin={10}
          />
          <Tooltip content={<CustomTooltip />} />
          {previousClose && (
            <ReferenceLine 
              y={previousClose} 
              stroke="#888888" 
              strokeDasharray="3 3"
              label={{ 
                value: `Prev Close: $${previousClose.toFixed(2)}`,
                position: 'insideBottomRight',
                fill: '#888888',
                fontSize: 12
              }}
            />
          )}
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke="#2563eb" 
            fill="url(#colorGradient)" 
            strokeWidth={2}
            isAnimationActive={false}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="stock-chart">
      <div className="chart-controls">
        <div className="time-range-buttons">
          {TIME_RANGES.map(range => (
            <button
              key={range.key}
              className={timeRange === range.key ? 'active' : ''}
              onClick={() => setTimeRange(range.key)}
            >
              {range.label}
            </button>
          ))}
        </div>
        
        <div className="chart-type-selector">
          {CHART_TYPES.map(type => (
            <button
              key={type.key}
              className={chartType === type.key ? 'active' : ''}
              onClick={() => setChartType(type.key)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="chart-container">
        {renderChartContent()}
      </div>
      
      <div className="chart-info">
        <p className="data-source">Data provided by Yahoo Finance • Cached for 10 minutes to reduce API calls</p>
      </div>
    </div>
  );
};

export default StockChart; 