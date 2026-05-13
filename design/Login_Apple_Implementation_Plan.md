# Apple 授权登录 - 完整实现方案

## 一、技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React Native + Expo)              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ LoginScreen │  │ AppleService │  │ AuthService      │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼──────────────────┼─────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端 API                                │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ /api/auth/apple  │  │ /api/auth/login │                   │
│  │    /code        │  │                 │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
└───────────┼────────────────────┼────────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Apple Sign In                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Apple ID  │  Identity Token  │  User ID (sub)     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 二、技术优势

| 特性 | Apple Sign In | 微信登录 |
|------|---------------|----------|
| 隐私保护 | 无需提供手机号/邮箱 | 需要手机号 |
| 账号安全 | Apple 强认证 | 微信账号安全 |
| 开发难度 | ⭐ 简单 | ⭐⭐⭐ 复杂 |
| SDK 复杂度 | ⭐ 轻量 | ⭐⭐⭐ 重量级 |
| 审核风险 | ⭐⭐ 需符合 Apple 政策 | 低 |
| 跨平台 | iOS/Android/Web | 仅移动端 |

## 三、前端实现

### 3.1 安装依赖

```bash
# Expo 项目使用 expo-apple-authentication
npx expo install expo-apple-authentication

# 非 Expo 项目
npm install react-native-apple-authentication
```

### 3.2 配置 (iOS)

在 Apple Developer Console 配置：
1. 创建 App ID 并开启 Apple Sign In
2. 创建 Service ID
3. 创建 Key 并下载

### 3.3 Apple Service

```typescript
// src/services/AppleService.ts

import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export interface AppleUserInfo {
  userId: string;          // Apple 用户唯一标识
  email?: string;          // 可选，用户可能隐藏
  fullName?: {
    givenName?: string;
    familyName?: string;
    nickname?: string;
  };
  identityToken?: string;   // 用于服务端验证
  authorizationCode?: string; // 用于服务端验证
}

export interface AppleAuthResult {
  userInfo: AppleUserInfo;
  credential;
}

class AppleService {
  private static instance: AppleService;

  private constructor() {}

  static getInstance(): AppleService {
    if (!AppleService.instance) {
      AppleService.instance = new AppleService();
    }
    return AppleService.instance;
  }

  isAvailable(): boolean {
    return Platform.OS === 'ios';
  }

  async login(): Promise<AppleUserInfo> {
    if (!this.isAvailable()) {
      throw new Error('Apple Sign In is only available on iOS');
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      return {
        userId: credential.user,
        email: credential.email,
        fullName: credential.fullName ? {
          givenName: credential.fullName.givenName,
          familyName: credential.fullName.familyName,
          nickname: credential.fullName.nickname,
        } : undefined,
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode,
      };
    } catch (error) {
      if ((error as any).code === 'ERR_CANCELED') {
        throw new Error('User cancelled Apple Sign In');
      }
      throw error;
    }
  }

  async getCredentialState(userId: string): Promise<'notFound' | 'revoked' | 'authorized'> {
    const state = await AppleAuthentication.getCredentialStateAsync(userId);
    return state;
  }
}

export const appleService = AppleService.getInstance();
```

### 3.4 扩展 AuthService

```typescript
// src/services/AuthService.ts 新增方法

async appleLogin(authorizationCode: string, identityToken: string): Promise<StoredUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/apple`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authorizationCode,
      identityToken,
    }),
  });

  if (!response.ok) {
    throw new Error(i18n.t('auth.appleLoginFailed'));
  }

  const data = await response.json();

  await this.setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
  });

  const user: StoredUser = {
    id: data.user.id,
    phone: data.user.phone || '',
    nickname: data.user.nickname || data.appleNickname || 'Apple User',
    avatar: data.user.avatar || data.appleAvatar,
    createdAt: data.user.createdAt,
  };

  await this.setUser(user);
  this.startSessionCheck();

  return user;
}
```

### 3.5 更新 LoginScreen

```typescript
// src/screens/auth/LoginScreen.tsx

import { Apple } from 'lucide-react-native';
import { appleService } from '../../services/AppleService';

// 新增状态
const [appleLoading, setAppleLoading] = useState(false);

// Apple 登录处理
const handleAppleLogin = async () => {
  if (!appleService.isAvailable()) {
    Alert.alert(
      t('common.hint'),
      t('auth.appleNotAvailable')
    );
    return;
  }

  setAppleLoading(true);
  try {
    const { userInfo } = await appleService.login();

    if (!userInfo.authorizationCode) {
      throw new Error('No authorization code received');
    }

    const user = await authService.appleLogin(
      userInfo.authorizationCode,
      userInfo.identityToken || ''
    );

    setAuthenticated(true, user);
    handlePostLoginNavigation(user);
  } catch (error) {
    const errorMessage = (error as any).message;
    if (errorMessage !== 'User cancelled Apple Sign In') {
      Alert.alert(t('common.error'), t('auth.appleLoginFailed'));
    }
  } finally {
    setAppleLoading(false);
  }
};

// 更新按钮 UI
<TouchableOpacity
  style={[styles.socialButton, { backgroundColor: colors.surface }]}
  onPress={handleAppleLogin}
  disabled={appleLoading}
>
  {appleLoading ? (
    <ActivityIndicator color={colors.textPrimary} />
  ) : (
    <Apple size={24} color={colors.textPrimary} />
  )}
  <Text style={[styles.socialText, { color: colors.textPrimary }]}>
    {t('auth.appleLogin')}
  </Text>
</TouchableOpacity>
```

## 四、后端实现

### 4.1 路由配置

```typescript
// backend/src/routes/auth.ts

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import appleSignin from 'apple-signin-auth';

