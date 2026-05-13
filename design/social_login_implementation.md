# Apple/微信授权登录实施记录

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档名称 | Apple/微信授权登录实施方案 |
| 版本 | v1.0 |
| 创建日期 | 2026-05-04 |
| 状态 | ✅ 已完成 |

---

## 1. 实施概述

本阶段完成了Apple登录和微信登录的前后端实现，建立了第三方授权登录的基础架构。

### 1.1 完成内容

- ✅ Apple登录前端Service实现
- ✅ Apple登录后端API实现
- ✅ 微信登录前端Service接口（SDK待集成）
- ✅ 微信登录后端API实现
- ✅ 数据库字段扩展
- ✅ i18n翻译补充
- ✅ LoginScreen UI更新

---

## 2. 前端实现

### 2.1 文件变更

#### 2.1.1 新增文件

**AppleService.ts** (`dozoo/src/services/AppleService.ts`)

提供Apple登录的核心功能：

```typescript
// 核心方法
isAvailable(): boolean                    // 检查是否可用（仅iOS）
login(): Promise<AppleUserInfo>         // 执行Apple登录
getCredentialState(userId: string)       // 获取凭证状态
checkAvailability(): Promise<boolean>    // 检查Apple登录支持
```

**WeChatService.ts** - 暂未实现（微信SDK需要原生模块支持）

#### 2.1.2 修改文件

**AuthService.ts** (`dozoo/src/services/AuthService.ts`)

新增方法：

```typescript
async appleLogin(authorizationCode: string, identityToken: string): Promise<StoredUser>
async wechatLogin(code: string): Promise<StoredUser>
```

**LoginScreen.tsx** (`dozoo/src/screens/auth/LoginScreen.tsx`)

- 新增Apple和微信登录状态管理
- 新增 `handleAppleLogin()` 和 `handleWeChatLogin()` 处理函数
- 更新UI按钮，添加加载状态

### 2.2 i18n翻译补充

新增翻译键（zh-CN.json 和 en.json）：

| 键名 | 中文 | English |
|------|------|---------|
| auth.appleLoginFailed | Apple登录失败，请重试 | Apple login failed, please try again |
| auth.wechatLoginFailed | 微信登录失败，请重试 | WeChat login failed, please try again |
| auth.appleNotAvailable | Apple登录仅在iOS设备上可用 | Apple Sign In is only available on iOS |
| auth.wechatNotInstalled | 未安装微信 | WeChat is not installed |
| auth.wechatNotImplemented | 微信登录功能正在开发中 | WeChat login is under development |
| auth.downloadWeChat | 下载微信 | Download WeChat |

---

## 3. 后端实现

### 3.1 数据库变更

#### 3.1.1 Prisma Schema更新

在 `User` 模型中新增字段：

```prisma
model User {
  // ... existing fields
  appleUserId   String?   @unique  // Apple用户ID
  appleEmail    String?          // Apple邮箱
  wechatOpenid  String?   @unique // 微信OpenID
  wechatUnionid String?          // 微信UnionID
}
```

#### 3.1.2 迁移命令

```bash
cd backend
npx prisma db push --accept-data-loss --skip-generate
npx prisma generate
```

### 3.2 API端点

#### 3.2.1 POST /api/auth/apple

Apple登录接口

**请求参数**：

```json
{
  "authorizationCode": "string",
  "identityToken": "string"
}
```

**响应**：

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 900,
  "user": {
    "id": "string",
    "phone": "string",
    "nickname": "string",
    "avatar": "string"
  },
  "appleNickname": "string"
}
```

#### 3.2.2 POST /api/auth/wechat

微信登录接口

**请求参数**：

```json
{
  "code": "string"
}
```

**响应**：

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 900,
  "user": {
    "id": "string",
    "phone": "string",
    "nickname": "string",
    "avatar": "string"
  },
  "wechatNickname": "string",
  "wechatAvatar": "string"
}
```

### 3.3 环境变量配置

#### 3.3.1 Apple登录

```env
# Apple Developer 配置
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
APPLE_CLIENT_ID=com.yourcompany.dozoo
```

#### 3.3.2 微信登录

```env
# 微信开放平台配置
WECHAT_APP_ID=wxXXXXXXXXXXXXXXXXX
WECHAT_APP_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 4. 架构流程

### 4.1 Apple登录流程

```
┌─────────────────┐
│  用户点击Apple   │
│    登录按钮     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AppleService   │
│    .login()     │
│                 │
│ 获取 authorization │
│   Code & Token  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AuthService    │
│ .appleLogin()   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST /api/    │
│   auth/apple    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  后端验证Token  │
│ 解码Apple ID    │
│ Token获取sub    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  查找或创建用户  │
│ appleUserId关联  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  返回JWT Token  │
│  完成登录       │
└─────────────────┘
```

### 4.2 微信登录流程

```
┌─────────────────┐
│  用户点击微信   │
│    登录按钮     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  唤起微信授权   │
│ (需安装微信SDK) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  获取Auth Code  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AuthService    │
│ .wechatLogin()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST /api/    │
│  auth/wechat    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  通过code换取  │
│  access_token   │
│  获取openid    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  获取用户信息   │
│ (nickname,      │
│  headimgurl)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  查找或创建用户  │
│ wechatOpenid关联 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  返回JWT Token │
│  完成登录      │
└─────────────────┘
```

---

## 5. 当前状态

### 5.1 Apple登录

| 组件 | 状态 | 说明 |
|------|------|------|
| 前端AppleService | ✅ 完成 | 已实现 |
| 后端API | ✅ 完成 | 已实现 |
| 数据库字段 | ✅ 完成 | 已添加 |
| Expo配置 | ⏳ 待配置 | 需要在app.json中配置 |

### 5.2 微信登录

| 组件 | 状态 | 说明 |
|------|------|------|
| 前端WeChatService | ⏳ 待实现 | 需要安装react-native-wechat-lib |
| 后端API | ✅ 完成 | 已实现 |
| 数据库字段 | ✅ 完成 | 已添加 |
| 微信SDK | ⏳ 待集成 | 需要原生模块支持 |

### 5.3 已知限制

1. **Apple登录**：需要在Apple Developer Console配置并生成密钥
2. **微信登录**：需要安装微信SDK（react-native-wechat-lib），Expo项目需要预构建
3. **wechatLogin**目前在LoginScreen中显示"开发中"提示

---

## 6. 下一步工作

### 6.1 Apple登录

1. 在Apple Developer Console创建App ID并启用Apple Sign In
2. 创建Signing Key并下载.p8文件
3. 配置环境变量（APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY, APPLE_CLIENT_ID）
4. 在app.json中配置expo-apple-authentication插件
5. 测试登录流程

### 6.2 微信登录

1. 在微信开放平台注册应用
2. 安装微信SDK：`npx expo install react-native-wechat-lib`
3. 配置app.json中的微信SDK参数
4. 预构建原生模块：`npx expo prebuild`
5. 配置环境变量（WECHAT_APP_ID, WECHAT_APP_SECRET）
6. 实现WeChatService
7. 测试登录流程

---

## 7. 相关文档

- [Apple登录实现方案](./Apple_Login_Implementation_Plan.md)
- [微信登录实现方案](./WeChat_Login_Implementation_Plan.md)
- [i18n架构实施方案](./i18n_architecture_implementation.md)

---

## 8. 维护记录

| 日期 | 版本 | 修改内容 | 作者 |
|------|------|----------|------|
| 2026-05-04 | v1.0 | 初始实现，完成Apple和微信登录基础架构 | AI Assistant |

---

*文档结束*
