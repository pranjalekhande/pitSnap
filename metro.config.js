const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Better development experience
config.resetCache = true;
config.resolver.platforms = ['ios', 'android', 'web'];

// Faster hot reload
config.server = {
  ...config.server,
  port: 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Enable better caching for faster reloads
      res.setHeader('Cache-Control', 'no-cache');
      return middleware(req, res, next);
    };
  },
};

module.exports = config; 