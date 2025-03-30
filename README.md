# StockVision

![StockVision Dashboard](ss/advancechart.png)

## About

Hey there! I'm excited to share StockVision with you - a little project I've been pouring my nights and weekends into. StockVision is a sleek, interactive dashboard for tracking and visualizing stock market data with built-in prediction capabilities.

I built this because I was tired of jumping between different platforms to get a comprehensive view of stocks. As a hobbyist investor and data nerd, I wanted something that combined clean visualization with some basic predictive analytics - all in one place!

## Features

### Multiple Visualization Types

StockVision offers several ways to look at stock data:

- **Advanced View**: Comprehensive price charts with customizable timeframes (1D, 5D, 1M, 6M, 1Y, 3Y, 5Y)
- **Technical Analysis**: Key technical indicators including RSI, MACD, and Bollinger Bands
- **Volume Analysis**: Track trading volumes to spot trends and potential breakouts
- **Predictions**: AI-powered forecasting to anticipate potential price movements

![Technical Analysis](ss/techanalysis.png)

### Supported Companies

Currently tracking these popular stocks:
- Apple (AAPL)
- Microsoft (MSFT)
- Google (GOOGL)
- Amazon (AMZN)
- Tesla (TSLA)
- Meta/Facebook (META)
- Netflix (NFLX)
- NVIDIA (NVDA)
- JPMorgan Chase (JPM)
- Berkshire Hathaway (BRK-B)

More coming soon! (Drop me an issue if you have requests)

### Prediction Methods

StockVision implements several forecasting models:

- **Moving Averages**: Both simple (SMA) and exponential (EMA) for short-term trends
- **Linear Regression**: For establishing trendlines and price targets
- **ARIMA Modeling**: A simplified implementation for time-series forecasting
- **Confidence Intervals**: See the potential range of price movements, not just single predictions

![Prediction Methods](ss/methods.png)

### How Predictions Work

I want to be totally transparent: these predictions are for educational purposes only! The forecasting models process historical price data to identify patterns and project potential future movements. 

For example, the EMA model gives more weight to recent prices while the ARIMA model looks at moving averages, seasonality, and autocorrelation. The confidence intervals show the range where prices might fall with about 80% probability.

Remember: No prediction model can guarantee future results - if they could, I'd be writing this from my private island! These models don't account for unexpected news or market events. Use them as one tool in your research.

![Predictions](ss/predictions.png)

## Tech Stack

StockVision is built with:

- **React**: For the front-end UI and component structure
- **Recharts**: Powers the beautiful, responsive visualizations
- **React-Tabs**: For the clean tabbed interface
- **Moment.js**: For date and time formatting
- **JavaScript/ES6+**: All the forecasting algorithms are written in vanilla JS

### Backend Architecture

The backend runs on:
- **Python** with **Flask**: Lightweight server that handles data requests
- **yfinance**: Python library that fetches real stock data from Yahoo Finance
- **RESTful API**: Simple endpoints that deliver formatted stock information
- **Data Processing**: Server-side calculations for technical indicators and base metrics

I've set up the backend to optimize for speed and reliability. It retrieves real-time stock quotes, formats company profiles, and calculates various technical indicators before sending them to the frontend. The Python backend does the heavy lifting of data processing so the React frontend can focus on presenting clean visualizations.

When the server fetches data from Yahoo Finance, it includes error handling to deal with API timeouts or rate limiting. All the data transformations happen server-side, which keeps the frontend code cleaner and more focused on the UI experience.

In a production environment, you might want to add:
- Data caching to reduce API calls
- Authentication for user-specific features
- Database integration for storing historical queries

## Local Development

If you want to play with this yourself:

```bash
# Clone the repo
git clone https://github.com/yourusername/stockvision.git

# Install frontend dependencies
cd stockvision
npm install

# Start React development server
npm start
```

### Setting up the Backend

The application requires both the React frontend and Python backend to be running:

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Run the Flask server
python app.py
```

The React app should connect to the backend automatically, which runs on port 5001 by default.

## What's Next?

I'm actively developing StockVision in my spare time. On my roadmap:
- More companies and market indices
- Cryptocurrency support
- Saving favorite stocks
- Enhanced machine learning models
- Portfolio tracking

---

Built with coffee and code by an indie dev who probably should get more sleep.

If you find this useful or have suggestions, reach out! I'd love to hear from you. 