const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Handle large video files by increasing watcher health check timeout
config.watcher = {
  ...config.watcher,
  healthCheck: {
    enabled: true,
    filePrefix: '.metro-health-check',
    interval: 10000,
    timeout: 30000,
  },
};

module.exports = config;
