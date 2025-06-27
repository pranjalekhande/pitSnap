const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Performance optimizations for faster bundling
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enable tree shaking and minification
config.transformer.minifierConfig = {
  mangle: {
    keep_fnames: false,
  },
  output: {
    ascii_only: true,
    quote_style: 3,
    wrap_iife: true,
  },
  sourceMap: {
    includeSources: false,
  },
  toplevel: false,
  compress: {
    drop_console: false, // Keep console logs in development
    reduce_funcs: false,
  },
};

// Optimize asset processing
config.transformer.enableBabelRCLookup = false;
config.transformer.hermesParser = true;

// Bundle splitting for better performance
config.serializer.createModuleIdFactory = function () {
  const fileToIdMap = new Map();
  let nextId = 0;
  return (path) => {
    if (!fileToIdMap.has(path)) {
      fileToIdMap.set(path, nextId);
      nextId += 1;
    }
    return fileToIdMap.get(path);
  };
};

// Exclude unnecessary files from bundling
config.resolver.blacklistRE = /(node_modules.*react[\\\/]dist[\\\/].*|website\\node_modules\\.*|heapCapture\\bundle\.js|.*\\__tests__\\.*)/;

// Asset optimizations
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// Optimize source map generation
config.symbolicator.customizeFrame = (frame) => {
  const collapse = Boolean(
    frame.file && (
      frame.file.includes('/node_modules/react-native/') ||
      frame.file.includes('/node_modules/@react-native/') ||
      frame.file.includes('/node_modules/metro/')
    )
  );
  return { collapse };
};

module.exports = config; 