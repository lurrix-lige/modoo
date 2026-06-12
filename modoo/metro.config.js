const { getDefaultConfig } = require('expo/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
const config = getDefaultConfig(__dirname);

// 添加API代理配置以绕过CORS限制
const { createProxyMiddleware } = require('http-proxy-middleware');

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return async (req, res, next) => {
      // 如果请求路径以 /api/ 开头，代理到后端API服务器
      if (req.url?.startsWith('/api/')) {
        const proxy = createProxyMiddleware({
          target: process.env.EXPO_PUBLIC_API_URL || 'http://47.94.165.219:3000',
          changeOrigin: true,
          pathRewrite: { '^/api/': '/api/' },
        });
        return proxy(req, res, next);
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = wrapWithReanimatedMetroConfig(config);
