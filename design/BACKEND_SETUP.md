# Dozoo Backend Setup Guide

## Overview

后端 API 已完成基本搭建，包括：
- 完整的数据模型（Prisma Schema）
- 所有核心业务 API 路由
- 种子数据初始化脚本
- 用户认证（JWT）
- 错误处理

## Database Setup

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（如果不存在）：

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dozoo-super-secret-key-change-in-production"
PORT=3000
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 推送 Schema 到数据库
npm run db:push

# 运行种子数据
npm run db:seed
```

## API Routes

### Auth
- `POST /api/auth/sendCode` - 发送验证码
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新 Token
- `POST /api/auth/logout` - 登出

### User & Child Profile
- `GET /api/user/profile` - 获取用户资料
- `PUT /api/user/profile` - 更新用户资料
- `GET /api/user/child` - 获取儿童资料
- `POST /api/user/child` - 创建儿童资料
- `PUT /api/user/child` - 更新儿童资料

### Stories
- `GET /api/stories` - 获取故事列表
- `GET /api/stories/:id` - 获取故事详情
- `POST /api/stories/:id/progress` - 记录播放进度
- `GET /api/stories/:id/audio` - 获取音频流

### Courses
- `GET /api/courses` - 获取课程列表
- `GET /api/courses/:id` - 获取课程详情
- `POST /api/courses/lessons/:lessonId/complete` - 标记课时完成

### Breathing
- `GET /api/breathing/exercises` - 获取呼吸练习
- `GET /api/breathing/exercises/:id` - 获取练习详情
- `GET /api/breathing/white-noises` - 获取白噪音
- `GET /api/breathing/white-noises/categories` - 获取白噪音分类

### Check-in
- `POST /api/checkin` - 打卡
- `GET /api/checkin/streak` - 获取打卡连续数据
- `GET /api/checkin/history` - 获取历史记录

### Articles
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/:id` - 获取文章详情
- `GET /api/articles/categories` - 获取分类

### Dialogues
- `GET /api/dialogues` - 获取话术列表
- `GET /api/dialogues/:id` - 获取话术详情
- `GET /api/dialogues/categories` - 获取分类

### Experts
- `GET /api/experts` - 获取专家列表
- `GET /api/experts/:id` - 获取专家详情
- `GET /api/experts/:id/time-slots` - 获取可预约时间
- `POST /api/experts/bookings` - 创建预约
- `GET /api/experts/bookings/my` - 获取我的预约
- `PUT /api/experts/bookings/:id` - 更新预约

### Membership
- `GET /api/membership/plans` - 获取会员套餐
- `GET /api/membership/status` - 获取当前会员状态
- `POST /api/membership/subscribe` - 订阅会员
- `POST /api/membership/cancel` - 取消订阅

## Development

### 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 健康检查

```bash
GET http://localhost:3000/health
```

### 构建生产版本

```bash
npm run build
npm start
```

## Seed Data

种子数据包含：
- 4 个故事
- 3 个课程（共 12 个课时）
- 3 个呼吸练习
- 8 个白噪音
- 4 篇文章
- 6 个话术
- 3 位专家

## API Testing

使用 Postman 或 curl 进行测试：

### 1. 发送验证码

```bash
POST http://localhost:3000/api/auth/sendCode
Content-Type: application/json

{
  "phone": "13800138000"
}
```

### 2. 登录（使用任意 4 位验证码）

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "phone": "13800138000",
  "code": "1234"
}
```

### 3. 获取故事列表（带 Token）

```bash
GET http://localhost:3000/api/stories
Authorization: Bearer {accessToken}
```

## Database Reset

如果需要重置数据库：

```bash
# 删除数据库文件
rm -f prisma/dev.db

# 重新初始化
npm run db:push
npm run db:seed
```

## Troubleshooting

### Prisma Client 未找到

```bash
npm run db:generate
```

### 端口被占用

修改 `.env` 中的 `PORT` 或使用以下命令：

```bash
lsof -ti:3000 | xargs kill -9
```

## Next Steps

1. 配置真实的短信服务（替换模拟发送）
2. 添加更多错误处理和日志
3. 实现支付集成
4. 添加 API 文档（Swagger）
5. 部署到生产环境
