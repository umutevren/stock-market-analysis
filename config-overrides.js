const webpack = require('webpack');

module.exports = function override(config) {
  // Add node polyfills
  config.resolve.fallback = {
    ...config.resolve.fallback,
    process: require.resolve('process/browser'),
    zlib: require.resolve('browserify-zlib'),
    stream: require.resolve('stream-browserify'),
    util: require.resolve('util/'),
    buffer: require.resolve('buffer/'),
    assert: require.resolve('assert/'),
    path: require.resolve('path-browserify'),
    crypto: require.resolve('crypto-browserify'),
    querystring: require.resolve('querystring-es3'),
    url: require.resolve('url/'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify/browser'),
    tty: require.resolve('tty-browserify'),
  };
  
  // Add plugins
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    // Explicitly provide process for axios
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
      'process.browser': JSON.stringify(true),
    }),
  ];
  
  // Return modified config
  return config;
}; 