# Modoo 部署运维指南

## 环境要求

| 依赖 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 20.x | 运行时 |
| npm | >= 10.x | 包管理 |
| SQLite | 3.x (内嵌) | 数据库（开发/小规模使用） |

## 后端部署

### 1. 环境变量配置

```bash
cp .env.example .env
# 按需修改 .env 中的配置项
```

**必填配置项：**

| 变量 | 说明 |
|------|------|
| `JWT_SECRET` | JWT 签名密钥，生产环境必须使用随机生成的强密钥 |
| `DATABASE_URL` | 数据库连接串，默认 `file:./dev.db` |

**可选但建议配置：**

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `NODE_ENV` | 运行环境 | `development` |
| `CORS_ORIGINS` | 允许的跨域来源（逗号分隔） | 开发环境全允许 |
| `SENTRY_DSN` | Sentry 错误监控 DSN | 空（不启用） |
| `LOG_LEVEL` | 日志级别 | `info` |

### 2. 安装与构建

```bash
npm ci              # 安装依赖（CI 环境）
# 或
npm install         # 安装依赖（开发环境）

npx prisma generate # 生成 Prisma Client
npx prisma migrate deploy  # 执行数据库迁移（生产环境）
# 或
npx prisma migrate dev     # 执行数据库迁移（开发环境）

npm run build       # 编译 TypeScript
```

### 3. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build && npm start
```

### 4. 健康检查

```bash
curl http://localhost:3000/health
# {"success":true,"data":{"status":"ok","timestamp":"2026-05-19T..."}}
```

### 5. 进程管理（生产环境推荐）

使用 PM2 管理进程：

```bash
npm install -g pm2
pm2 start dist/index.js --name modoo-backend
pm2 save
pm2 startup
```

### 6. SSL/HTTPS（生产环境）

推荐使用 Nginx 反向代理：

```nginx
server {
    listen 443 ssl;
    server_name api.modoo.baby;

    ssl_certificate     /etc/ssl/modoo.crt;
    ssl_certificate_key /etc/ssl/modoo.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 前端部署

### 1. 环境配置

```bash
cp .env.example .env
# 修改 EXPO_PUBLIC_API_URL 指向后端地址
```

### 2. 构建与发布

```bash
npm ci
npx expo start           # 开发模式
npx expo run:ios         # iOS 构建
npx expo run:android     # Android 构建
```

使用 EAS Build 发布：

```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
eas submit --platform ios
eas submit --platform android
```

## 监控与告警

### Sentry 错误监控

配置 `SENTRY_DSN` 环境变量后，后端错误会自动上报到 Sentry，包含：
- 未处理的异常
- API 错误
- 性能分析（Profiling）

### 日志

后端使用 Pino 日志库，输出结构化 JSON 日志。生产环境建议：
- 使用 `pino-pretty` 仅在开发环境启用
- 将日志输出重定向到文件或日志收集服务

```bash
# 写入文件
npm start 2>&1 | tee -a /var/log/modoo/app.log
```

### 关键指标监控

| 指标 | 端点 | 说明 |
|------|------|------|
| 服务可用性 | `GET /health` | 健康检查 |
| API 限流状态 | 响应头 `X-RateLimit-*` | 监控限流触发频率 |
| 认证失败率 | Sentry | AUTH_TOKEN_EXPIRED / AUTH_TOKEN_INVALID 错误 |

## 备份策略

### 数据库备份

SQLite 数据库文件备份：

```bash
# 定时备份脚本（建议 crontab 每小时执行）
cp backend/prisma/dev.db "backups/modoo-$(date +%Y%m%d-%H%M%S).db"
# 保留最近 7 天的备份
find backups/ -name "*.db" -mtime +7 -delete
```

### 恢复

```bash
cp backups/modoo-20260519-120000.db backend/prisma/dev.db
pm2 restart modoo-backend
```

## 安全注意事项

- [ ] 生产环境强制设置 `JWT_SECRET`（服务启动时会校验，不设则退出）
- [ ] 配置 `CORS_ORIGINS` 为实际前端域名
- [ ] 启用 HTTPS
- [ ] 配置 `WECHAT_ENV=production` 使用微信生产环境
- [ ] 定期更新 npm 依赖（`npm audit fix`）
- [ ] 数据库文件设置适当的文件权限（600）
