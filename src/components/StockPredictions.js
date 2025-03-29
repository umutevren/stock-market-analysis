import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Line } from 'recharts';
import axios from 'axios';
import moment from 'moment';
import './StockPredictions.css';

const StockPredictions = ({ symbol }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [predictedData, setPredictedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictionModel, setPredictionModel] = useState('holt-winters'); // New default model
  const [historyTimeframe, setHistoryTimeframe] = useState('3y'); // 3 years of data
  const [forecastPeriod, setForecastPeriod] = useState(90); // 90 days forecast
  const [smoothingParams, setSmoothingParams] = useState({ 
    alpha: 0.3, // Level smoothing factor
    beta: 0.2,  // Trend smoothing factor
    gamma: 0.1  // Seasonal smoothing factor
  });
  const [confidenceInterval, setConfidenceInterval] = useState(0.95); // 95% confidence
  
  // Holt-Winters Exponential Smoothing prediction
  const generateHoltWintersPredictions = useCallback((data) => {
    const closes = data.map(d => d.close);
    const alpha = smoothingParams.alpha; // Level smoothing
    const beta = smoothingParams.beta;   // Trend smoothing 
    const gamma = smoothingParams.gamma; // Seasonal smoothing
    const seasonLength = 5; // Assuming a 5-day seasonal pattern (weekly trading)
    
    // Initialize level, trend, and seasonal components
    let level = closes[0];
    let trend = (closes[1] - closes[0]) / 1;
    
    // Initialize seasonal components
    let seasonals = [];
    
    // Create initial seasonal indices (simple average method)
    for (let i = 0; i < seasonLength; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = i; j < Math.min(closes.length, i + seasonLength * 2); j += seasonLength) {
        if (j < closes.length) {
          sum += closes[j];
          count++;
        }
      }
      
      seasonals.push(count > 0 ? sum / count : 1);
    }
    
    // Normalize seasonals
    const seasonalAvg = seasonals.reduce((sum, val) => sum + val, 0) / seasonals.length;
    seasonals = seasonals.map(val => val / seasonalAvg);
    
    // Store predictions for historical data
    const historicalPredictions = [];
    const errors = [];
    
    // Apply Holt-Winters for historical data
    for (let i = 0; i < closes.length; i++) {
      const seasonalIndex = i % seasonLength;
      
      // For the first few points, just use the actual value
      if (i < seasonLength) {
        historicalPredictions.push({
          ...data[i],
          predicted: closes[i],
          upper: null,
          lower: null
        });
        continue;
      }
      
      // Calculate prediction
      const prediction = (level + trend) * seasonals[seasonalIndex];
      
      // Store error for confidence interval calculation
      errors.push(closes[i] - prediction);
      
      // Update components
      const newLevel = alpha * (closes[i] / seasonals[seasonalIndex]) + (1 - alpha) * (level + trend);
      const newTrend = beta * (newLevel - level) + (1 - beta) * trend;
      const newSeasonal = gamma * (closes[i] / newLevel) + (1 - gamma) * seasonals[seasonalIndex];
      
      // Update for next iteration
      level = newLevel;
      trend = newTrend;
      seasonals[seasonalIndex] = newSeasonal;
      
      historicalPredictions.push({
        ...data[i],
        predicted: prediction,
        upper: null, // Will fill in after calculating standard error
        lower: null
      });
    }
    
    // Calculate standard deviation of errors for confidence intervals
    const errorStd = calculateStandardDeviation(errors) || 0;
    const zScore = confidenceInterval === 0.95 ? 1.96 : (confidenceInterval === 0.99 ? 2.58 : 1.645);
    
    // Update historical predictions with confidence intervals
    const updatedHistoricalPredictions = historicalPredictions.map((item, index) => {
      if (index < seasonLength) return item;
      
      return {
        ...item,
        upper: item.predicted + errorStd * zScore,
        lower: item.predicted - errorStd * zScore,
      };
    });
    
    // Generate future predictions
    const futurePredictions = [];
    const lastDate = data[data.length - 1].date;
    
    for (let i = 1; i <= forecastPeriod; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      const seasonalIndex = (closes.length + i - 1) % seasonLength;
      const prediction = (level + trend * i) * seasonals[seasonalIndex];
      
      futurePredictions.push({
        date: futureDate,
        dateFormatted: moment(futureDate).format('YYYY-MM-DD'),
        close: null, // No actual data for the future
        predicted: prediction,
        upper: prediction + errorStd * zScore * Math.sqrt(i),
        lower: prediction - errorStd * zScore * Math.sqrt(i),
        type: 'prediction'
      });
    }
    
    // Combine historical and future predictions
    return [...updatedHistoricalPredictions, ...futurePredictions];
  }, [forecastPeriod, smoothingParams, confidenceInterval]);
  
  // Simple Moving Average prediction
  const generateSMAPredictions = useCallback((data) => {
    const period = smoothingParams.alpha ? Math.round(1/smoothingParams.alpha) : 20; // Default to 20
    const closes = data.map(d => d.close);
    
    // Calculate SMA for historical data
    const historicalSMA = data.map((item, index) => {
      if (index < period - 1) {
        return { ...item, predicted: null, upper: null, lower: null };
      }
      
      // Calculate SMA
      const sma = closes.slice(index - period + 1, index + 1).reduce((sum, price) => sum + price, 0) / period;
      
      // Calculate errors for confidence intervals (for historical data)
      const errorHistory = [];
      for (let i = period; i <= index; i++) {
        const historicalSMA = closes.slice(i - period, i).reduce((sum, price) => sum + price, 0) / period;
        errorHistory.push(Math.abs(closes[i] - historicalSMA));
      }
      
      const errorStd = calculateStandardDeviation(errorHistory) || 0;
      const zScore = confidenceInterval === 0.95 ? 1.96 : (confidenceInterval === 0.99 ? 2.58 : 1.645);
      
      return {
        ...item,
        predicted: sma,
        upper: sma + errorStd * zScore,
        lower: sma - errorStd * zScore,
      };
    });
    
    // Last known date
    const lastDate = data[data.length - 1].date;
    
    // For SMA prediction, we can use the last period's prices and roll forward
    const lastPeriodCloses = closes.slice(-period);
    
    // Standard deviation of historical prediction errors
    const errorHistory = [];
    for (let i = period; i < closes.length; i++) {
      const sma = closes.slice(i - period, i).reduce((sum, price) => sum + price, 0) / period;
      errorHistory.push(Math.abs(closes[i] - sma));
    }
    
    const errorStd = calculateStandardDeviation(errorHistory) || 0;
    const zScore = confidenceInterval === 0.95 ? 1.96 : (confidenceInterval === 0.99 ? 2.58 : 1.645);
    
    // Generate future predictions
    const futurePredictions = [];
    let futureSMA = lastPeriodCloses.reduce((sum, price) => sum + price, 0) / period;
    
    for (let i = 1; i <= forecastPeriod; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      // For simple SMA prediction, we just repeat the last SMA
      // This is a simple model - in reality you'd want something more complex
      futurePredictions.push({
        date: futureDate,
        dateFormatted: moment(futureDate).format('YYYY-MM-DD'),
        close: null,
        predicted: futureSMA,
        upper: futureSMA + errorStd * zScore * Math.sqrt(i),
        lower: futureSMA - errorStd * zScore * Math.sqrt(i),
        type: 'prediction'
      });
    }
    
    // Combine historical SMA and future predictions
    return [...historicalSMA, ...futurePredictions];
  }, [forecastPeriod, smoothingParams, confidenceInterval]);
  
  // Linear Regression prediction
  const generateLinearRegressionPredictions = useCallback((data) => {
    const closes = data.map(d => d.close);
    const xValues = Array.from({ length: closes.length }, (_, i) => i);
    
    // Calculate linear regression (y = mx + b)
    const { slope, intercept } = calculateLinearRegression(xValues, closes);
    
    // Calculate predictions for historical data
    const historicalPredictions = data.map((item, index) => {
      const predicted = slope * index + intercept;
      
      return {
        ...item,
        predicted,
        // We'll calculate confidence intervals after computing errors
        upper: null,
        lower: null,
      };
    });
    
    // Calculate errors for historical predictions
    const errors = historicalPredictions.map((item, index) => 
      item.close - item.predicted
    );
    
    const errorStd = calculateStandardDeviation(errors) || 0;
    const zScore = confidenceInterval === 0.95 ? 1.96 : (confidenceInterval === 0.99 ? 2.58 : 1.645);
    
    // Update historical predictions with confidence intervals
    const updatedHistoricalPredictions = historicalPredictions.map((item, index) => ({
      ...item,
      upper: item.predicted + errorStd * zScore,
      lower: item.predicted - errorStd * zScore,
    }));
    
    // Last known date
    const lastDate = data[data.length - 1].date;
    
    // Generate future predictions
    const futurePredictions = [];
    for (let i = 1; i <= forecastPeriod; i++) {
      const futureIndex = xValues.length + i - 1;
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      const predicted = slope * futureIndex + intercept;
      
      futurePredictions.push({
        date: futureDate,
        dateFormatted: moment(futureDate).format('YYYY-MM-DD'),
        close: null,
        predicted,
        upper: predicted + errorStd * zScore * Math.sqrt(i),
        lower: predicted - errorStd * zScore * Math.sqrt(i),
        type: 'prediction'
      });
    }
    
    // Combine historical linear regression and future predictions
    return [...updatedHistoricalPredictions, ...futurePredictions];
  }, [forecastPeriod, confidenceInterval]);
  
  // ARIMA-like prediction (simplified)
  const generateARIMAPredictions = useCallback((data) => {
    const closes = data.map(d => d.close);
    
    // For this simplified ARIMA, we'll use price differences (returns)
    const returns = [];
    for (let i = 1; i < closes.length; i++) {
      returns.push(closes[i] - closes[i-1]);
    }
    
    // Calculate mean return
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    
    // Calculate historical predictions
    const historicalPredictions = data.map((item, index) => {
      if (index === 0) {
        return { ...item, predicted: item.close, upper: null, lower: null };
      }
      
      // Simple prediction: previous price + mean return
      const predicted = closes[index-1] + meanReturn;
      
      return {
        ...item,
        predicted,
        upper: null,
        lower: null,
      };
    });
    
    // Calculate errors
    const errors = [];
    for (let i = 1; i < closes.length; i++) {
      errors.push(closes[i] - historicalPredictions[i].predicted);
    }
    
    const errorStd = calculateStandardDeviation(errors) || 0;
    const zScore = confidenceInterval === 0.95 ? 1.96 : (confidenceInterval === 0.99 ? 2.58 : 1.645);
    
    // Update historical predictions with confidence intervals
    const updatedHistoricalPredictions = historicalPredictions.map((item, index) => {
      if (index === 0) return item;
      
      return {
        ...item,
        upper: item.predicted + errorStd * zScore,
        lower: item.predicted - errorStd * zScore,
      };
    });
    
    // Last known values
    const lastClose = closes[closes.length - 1];
    const lastDate = data[data.length - 1].date;
    
    // Generate future predictions
    const futurePredictions = [];
    let prevPredicted = lastClose;
    
    for (let i = 1; i <= forecastPeriod; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      // For our simplified ARIMA, we just add the mean return to the previous prediction
      const predicted = prevPredicted + meanReturn;
      
      futurePredictions.push({
        date: futureDate,
        dateFormatted: moment(futureDate).format('YYYY-MM-DD'),
        close: null,
        predicted,
        upper: predicted + errorStd * zScore * Math.sqrt(i),
        lower: predicted - errorStd * zScore * Math.sqrt(i),
        type: 'prediction'
      });
      
      prevPredicted = predicted;
    }
    
    // Combine historical and future predictions
    return [...updatedHistoricalPredictions, ...futurePredictions];
  }, [forecastPeriod, confidenceInterval]);
  
  // Function to generate predictions based on model selection
  const generatePredictions = useCallback((data) => {
    if (!data || data.length === 0) return;
    
    let predictions = [];
    
    if (predictionModel === 'holt-winters') {
      predictions = generateHoltWintersPredictions(data);
    } else if (predictionModel === 'sma') {
      predictions = generateSMAPredictions(data);
    } else if (predictionModel === 'linear') {
      predictions = generateLinearRegressionPredictions(data);
    } else if (predictionModel === 'arima') {
      predictions = generateARIMAPredictions(data);
    }
    
    setPredictedData(predictions);
  }, [predictionModel, generateHoltWintersPredictions, generateSMAPredictions, generateLinearRegressionPredictions, generateARIMAPredictions]);
  
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!symbol) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Using a CORS proxy to access Yahoo Finance data
        const proxyUrl = 'https://corsproxy.io/?';
        const baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?`;
        
        const params = new URLSearchParams({
          interval: '1d', // Daily data
          range: historyTimeframe // 3y, 5y, max
        }).toString();
        
        const response = await axios.get(`${proxyUrl}${baseUrl}${params}`);
        
        if (response.data && response.data.chart && 
            response.data.chart.result && 
            response.data.chart.result[0]) {
          
          const result = response.data.chart.result[0];
          const timestamps = result.timestamp || [];
          const quotes = result.indicators.quote[0] || {};
          const closes = quotes.close || [];
          
          // Format data for charts
          const formattedData = timestamps.map((timestamp, index) => {
            const date = new Date(timestamp * 1000);
            
            return {
              date: date,
              dateFormatted: moment(date).format('YYYY-MM-DD'),
              close: closes[index] || null,
              type: 'historical'
            };
          }).filter(item => item.close !== null);
          
          setHistoricalData(formattedData);
          
          // Generate predictions based on historical data
          generatePredictions(formattedData);
        } else {
          throw new Error('Invalid data format from Yahoo Finance API');
        }
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError('Failed to load historical data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistoricalData();
  }, [symbol, historyTimeframe, generatePredictions]);
  
  // Utility function to calculate linear regression
  const calculateLinearRegression = (x, y) => {
    const n = x.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  };
  
  // Utility function to calculate standard deviation
  const calculateStandardDeviation = (values) => {
    const n = values.length;
    if (n === 0) return null;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / n;
    
    return Math.sqrt(variance);
  };
  
  // Format price for display
  const formatPrice = (price) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="prediction-tooltip">
          <p className="tooltip-date">{data.dateFormatted}</p>
          {data.close !== null && (
            <p className="tooltip-actual">Actual: {formatPrice(data.close)}</p>
          )}
          {data.predicted !== null && (
            <p className="tooltip-predicted">Predicted: {formatPrice(data.predicted)}</p>
          )}
          {data.upper !== null && (
            <p className="tooltip-interval">
              Upper: {formatPrice(data.upper)}<br />
              Lower: {formatPrice(data.lower)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="stock-predictions">
      <div className="predictions-header">
        <h3>Stock Price Predictions</h3>
        <div className="prediction-controls">
          <div className="control-group">
            <label>Model:</label>
            <select 
              value={predictionModel} 
              onChange={(e) => setPredictionModel(e.target.value)}
            >
              <option value="holt-winters">Holt-Winters Forecasting</option>
              <option value="linear">Linear Regression</option>
              <option value="sma">Simple Moving Average</option>
              <option value="arima">ARIMA (Simplified)</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Historical Data:</label>
            <select 
              value={historyTimeframe} 
              onChange={(e) => setHistoryTimeframe(e.target.value)}
            >
              <option value="1y">1 Year</option>
              <option value="3y">3 Years</option>
              <option value="5y">5 Years</option>
              <option value="10y">10 Years</option>
              <option value="max">Maximum</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Forecast Period:</label>
            <select 
              value={forecastPeriod} 
              onChange={(e) => setForecastPeriod(parseInt(e.target.value))}
            >
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="180">180 Days</option>
              <option value="365">1 Year</option>
              <option value="730">2 Years</option>
            </select>
          </div>
          
          {predictionModel === 'holt-winters' && (
            <div className="control-group">
              <label>Smoothing:</label>
              <select 
                value={smoothingParams.alpha} 
                onChange={(e) => setSmoothingParams({ 
                  ...smoothingParams, 
                  alpha: parseFloat(e.target.value),
                  beta: parseFloat(e.target.value) / 2,
                  gamma: parseFloat(e.target.value) / 3
                })}
              >
                <option value="0.1">Low (0.1)</option>
                <option value="0.3">Medium (0.3)</option>
                <option value="0.5">High (0.5)</option>
                <option value="0.7">Very High (0.7)</option>
              </select>
            </div>
          )}
          
          {predictionModel === 'sma' && (
            <div className="control-group">
              <label>Period:</label>
              <select 
                value={smoothingParams.alpha} 
                onChange={(e) => setSmoothingParams({ ...smoothingParams, alpha: parseFloat(e.target.value) })}
              >
                <option value="0.05">20 Days</option>
                <option value="0.1">10 Days</option>
                <option value="0.2">5 Days</option>
                <option value="0.5">2 Days</option>
              </select>
            </div>
          )}
          
          <div className="control-group">
            <label>Confidence:</label>
            <select 
              value={confidenceInterval} 
              onChange={(e) => setConfidenceInterval(parseFloat(e.target.value))}
            >
              <option value="0.9">90%</option>
              <option value="0.95">95%</option>
              <option value="0.99">99%</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="predictions-content">
        {loading ? (
          <div className="loading-indicator">Loading prediction data...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : predictedData.length === 0 ? (
          <div className="no-data-message">No prediction data available</div>
        ) : (
          <>
            <div className="prediction-metrics">
              <div className="metric">
                <h4>Forecast End Date</h4>
                <p>{predictedData[predictedData.length - 1]?.dateFormatted || 'N/A'}</p>
              </div>
              <div className="metric">
                <h4>Current Price</h4>
                <p>{formatPrice(historicalData[historicalData.length - 1]?.close)}</p>
              </div>
              <div className="metric">
                <h4>Predicted Price (End of Forecast)</h4>
                <p>{formatPrice(predictedData[predictedData.length - 1]?.predicted)}</p>
              </div>
              <div className="metric">
                <h4>Forecast Change</h4>
                <p className={
                  predictedData[predictedData.length - 1]?.predicted > 
                  historicalData[historicalData.length - 1]?.close
                    ? 'positive' : 'negative'
                }>
                  {
                    predictedData[predictedData.length - 1]?.predicted && 
                    historicalData[historicalData.length - 1]?.close ?
                      ((predictedData[predictedData.length - 1].predicted - 
                        historicalData[historicalData.length - 1].close) / 
                        historicalData[historicalData.length - 1].close * 100).toFixed(2) + '%'
                      : 'N/A'
                  }
                </p>
              </div>
            </div>
            
            <div className="prediction-chart">
              <ResponsiveContainer width="100%" height={500}>
                <AreaChart
                  data={predictedData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="dateFormatted"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      // Show fewer ticks for better readability
                      const date = new Date(value);
                      return date.getDate() === 1 ? moment(date).format('MMM YYYY') : '';
                    }}
                    minTickGap={50}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Area for confidence interval */}
                  <Area 
                    type="monotone"
                    dataKey="upper"
                    stroke="transparent"
                    fillOpacity={0.1}
                    fill="#8884d8"
                    name="Confidence Interval"
                  />
                  <Area 
                    type="monotone"
                    dataKey="lower"
                    stroke="transparent"
                    fillOpacity={0}
                    fill="#8884d8"
                    name=" "
                  />
                  
                  {/* Line for actual prices */}
                  <Line 
                    type="monotone"
                    dataKey="close"
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="Actual Price"
                    dot={false}
                  />
                  
                  {/* Line for predicted prices */}
                  <Line 
                    type="monotone"
                    dataKey="predicted"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Predicted Price"
                    dot={false}
                  />
                  
                  {/* Reference line for today */}
                  <ReferenceLine 
                    x={historicalData[historicalData.length - 1]?.dateFormatted} 
                    stroke="#888888" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: 'Today',
                      position: 'insideTopRight',
                      fill: '#888888',
                      fontSize: 12
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="prediction-disclaimer">
              <p>
                <strong>Disclaimer:</strong> These predictions are based on mathematical models 
                and historical data. They should not be considered as financial advice or accurate 
                forecasts of future stock prices. Always conduct your own research before making 
                investment decisions.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockPredictions; 