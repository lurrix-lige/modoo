const { getDefaultConfig } = require('expo/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
const config = getDefaultConfig(__dirname);

const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: process.env.EXPO_PUBLIC_API_URL || 'http://47.94.165.219:3000',
  changeOrigin: true,
  pathRewrite: { '^/api/': '/api/' },
  on: {
    proxyReq: (proxyReq) => {
      console.log(`[Metro Proxy] Proxying request to: ${proxyReq.path}`);
    },
    error: (err, req, res) => {
      console.error('[Metro Proxy] Proxy error:', err);
      if (res && typeof res.writeHead === 'function') {
        res.writeHead(503);
        res.end('Service Unavailable');
      }
    },
  },
});

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url?.startsWith('/api/') || req.url?.startsWith('/health')) {
        console.log(`[Metro Proxy] Handling request: ${req.url}`);
        return apiProxy(req, res, next);
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = wrapWithReanimatedMetroConfig(config);
