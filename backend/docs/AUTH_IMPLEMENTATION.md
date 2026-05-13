# 后台登录API实现说明

## 功能概述

本次实现完善了后台登录API，包含以下功能：

1. **账号合规性验证** - 可配置的手机号格式验证
2. **验证码安全验证** - 防止暴力破解的安全机制
3. **自动用户注册** - 新用户自动创建账号
4. **完整的错误处理** - 清晰的错误信息返回
5. **数据库优化** - 使用事务保证数据一致性
6. **单元测试覆盖** - 保证代码质量

## 新增文件

```
backend/src/
├── services/
│   ├── accountValidationService.ts   # 账号验证服务
│   ├── authService.ts                 # 认证服务
│   ├── userService.ts                 # 用户服务
│   └── __tests__/
│       ├── accountValidationService.test.ts
│       └── userService.test.ts
├── vitest.config.ts
└── docs/
    └── AUTH_IMPLEMENTATION.md
```

## 主要变更

### 1. accountValidationService.ts

提供可配置的账号验证功能：

**配置项：**
- `ACCOUNT_VALIDATION_ENABLED` - 是否启用验证
- `PHONE_VALIDATION_PATTERN` - 手机号正则表达式
- `MIN_PHONE_LENGTH` / `MAX_PHONE_LENGTH` - 手机号长度限制
- `BLOCKED_PHONE_PREFIXES` - 禁止的手机号前缀
- `BLOCKED_PHONES` - 禁止的手机号列表

**主要函数：**
- `validateAccount(phone)` - 验证账号合规性
- `isPhoneFormatValid(phone)` - 检查手机号格式
- `updateAccountValidationConfig()` - 动态更新配置

### 2. verificationService.ts (已更新)

增强验证码验证的安全性：

**新增功能：**
- 验证码错误次数限制（默认3次）
- 账号临时锁定机制
- 内存中的尝试次数追踪
- 自动清理过期锁定

**配置项：**
- `MAX_VERIFY_ATTEMPTS` - 最大验证尝试次数

### 3. userService.ts

优化用户查询和创建逻辑：

**主要功能：**
- `findUserByPhone()` - 通过手机号查找用户（包含关联数据）
- `findUserByAppleId()` - 通过Apple ID查找
- `findUserByWechatOpenid()` - 通过微信OpenID查找
- `createUser()` - 创建用户（使用事务）
- `findOrCreateUserByPhone()` - 查找或创建用户

**优化点：**
- 使用 Prisma 事务保证数据一致性
- 自动创建通知设置和隐私设置记录
- 预先加载用户关联数据（孩子信息、订阅状态）

### 4. authService.ts

封装登录逻辑的核心服务：

**主要功能：**
- `loginWithPhone()` - 手机号验证码登录
- `loginWithApple()` - Apple登录
- `loginWithWechat()` - 微信登录
- `refreshAccessToken()` - 刷新访问令牌
- `logout()` - 用户登出

**返回数据结构：**
```typescript
{
  accessToken: string;       // JWT访问令牌
  refreshToken: string;      // 刷新令牌
  expiresIn: number;         // 过期时间（秒）
  user: {
    id: string;
    phone: string;
    nickname: string | null;
    avatar: string | null;
    isNewUser: boolean;      // 是否为新注册用户
  }
}
```

### 5. auth.ts (已更新)

重构认证路由，使用新的服务层：

- 简化路由逻辑
- 统一错误处理
- 保持API接口兼容性

## 配置说明

在 `.env` 文件中新增以下配置：

```env
# 账号验证配置
ACCOUNT_VALIDATION_ENABLED=true
PHONE_VALIDATION_PATTERN=^1[3-9]\d{9}$
MIN_PHONE_LENGTH=11
MAX_PHONE_LENGTH=11
BLOCKED_PHONE_PREFIXES=
BLOCKED_PHONES=

# 验证码安全配置
MAX_VERIFY_ATTEMPTS=3

# Token配置
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7
```

## 错误码说明

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| VALIDATION_ERROR | 400 | 参数验证失败 |
| ACCOUNT_BLOCKED | 403 | 账号被限制 |
| RATE_LIMITED | 429 | 请求过于频繁 |
| VERIFY_FAILED | 429 | 验证失败次数过多 |
| UNAUTHORIZED | 401 | 未授权/Token过期 |
| USER_EXISTS | 409 | 用户已存在 |
| CONFIG_ERROR | 500 | 配置错误 |
| APPLE_LOGIN_FAILED | 500 | Apple登录失败 |
| WECHAT_LOGIN_FAILED | 500 | 微信登录失败 |

## 测试

### 运行测试

```bash
# 安装依赖
npm install

# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 测试覆盖范围

- ✅ 账号验证服务
- ⏳ 用户服务
- ⏳ 认证服务
- ⏳ 集成测试

## 使用示例

### 手机号登录流程

1. **发送验证码**
```http
POST /api/v1/auth/sendCode
Content-Type: application/json

{
  "phone": "13812345678"
}
```

2. **登录**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "phone": "13812345678",
  "code": "123456"
}
```

3. **响应示例**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "Vq1xYz...",
    "expiresIn": 900,
    "user": {
      "id": "uuid-here",
      "phone": "13812345678",
      "nickname": "用户5678",
      "avatar": null,
      "isNewUser": true
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 安全特性

1. **验证码防暴力破解** - 限制错误次数，临时锁定
2. **请求频率限制** - 防止滥用验证码发送
3. **数据库事务** - 保证用户创建的数据一致性
4. **Token自动过期** - accessToken短期有效，refreshToken长期有效
5. **可配置验证规则** - 灵活适应不同业务需求

## 后续优化建议

1. 添加更多集成测试
2. 实现真实短信发送功能
3. 添加登录日志记录
4. 实现更复杂的风险控制规则
5. 添加验证码图片验证选项
6. 实现设备指纹识别
