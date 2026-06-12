const { getDefaultConfig } = require('expo/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
const config = getDefaultConfig(__dirname);

// 添加API代理配置以绕过CORS限制
const { createProxyMiddleware } = require('http-proxy-middleware');

// 配置代理中间件
const apiProxy = createProxyMiddleware({
  target: process.env.EXPO_PUBLIC_API_URL || 'http://47.94.165.219:3000',
  changeOrigin: true,
  pathRewrite: { '^/api/': '/api/' },
  onProxyReq: (proxyReq) => {
    console.log(`[Metro Proxy] Proxying request to: ${proxyReq.path}`);
  },
  onError: (err, req, res) => {
    console.error('[Metro Proxy] Proxy error:', err);
    res.statusCode = 503;
    res.end('Service Unavailable');
  },
});

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // 如果请求路径以 /api/ 或 /health 开头，代理到后端API服务器
      if (req.url?.startsWith('/api/') || req.url?.startsWith('/health')) {
        console.log(`[Metro Proxy] Handling request: ${req.url}`);
        return apiProxy(req, res, next);
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = wrapWithReanimatedMetroConfig(config);
