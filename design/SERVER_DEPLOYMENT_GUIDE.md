# 莫朵睡眠助手 - 阿里云服务器部署方案

> **文档版本**: v1.0
> **创建日期**: 2026-05-24
> **服务器**: 47.94.165.219
> **操作系统**: Alibaba Cloud Linux / CentOS

---

## 目录

1. [服务器概述](#1-服务器概述)
2. [环境准备](#2-环境准备)
3. [项目结构](#3-项目结构)
4. [后端服务部署](#4-后端服务部署)
5. [前端服务部署](#5-前端服务部署)
6. [Nginx 反向代理配置](#6-nginx-反向代理配置)
7. [PM2 进程管理](#7-pm2-进程管理)
8. [防火墙与安全组配置](#8-防火墙与安全组配置)
9. [环境变量配置](#9-环境变量配置)
10. [服务验证](#10-服务验证)
11. [运维命令参考](#11-运维命令参考)
12. [故障排查](#12-故障排查)

---

## 1. 服务器概述

### 1.1 服务器信息

| 项目 | 配置 |
|------|------|
| 公网 IP | 47.94.165.219 |
| SSH 端口 | 22 |
| SSH 用户 | root |
| Web 端口 | 80 |
| 后端 API 端口 | 3000 |
| Expo 开发端口 | 8081 |

### 1.2 服务架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   用户设备       │     │   阿里云服务器    │     │   数据库         │
│  (Expo Go/浏览器) │────▶│   Nginx (80)   │────▶│   SQLite/MySQL  │
│                 │     │                 │     │                 │
│                 │     │  ┌───────────┐  │     │                 │
│                 │     │  │ 后端 API  │  │     │                 │
│                 │◀────│  │  :3000    │  │     │                 │
│                 │     │  └───────────┘  │     │                 │
│                 │     │                 │     │                 │
│                 │     │  ┌───────────┐  │     │                 │
│                 │◀────│  │ Expo Metro│  │     │                 │
│                 │     │  │  :8081    │  │     │                 │
│                 │     │  └───────────┘  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 2. 环境准备

### 2.1 系统要求

- 操作系统: Alibaba Cloud Linux 3 / CentOS 7+
- Node.js: v18+
- npm: v9+
- PM2: 最新版本
- Nginx: 最新版本

### 2.2 安装基础软件

```bash
# 更新系统
yum update -y

# 安装基础工具
yum install -y curl wget git vim net-tools

# 安装 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 验证安装
node --version  # 预期输出: v18.x.x
npm --version   # 预期输出: 9.x.x

# 安装 PM2
npm install -g pm2

# 验证 PM2
pm2 --version

# 安装 Nginx
yum install -y epel-release
yum install -y nginx

# 验证 Nginx
nginx -v
```

### 2.3 阿里云安全组配置

在阿里云控制台的安全组中添加以下规则：

| 协议 | 端口范围 | 授权对象 | 用途 |
|------|---------|---------|------|
| TCP | 22/22 | 0.0.0.0/0 | SSH 连接 |
| TCP | 80/80 | 0.0.0.0/0 | HTTP 服务 |
| TCP | 3000/3000 | 0.0.0.0/0 | 后端 API |
| TCP | 8081/8081 | 0.0.0.0/0 | Expo 开发服务器 |

### 2.4 防火墙配置

```bash
# 检查防火墙状态
systemctl status firewalld

# 开放必要端口
firewall-cmd --zone=public --add-port=80/tcp --permanent
firewall-cmd --zone=public --add-port=3000/tcp --permanent
firewall-cmd --zone=public --add-port=8081/tcp --permanent
firewall-cmd --zone=public --add-port=22/tcp --permanent

# 重载防火墙
firewall-cmd --reload

# 查看已开放端口
firewall-cmd --list-ports
```

---

## 3. 项目结构

### 3.1 目录结构

```
/root/workspace/modoo/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── index.ts           # 入口文件
│   │   ├── routes/            # 路由
│   │   ├── services/         # 服务层
│   │   ├── utils/            # 工具函数
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma     # 数据库模型
│   ├── dist/                  # 编译输出
│   ├── package.json
│   ├── tsconfig.json
│   ├── ecosystem.config.js    # PM2 配置
│   └── .env                   # 环境变量
│
├── modoo/                      # 前端应用
│   ├── src/
│   │   ├── features/         # 功能模块
│   │   ├── components/       # 组件
│   │   ├── navigation/       # 导航配置
│   │   └── ...
│   ├── app.json
│   ├── package.json
│   ├── start.sh              # 启动脚本
│   ├── ecosystem.config.js   # PM2 配置
│   └── .env                   # 环境变量
│
└── design/                    # 设计文档
    └── ...
```

### 3.2 创建工作目录

```bash
# 创建项目目录
mkdir -p /root/workspace/modoo

# 设置目录权限
chmod -R 755 /root/workspace

# 创建日志目录
mkdir -p /var/log/pm2
chmod 755 /var/log/pm2
```

---

## 4. 后端服务部署

### 4.1 代码部署

```bash
# 方法一：Git 拉取（推荐）
cd /root/workspace/modoo
git clone git@github.com:your-org/modoo.git .

# 方法二：SCP 上传
scp -r ./backend root@47.94.165.219:/root/workspace/modoo/
```

### 4.2 安装依赖

```bash
cd /root/workspace/modoo/backend

# 安装依赖
npm install

# 构建项目
npm run build
```

### 4.3 环境变量配置

```bash
# 创建生产环境配置文件
cat > /root/workspace/modoo/backend/.env << 'EOF'
# ============================================
# 服务器配置
# ============================================
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
CORS_ORIGINS=http://47.94.165.219

# ============================================
# JWT 配置
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=14

# ============================================
# 数据库配置
# ============================================
DATABASE_URL="file:./prod.db"

# ============================================
# API 配置
# ============================================
API_BASE_URL=http://47.94.165.219:3000

# ============================================
# 日志配置
# ============================================
LOG_LEVEL=info

# ============================================
# 短信验证配置
# ============================================
VERIFICATION_EXPIRY_MINUTES=5
MAX_VERIFICATION_ATTEMPTS=5
MAX_VERIFY_ATTEMPTS=3
ENABLE_REAL_SMS=false

# ============================================
# Apple 登录配置
# ============================================
APPLE_APP_ID=com.modoo.baby
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY_PATH=./config/AuthKey.p8

# ============================================
# 微信登录配置
# ============================================
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
WECHAT_MCH_ID=your-mch-id
WECHAT_API_KEY=your-api-key
WECHAT_NOTIFY_URL=http://47.94.165.219:3000/api/v1/payment/wechat/notify
EOF
```

### 4.4 数据库迁移

```bash
cd /root/workspace/modoo/backend

# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma db push

# 或使用生产数据库
# npx prisma migrate deploy
```

### 4.5 PM2 后端配置

```bash
# 创建 PM2 配置文件
cat > /root/workspace/modoo/backend/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'modoo-backend',
      script: 'dist/index.js',
      cwd: '/root/workspace/modoo/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/modoo-backend-error.log',
      out_file: '/var/log/pm2/modoo-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
EOF
```

### 4.6 启动后端服务

```bash
cd /root/workspace/modoo/backend

# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs modoo-backend
```

---

## 5. 前端服务部署

### 5.1 代码部署

```bash
# Git 拉取
cd /root/workspace/modoo
git clone git@github.com:your-org/modoo.git .

# 或 SCP 上传
scp -r ./modoo root@47.94.165.219:/root/workspace/modoo/
```

### 5.2 安装依赖

```bash
cd /root/workspace/modoo/modoo

# 安装依赖
npm install
```

### 5.3 环境变量配置

```bash
# 创建生产环境配置文件
cat > /root/workspace/modoo/modoo/.env << 'EOF'
# ============================================
# 核心配置 - 生产环境
# ============================================
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=http://47.94.165.219:3000
EXPO_PUBLIC_CDN_URL=http://47.94.165.219:3000

# ============================================
# 微信开放平台配置
# ============================================
WECHAT_APP_ID=your-wechat-app-id

# ============================================
# Apple 配置
# ============================================
APPLE_APP_ID=com.modoo.baby
APPLE_PAY_MERCHANT_ID=merchant.com.modoo
EOF
```

### 5.4 启动脚本配置

```bash
# 创建启动脚本
cat > /root/workspace/modoo/modoo/start.sh << 'EOF'
#!/bin/bash
cd /root/workspace/modoo/modoo
export REACT_NATIVE_PACKAGER_HOSTNAME=47.94.165.219
npx expo start --host lan --port 8081 --clear
EOF

# 设置执行权限
chmod +x /root/workspace/modoo/modoo/start.sh
```

### 5.5 PM2 前端配置

```bash
# 创建 PM2 配置文件
cat > /root/workspace/modoo/modoo/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'modoo-frontend',
      script: '/root/workspace/modoo/modoo/start.sh',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      error_file: '/var/log/pm2/modoo-frontend-error.log',
      out_file: '/var/log/pm2/modoo-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
EOF
```

### 5.6 启动前端服务

```bash
cd /root/workspace/modoo/modoo

# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs modoo-frontend
```

---

## 6. Nginx 反向代理配置

### 6.1 创建 Nginx 配置文件

```bash
# 创建前端静态资源目录
mkdir -p /var/www/modoo
chmod -R 755 /var/www/modoo

# 创建 Nginx 配置文件
cat > /etc/nginx/conf.d/modoo.conf << 'EOF'
# 后端 API 反向代理
server {
    listen 80;
    server_name 47.94.165.219;
    
    # 后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 前端静态资源
    location / {
        root /var/www/modoo;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 错误页面
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF
```

### 6.2 Expo Metro 代理配置

```bash
# 创建 Expo Metro 反向代理配置
cat > /etc/nginx/conf.d/expo.conf << 'EOF'
# Expo Metro 开发服务器代理
server {
    listen 8082;
    server_name 47.94.165.219;
    
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 超时设置
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF
```

### 6.3 测试并重启 Nginx

```bash
# 测试配置文件
nginx -t

# 重启 Nginx
systemctl restart nginx

# 设置开机自启
systemctl enable nginx

# 查看状态
systemctl status nginx
```

---

## 7. PM2 进程管理

### 7.1 PM2 开机自启配置

```bash
# 保存当前进程列表
pm2 save

# 生成开机自启脚本
pm2 startup

# 根据提示执行命令（通常是）
systemctl enable pm2-root
```

### 7.2 PM2 常用命令

```bash
# 查看所有进程
pm2 status

# 查看特定进程日志
pm2 logs modoo-backend
pm2 logs modoo-frontend

# 重启进程
pm2 restart modoo-backend
pm2 restart all

# 停止进程
pm2 stop modoo-backend
pm2 stop all

# 删除进程
pm2 delete modoo-backend

# 监控资源使用
pm2 monit

# 查看进程详情
pm2 show modoo-backend
```

### 7.3 日志管理

```bash
# 查看实时日志
pm2 logs --lines 100

# 清空日志
pm2 flush

# 导出日志
pm2 logs --out modoo-backend > /tmp/backend.log
```

---

## 8. 防火墙与安全组配置

### 8.1 安全组规则（阿里云控制台）

| 协议 | 端口范围 | 授权对象 | 用途 |
|------|---------|---------|------|
| TCP | 22/22 | 0.0.0.0/0 | SSH 连接 |
| TCP | 80/80 | 0.0.0.0/0 | HTTP 服务 |
| TCP | 3000/3000 | 0.0.0.0/0 | 后端 API |
| TCP | 8081/8081 | 0.0.0.0/0 | Expo Metro |
| TCP | 8082/8082 | 0.0.0.0/0 | Expo 代理 |

### 8.2 系统防火墙规则

```bash
# 查看防火墙状态
systemctl status firewalld

# 开放端口
firewall-cmd --zone=public --add-port=80/tcp --permanent
firewall-cmd --zone=public --add-port=3000/tcp --permanent
firewall-cmd --zone=public --add-port=8081/tcp --permanent
firewall-cmd --zone=public --add-port=8082/tcp --permanent

# 重载防火墙
firewall-cmd --reload

# 查看已开放端口
firewall-cmd --list-ports
```

### 8.3 SELinux 配置

```bash
# 检查 SELinux 状态
getenforce

# 如果是 Enforcing 模式，放行相关端口
setsebool -P httpd_can_network_connect 1
setsebool -P nis_enabled 1

# 或直接关闭 SELinux（不推荐）
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
reboot
```

---

## 9. 环境变量配置

### 9.1 后端环境变量

```bash
# 路径: /root/workspace/modoo/backend/.env
cat > /root/workspace/modoo/backend/.env << 'EOF'
# ============================================
# 服务器配置
# ============================================
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
CORS_ORIGINS=http://47.94.165.219

# ============================================
# JWT 配置
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=14

# ============================================
# 数据库配置
# ============================================
DATABASE_URL="file:./prod.db"

# ============================================
# API 配置
# ============================================
API_BASE_URL=http://47.94.165.219:3000

# ============================================
# 日志配置
# ============================================
LOG_LEVEL=info

# ============================================
# 短信验证配置
# ============================================
VERIFICATION_EXPIRY_MINUTES=5
MAX_VERIFICATION_ATTEMPTS=5
MAX_VERIFY_ATTEMPTS=3
ENABLE_REAL_SMS=false

# ============================================
# Apple 登录配置
# ============================================
APPLE_APP_ID=com.modoo.baby
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY_PATH=./config/AuthKey.p8

# ============================================
# 微信登录配置
# ============================================
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
WECHAT_MCH_ID=your-mch-id
WECHAT_API_KEY=your-api-key
WECHAT_NOTIFY_URL=http://47.94.165.219:3000/api/v1/payment/wechat/notify
EOF
```

### 9.2 前端环境变量

```bash
# 路径: /root/workspace/modoo/modoo/.env
cat > /root/workspace/modoo/modoo/.env << 'EOF'
# ============================================
# 核心配置 - 生产环境
# ============================================
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=http://47.94.165.219:3000
EXPO_PUBLIC_CDN_URL=http://47.94.165.219:3000

# ============================================
# 微信开放平台配置
# ============================================
WECHAT_APP_ID=your-wechat-app-id

# ============================================
# Apple 配置
# ============================================
APPLE_APP_ID=com.modoo.baby
APPLE_PAY_MERCHANT_ID=merchant.com.modoo
EOF
```

---

## 10. 服务验证

### 10.1 后端服务验证

```bash
# 测试 API 健康检查
curl http://127.0.0.1:3000/

# 测试用户相关接口
curl http://127.0.0.1:3000/api/v1/content/recommendations

# 查看后端日志
pm2 logs modoo-backend
```

### 10.2 前端服务验证

```bash
# 测试 Expo Metro
curl http://127.0.0.1:8081

# 查看前端日志
pm2 logs modoo-frontend
```

### 10.3 Nginx 验证

```bash
# 测试 Nginx 配置
nginx -t

# 检查 Nginx 状态
systemctl status nginx

# 测试公网访问
curl http://47.94.165.219

# 测试 API 代理
curl http://47.94.165.219/api/v1/content/recommendations
```

### 10.4 Expo Go 远程访问

```bash
# 确保 Expo 服务正在运行
pm2 status

# 使用 tunnel 模式（推荐用于远程访问）
pm2 stop modoo-frontend

# 手动启动 tunnel 模式
cd /root/workspace/modoo/modoo
npx expo start --tunnel

# 或使用 ngrok
ngrok http 8081
```

---

## 11. 运维命令参考

### 11.1 服务管理

```bash
# 启动所有服务
pm2 start all

# 停止所有服务
pm2 stop all

# 重启所有服务
pm2 restart all

# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs
```

### 11.2 日志管理

```bash
# 查看后端日志
pm2 logs modoo-backend --lines 100

# 查看前端日志
pm2 logs modoo-frontend --lines 100

# 清空所有日志
pm2 flush

# 导出日志到文件
pm2 logs --out modoo-backend > /tmp/backend.log
```

### 11.3 系统监控

```bash
# PM2 监控
pm2 monit

# 系统资源使用
top
htop

# 内存使用
free -h

# 磁盘使用
df -h

# 网络连接
netstat -tlnp
```

### 11.4 备份与恢复

```bash
# 备份数据库
cp /root/workspace/modoo/backend/prisma/prod.db /root/backup/modoo-$(date +%Y%m%d).db

# 备份环境变量
cp /root/workspace/modoo/backend/.env /root/backup/backend.env
cp /root/workspace/modoo/modoo/.env /root/backup/modoo.env

# 恢复数据库
cp /root/backup/modoo-20260524.db /root/workspace/modoo/backend/prisma/prod.db
```

### 11.5 更新部署

```bash
# 进入项目目录
cd /root/workspace/modoo

# 拉取最新代码
git pull origin main

# 更新后端
cd backend
pm2 restart modoo-backend

# 更新前端
cd ../modoo
pm2 restart modoo-frontend
```

---

## 12. 故障排查

### 12.1 常见问题

#### 问题 1：端口无法访问

```bash
# 检查端口是否监听
netstat -tlnp | grep :3000
netstat -tlnp | grep :8081

# 检查防火墙
firewall-cmd --list-ports

# 检查安全组（阿里云控制台）
```

#### 问题 2：PM2 进程启动失败

```bash
# 查看错误日志
pm2 logs modoo-backend --err

# 检查配置文件
cat /root/workspace/modoo/backend/ecosystem.config.js

# 手动测试启动
cd /root/workspace/modoo/backend
node dist/index.js
```

#### 问题 3：Nginx 502 错误

```bash
# 检查后端服务是否运行
pm2 status

# 检查 Nginx 日志
tail -f /var/log/nginx/error.log

# 检查 Nginx 配置
nginx -t
```

#### 问题 4：Expo Go 无法连接

```bash
# 检查服务是否运行
pm2 status modoo-frontend

# 检查端口监听
netstat -tlnp | grep :8081

# 尝试使用 tunnel 模式
cd /root/workspace/modoo/modoo
npx expo start --tunnel
```

### 12.2 日志位置

| 日志类型 | 路径 |
|---------|------|
| PM2 主日志 | /root/.pm2/pm2.log |
| 后端错误日志 | /var/log/pm2/modoo-backend-error.log |
| 后端输出日志 | /var/log/pm2/modoo-backend-out.log |
| 前端错误日志 | /var/log/pm2/modoo-frontend-error.log |
| 前端输出日志 | /var/log/pm2/modoo-frontend-out.log |
| Nginx 错误日志 | /var/log/nginx/error.log |
| Nginx 访问日志 | /var/log/nginx/access.log |

### 12.3 快速恢复

```bash
# 停止所有服务
pm2 stop all

# 清除所有进程
pm2 delete all

# 重新启动
cd /root/workspace/modoo/backend && pm2 start ecosystem.config.js
cd /root/workspace/modoo/modoo && pm2 start ecosystem.config.js

# 保存进程列表
pm2 save

# 重启 Nginx
systemctl restart nginx
```

---

## 附录 A：完整的部署脚本

```bash
#!/bin/bash
# 部署脚本 - 一键部署前后端服务

set -e

echo "===== 开始部署莫朵睡眠助手 ====="

# 1. 安装基础软件
echo "1. 安装基础软件..."
yum update -y
yum install -y curl wget git vim net-tools nginx

# 2. 安装 Node.js
echo "2. 安装 Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 3. 安装 PM2
echo "3. 安装 PM2..."
npm install -g pm2

# 4. 创建目录
echo "4. 创建目录..."
mkdir -p /root/workspace/modoo
mkdir -p /var/log/pm2
mkdir -p /var/www/modoo
mkdir -p /root/backup

# 5. 防火墙配置
echo "5. 配置防火墙..."
firewall-cmd --zone=public --add-port=80/tcp --permanent
firewall-cmd --zone=public --add-port=3000/tcp --permanent
firewall-cmd --zone=public --add-port=8081/tcp --permanent
firewall-cmd --zone=public --add-port=8082/tcp --permanent
firewall-cmd --reload

# 6. 启动 Nginx
echo "6. 启动 Nginx..."
systemctl enable nginx
systemctl restart nginx

# 7. 配置后端
echo "7. 配置后端服务..."
cd /root/workspace/modoo/backend
npm install
npm run build

# 8. 配置前端
echo "8. 配置前端服务..."
cd /root/workspace/modoo/modoo
npm install

# 9. 启动服务
echo "9. 启动服务..."
cd /root/workspace/modoo/backend
pm2 start ecosystem.config.js

cd /root/workspace/modoo/modoo
pm2 start ecosystem.config.js

# 10. 保存并设置开机自启
echo "10. 设置开机自启..."
pm2 save
pm2 startup

echo "===== 部署完成 ====="
echo "请访问 http://47.94.165.219 查看前端"
echo "API 地址: http://47.94.165.219:3000"
```

---

## 附录 B：服务访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 Web | http://47.94.165.219 | 浏览器访问 |
| 后端 API | http://47.94.165.219:3000 | API 接口 |
| Expo Metro | exp://47.94.165.219:8081 | Expo Go 访问 |
| API 健康检查 | http://47.94.165.219:3000/ | 服务状态 |

---

## 附录 C：联系与支持

- 服务器: 47.94.165.219
- SSH 端口: 22
- 管理员: root
