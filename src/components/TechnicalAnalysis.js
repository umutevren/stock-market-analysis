import React, { useEffect, useRef } from 'react';
import './TechnicalAnalysis.css';

const TechnicalAnalysis = ({ symbol }) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!symbol) return;
    
    // Clean up any existing widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Store container reference inside effect to avoid stale refs in cleanup
    const container = containerRef.current;

    // Load TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined' && container) {
        widgetRef.current = new window.TradingView.widget({
          "width": "100%",
          "height": 500,
          "symbol": `${symbol}`,
          "interval": "D",
          "timezone": "exchange",
          "theme": "light",
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "hide_top_toolbar": false,
          "studies": [
            "RSI@tv-basicstudies",
            "MASimple@tv-basicstudies",
            "MACD@tv-basicstudies"
          ],
          "container_id": container.id
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Clean up
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div className="technical-analysis">
      <div className="widget-header">
        <h3>Technical Analysis</h3>
      </div>
      <div className="widget-description">
        <p>Interactive chart with indicators and drawing tools. The chart displays RSI, moving averages, and MACD by default.</p>
      </div>
      <div className="widget-container" id="tradingview-widget" ref={containerRef}></div>
    </div>
  );
};

export default TechnicalAnalysis; 