const router = Router();

const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID; // Bundle ID 或 Service ID

// Apple 登录
router.post('/apple', async (req, res) => {
  try {
    const { authorizationCode, identityToken } = req.body;

    // 1. 验证 Apple Identity Token
    const appleIdToken = await appleSignin.verifyIdToken(identityToken, {
      audience: APPLE_CLIENT_ID,
      ignoreExpiration: false,
    });

    const { sub: appleUserId, email } = appleIdToken;

    // 2. 使用 Apple 原生验证（更安全）
    const appleResponse = await appleSignin.getAuthorizationState(authorizationCode, {
      clientId: APPLE_CLIENT_ID,
      teamId: APPLE_TEAM_ID,
      keyId: APPLE_KEY_ID,
      privateKey: APPLE_PRIVATE_KEY,
    });

    // 3. 查找或创建用户
    let user = await prisma.user.findFirst({
      where: { appleUserId: appleUserId },
    });

    if (!user) {
      // 新用户 - 创建账号
      user = await prisma.user.create({
        data: {
          phone: email || '',
          nickname: 'Apple User',
          appleUserId: appleUserId,
          appleEmail: email,
        },
      });
    }

    // 4. 生成应用 Token
    const tokens = generateAuthTokens(user.id);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      appleNickname: 'Apple User',
    });
  } catch (error) {
    console.error('Apple login error:', error);
    res.status(500).json({ error: 'Apple login failed' });
  }
});

export default router;
```

### 4.2 安装 Apple 验证库

```bash
npm install apple-signin-auth
npm install @types/apple-signin-auth # TypeScript
```

### 4.3 数据库更新

```prisma
// backend/prisma/schema.prisma

model User {
  // ... existing fields
  appleUserId   String?  @unique
  appleEmail    String?

  @@map("users")
}
```

### 4.4 环境变量

```env
# Apple Developer 配置
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
APPLE_CLIENT_ID=com.yourcompany.dozoo
```

## 五、Apple Developer Console 配置

### 5.1 创建 App ID

1. 登录 [Apple Developer Console](https://developer.apple.com)
2. Certificates, Identifiers & Profiles → Identifiers
3. 创建 App ID，确保包含 Apple Sign In capability

### 5.2 创建 Service ID (可选，用于 Web)

1. Identifiers → Services IDs → 创建
2. 配置 Return URLs

### 5.3 创建 Signing Key

1. Keys → 创建 Key
2. 启用 Apple Sign In
3. 下载 .p8 文件
4. **注意：私钥只能下载一次，妥善保管**

### 5.4 Expo 配置

```json
// app.json 或 app.config.js
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.dozoo",
      "infoPlist": {
        "SignInWithApple": true
      }
    },
    "plugins": [
      [
        "expo-apple-authentication",
        {
          "requestedScopes": [
            "FULL_NAME",
            "EMAIL"
          ]
        }
      ]
    ]
  }
}
```

## 六、安全考虑

### 6.1 Token 验证

| 验证方式 | 说明 |
|---------|------|
| Identity Token | JWT，包含用户信息和签名 |
| Authorization Code | 一次性使用，用于服务端验证 |
| State 参数 | 防止 CSRF 攻击 |

### 6.2 数据保护

- Apple 返回的 email 可能为 private relay 地址
- 不存储敏感的 Apple 相关 token
- 定期验证 credential state

## 七、Apple 审核要点

### 7.1 必须展示 Apple Sign In 按钮

```tsx
// Apple 官方按钮样式
import * as AppleAuthentication from 'expo-apple-authentication';

<AppleAuthentication.AppleAuthenticationButton
  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
  cornerRadius={8}
  style={{ width: 200, height: 44 }}
  onPress={handleAppleLogin}
/>
```

### 7.2 审核被拒常见原因

| 原因 | 解决方案 |
|------|---------|
| 未提供替代登录方式 | 必须保留手机号登录 |
| 按钮样式不符合规范 | 使用官方组件或近似样式 |
| 未说明数据使用 | 隐私政策需说明 |

### 7.3 合规要求

- 隐私政策必须明确说明使用 Apple ID 登录
- 不得以 Apple 登录作为唯一登录方式
- 用户有权删除账号及关联数据

## 八、测试清单

- [ ] Apple SDK 初始化
- [ ] 用户取消授权处理
- [ ] 授权过期重新登录
- [ ] 新用户自动创建账号
- [ ] 老用户静默登录
- [ ] Token 刷新机制
- [ ] 错误处理和提示
- [ ] 按钮样式符合 Apple HIG

## 九、注意事项

1. **Apple Sign In 仅在真机上可用**，Simulator 无法测试
2. **Full Name 仅在首次授权时返回**，后续为空
3. **Email 可能被隐藏**，使用 private relay 地址
4. **必须提供替代登录方式**（保留手机号登录）
5. **审核时需准备隐私政策文档**

## 十、迁移建议

### 现有用户绑定 Apple ID

```typescript
// 在 Profile 页面提供绑定入口
const handleBindApple = async () => {
  const { userInfo } = await appleService.login();
  await authService.bindApple(userInfo.userId, userInfo.authorizationCode);
};
```

## 十一、与现有手机号登录的关系

```
                    ┌─────────────────┐
                    │   LoginScreen   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │ 手机号登录 │      │ 微信登录  │      │ Apple登录 │
    └────┬─────┘      └────┬─────┘      └────┬─────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ▼
                   ┌───────────────┐
                   │  统一用户系统  │
                   │   (User ID)   │
                   └───────────────┘
```

所有登录方式最终都绑定到同一个 User ID，支持同一用户多种登录方式。
