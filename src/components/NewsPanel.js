import React from 'react';
import './NewsPanel.css';
import moment from 'moment';

const NewsPanel = ({ news }) => {
  if (!news || news.length === 0) {
    return <div className="no-news-data">No recent news available</div>;
  }

  return (
    <div className="news-panel">
      <h3 className="news-header">Latest News</h3>
      <div className="news-list">
        {news.map((item, index) => (
          <NewsItem key={item.id || `news-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
};

const NewsItem = ({ item }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Handle both unix timestamp and ISO string formats
    if (typeof timestamp === 'number') {
      return moment.unix(timestamp).format('MMM DD, YYYY');
    } else {
      return moment(timestamp).format('MMM DD, YYYY');
    }
  };
  
  return (
    <div className="news-item">
      <div className="news-metadata">
        <span className="news-source">{item.source || 'Unknown Source'}</span>
        <span className="news-date">{formatDate(item.datetime)}</span>
      </div>
      
      <a 
        href={item.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="news-title"
      >
        {item.headline || item.title || 'No Title Available'}
      </a>
      
      {item.summary && <p className="news-summary">{item.summary}</p>}
      
      {item.image && (
        <div className="news-image-container">
          <img 
            src={item.image} 
            alt={item.headline || 'News image'} 
            className="news-image" 
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
};

export default NewsPanel; 