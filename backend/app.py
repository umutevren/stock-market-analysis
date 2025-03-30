import yfinance as yf
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import time
import traceback
import sys

app = Flask(__name__)
# Allow requests from your React app's origin (adjust port if necessary)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

@app.route('/api/stock/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    try:
        print(f"[{time.strftime('%H:%M:%S')}] Fetching data for {symbol}...")
        
        # Attempt to create ticker object
        ticker = yf.Ticker(symbol)
        
        # Verify the ticker is valid
        hist_check = ticker.history(period="1d")
        if hist_check.empty:
            print(f"[ERROR] No history found for symbol {symbol}")
            return jsonify({"error": f"No data found for symbol {symbol}. Check if the symbol is correct."}), 404
            
        # Get the ticker info
        print(f"[{time.strftime('%H:%M:%S')}] Getting info for {symbol}...")
        info = ticker.info
        
        # Debug output to help troubleshoot
        if not info or len(info) == 0:
            print(f"[ERROR] Retrieved empty info for {symbol}")
            return jsonify({"error": f"Retrieved empty info for {symbol}"}), 500
            
        print(f"[{time.strftime('%H:%M:%S')}] Retrieved ticker info for {symbol}. Keys available: {list(info.keys())[:10]}...")
        
        # Get historical data
        print(f"[{time.strftime('%H:%M:%S')}] Getting historical data for {symbol}...")
        hist = ticker.history(period="5d")  # Get a bit more data to ensure we have enough
        
        if hist.empty:
             print(f"[ERROR] No historical data found for {symbol}")
             return jsonify({"error": f"No data found for symbol {symbol}. Check if the symbol is correct."}), 404

        # --- Format Quote Data ---
        print(f"[{time.strftime('%H:%M:%S')}] Formatting quote data for {symbol}...")
        
        # Get current price (try multiple fallbacks)
        current_price = None
        if 'currentPrice' in info:
            current_price = info['currentPrice']
        elif 'regularMarketPrice' in info:
            current_price = info['regularMarketPrice']
        elif not hist.empty and 'Close' in hist.columns:
            current_price = hist['Close'].iloc[-1]
        
        if current_price is None:
            print(f"[ERROR] Could not find current price for {symbol}")
            current_price = 0
            
        # Previous close with fallbacks
        previous_close = None
        if 'previousClose' in info:
            previous_close = info['previousClose']
        elif 'regularMarketPreviousClose' in info:
            previous_close = info['regularMarketPreviousClose']
        elif len(hist) > 1 and 'Close' in hist.columns:
            previous_close = hist['Close'].iloc[-2]
        
        if previous_close is None:
            print(f"[WARNING] Could not find previous close for {symbol}, using current price")
            previous_close = current_price
            
        # Get other price data with fallbacks
        day_high = info.get('dayHigh', info.get('regularMarketDayHigh', hist['High'].iloc[-1] if not hist.empty and 'High' in hist.columns else current_price))
        day_low = info.get('dayLow', info.get('regularMarketDayLow', hist['Low'].iloc[-1] if not hist.empty and 'Low' in hist.columns else current_price))
        day_open = info.get('open', info.get('regularMarketOpen', hist['Open'].iloc[-1] if not hist.empty and 'Open' in hist.columns else current_price))
        market_cap = info.get('marketCap', info.get('market_cap', 0))

        formatted_quote = {
            'c': current_price,
            'pc': previous_close,
            'h': day_high,
            'l': day_low,
            'o': day_open
        }

        # --- Format Profile Data ---
        print(f"[{time.strftime('%H:%M:%S')}] Formatting profile data for {symbol}...")
        formatted_profile = {
            'name': info.get('longName', info.get('shortName', symbol)),
            'ticker': info.get('symbol', symbol),
            'exchange': info.get('exchange', 'N/A'),
            'industry': info.get('industry', 'N/A'),
            'marketCap': market_cap,
            'country': info.get('country', 'N/A'),
            'currency': info.get('currency', 'USD'),
            'website': info.get('website', '#'),
            'logo': info.get('logo_url', f'https://logo.clearbit.com/{info.get("website")}') if info.get("website") else '#'
        }

        response_data = {
            "symbol": symbol,
            "quote": formatted_quote,
            "profile": formatted_profile
        }
        
        print(f"[{time.strftime('%H:%M:%S')}] Successfully processed data for {symbol}")
        return jsonify(response_data)

    except Exception as e:
        print(f"[ERROR] Error fetching data for {symbol}: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Failed to fetch data for {symbol}. Exception: {str(e)}"}), 500

@app.route('/api/history/<symbol>', methods=['GET'])
def get_stock_history(symbol):
    try:
        history_range = request.args.get('range', '3y') # Default to 3 years
        print(f"[{time.strftime('%H:%M:%S')}] Fetching {history_range} historical data for {symbol}...")
        
        valid_ranges = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '3y', '5y', '10y', 'ytd', 'max']
        if history_range not in valid_ranges:
             # Try converting simple ranges like '3y' used by frontend to yfinance format if needed
             if history_range.endswith('y') or history_range.endswith('mo'):
                 pass # yfinance accepts these directly
             else:
                 return jsonify({"error": f"Invalid history range specified: {history_range}"}), 400

        # Attempt to create ticker and verify it's valid
        ticker = yf.Ticker(symbol)
        
        # Use a shorter period first to validate the ticker
        print(f"[{time.strftime('%H:%M:%S')}] Validating ticker {symbol}...")
        quick_check = ticker.history(period="1d")
        if quick_check.empty:
            print(f"[ERROR] Invalid ticker {symbol} - no data returned from quick check")
            return jsonify({"error": f"No data found for symbol {symbol}"}), 404
            
        # If valid, get the full history
        print(f"[{time.strftime('%H:%M:%S')}] Getting {history_range} history for {symbol}...")
        hist = ticker.history(period=history_range)
        print(f"[{time.strftime('%H:%M:%S')}] Retrieved {len(hist)} history records for {symbol}")

        if hist.empty:
            print(f"[ERROR] Empty history returned for {symbol} with range {history_range}")
            return jsonify({"error": f"No historical data found for {symbol} with range {history_range}."}), 404

        # Reset index to make Date a column
        hist = hist.reset_index()

        # Ensure 'Date' column is timezone-naive datetime objects for consistent JSON serialization
        if pd.api.types.is_datetime64_any_dtype(hist['Date']):
            if hist['Date'].dt.tz is not None:
                 hist['Date'] = hist['Date'].dt.tz_convert(None) # Convert to naive UTC
        else:
             # If 'Date' is not datetime, attempt conversion
             try:
                 hist['Date'] = pd.to_datetime(hist['Date']).dt.tz_localize(None)
             except Exception as date_err:
                 print(f"[WARNING] Could not convert Date column to datetime: {date_err}")
                 # Fallback or handle error as appropriate

        # Format data for the prediction chart
        formatted_data = [
            {
                "date": row['Date'].isoformat(), # Use ISO format for consistency
                "dateFormatted": row['Date'].strftime('%Y-%m-%d'),
                "close": row['Close']
            }
            for index, row in hist.iterrows() if pd.notna(row['Close'])
        ]
        
        print(f"[{time.strftime('%H:%M:%S')}] Successfully processed history data for {symbol} - {len(formatted_data)} valid data points")
        return jsonify(formatted_data)

    except Exception as e:
        print(f"[ERROR] Error fetching history for {symbol}: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Failed to fetch history for {symbol}. Exception: {str(e)}"}), 500

if __name__ == '__main__':
    print("="*50)
    print("Starting StockVision backend server...")
    print("Fetching data directly from Yahoo Finance API")
    print("Press CTRL+C to stop the server")
    print("="*50)
    # Run on a different port (e.g., 5001) to avoid conflict with React
    app.run(debug=True, port=5001) 