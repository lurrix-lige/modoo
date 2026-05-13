# 微信授权登录 - 完整实现方案

## 一、技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React Native)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ LoginScreen │  │ WeChatService│  │ AuthService      │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼──────────────────┼─────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端 API                                │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ /api/auth/wechat│  │ /api/auth/login │                   │
│  │    /code        │  │                 │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
└───────────┼────────────────────┼────────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    微信开放平台                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  授权登录  │  获取用户信息  │  绑定手机号(可选)      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 二、前端实现

### 2.1 安装依赖

```bash
# 使用 expo-dev-client 支持原生模块
npx expo install expo-dev-client

# 微信 SDK (需要预构建)
npm install react-native-wechat-lib
```

### 2.2 配置 app.json

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-wechat-lib",
        {
          "wechatAppId": "YOUR_WECHAT_APP_ID",
          "UniversalLinks": {
            "ios": "https://your-domain.com/ulinks/",
            "android": {
              "package": "com.yourcompany.dozoo",
              "sha256": "YOUR_SHA256_FINGERPRINT"
            }
          }
        }
      ]
    ]
  }
}
```

### 2.3 WeChat Service

```typescript
// src/services/WeChatService.ts

import { Platform } from 'react-native';
import * as WeChat from 'react-native-wechat-lib';

const WECHAT_APP_ID = process.env.EXPO_PUBLIC_WECHAT_APP_ID;
const WECHAT_UNIVERSAL_LINK = process.env.EXPO_PUBLIC_WECHAT_UNIVERSAL_LINK;

export interface WeChatUserInfo {
  openid: string;
  nickname?: string;
  avatar?: string;
  unionid?: string;
}

export interface WeChatAuthResult {
  code: string;
  userInfo?: WeChatUserInfo;
}

class WeChatService {
  private static instance: WeChatService;
  private isInstalled: boolean = false;

  private constructor() {}

  static getInstance(): WeChatService {
    if (!WeChatService.instance) {
      WeChatService.instance = new WeChatService();
    }
    return WeChatService.instance;
  }

  async initialize(): Promise<void> {
    try {
      this.isInstalled = await WeChat.isWXAppInstalled();
      if (this.isInstalled) {
        await WeChat.registerApp(WECHAT_APP_ID!, WECHAT_UNIVERSAL_LINK);
      }
    } catch (error) {
      console.warn('WeChat SDK initialization failed:', error);
      this.isInstalled = false;
    }
  }

  isWeChatAvailable(): boolean {
    return this.isInstalled;
  }

  async getWeChatInstallUrl(): Promise<string> {
    if (Platform.OS === 'ios') {
      return 'https://itunes.apple.com/cn/app/id414478124';
    }
    return 'https://android.myapp.com/myapp/detail.htm?apkName=com.tencent.mm';
  }

  async login(): Promise<WeChatAuthResult> {
    if (!this.isInstalled) {
      throw new Error('WeChat is not installed');
    }

    try {
      const scope = 'snsapi_userinfo';
      const state = `dozoo_${Date.now()}`;

      // 唤起微信授权
      const authResult = await WeChat.sendAuthRequest(scope, state);

      if (authResult.errCode !== 0) {
        throw new Error(authResult.errStr || 'WeChat auth failed');
      }

      return {
        code: authResult.code!,
      };
    } catch (error) {
      console.error('WeChat login error:', error);
      throw error;
    }
  }

  async getUserInfo(accessToken: string): Promise<WeChatUserInfo> {
    try {
      const userInfo = await WeChat.getUserInfo(accessToken);
      return userInfo;
    } catch (error) {
      console.error('Failed to get WeChat user info:', error);
      throw error;
    }
  }
}

export const weChatService = WeChatService.getInstance();
```

### 2.4 扩展 AuthService

```typescript
// src/services/AuthService.ts 新增方法

async wechatLogin(code: string): Promise<StoredUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/wechat/code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error(i18n.t('auth.wechatLoginFailed'));
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
    nickname: data.user.nickname || data.wechatNickname,
    avatar: data.user.avatar || data.wechatAvatar,
    createdAt: data.user.createdAt,
  };

  await this.setUser(user);
  this.startSessionCheck();

  return user;
}
```

### 2.5 更新 LoginScreen

```typescript
// src/screens/auth/LoginScreen.tsx

import { WeChat } from 'lucide-react-native';  // 替换 Star
import { weChatService } from '../../services/WeChatService';

// 新增状态
const [wechatLoading, setWechatLoading] = useState(false);

// 微信登录处理
const handleWeChatLogin = async () => {
  if (!weChatService.isWeChatAvailable()) {
    Alert.alert(
      t('common.hint'),
      t('auth.wechatNotInstalled'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.downloadWeChat'), onPress: () => {
          Linking.openURL(weChatService.getWeChatInstallUrl());
        }},
      ]
    );
    return;
  }

  setWechatLoading(true);
  try {
    const { code } = await weChatService.login();
    const user = await authService.wechatLogin(code);
    setAuthenticated(true, user);

    // 后续导航逻辑...
    handlePostLoginNavigation(user);
  } catch (error) {
    if ((error as any).message !== 'User cancelled') {
      Alert.alert(t('common.error'), t('auth.wechatLoginFailed'));
    }
  } finally {
    setWechatLoading(false);
  }
};

// 更新按钮 UI
<TouchableOpacity
  style={[styles.socialButton, { backgroundColor: colors.surface }]}
  onPress={handleWeChatLogin}
  disabled={wechatLoading}
>
  {wechatLoading ? (
    <ActivityIndicator color={colors.success} />
  ) : (
    <WeChat size={24} color="#07C160" />  // 微信绿
  )}
  <Text style={[styles.socialText, { color: colors.textPrimary }]}>
    {t('auth.wechatLogin')}
  </Text>
</TouchableOpacity>
```

## 三、后端实现

### 3.1 路由配置

```typescript
// backend/src/routes/auth.ts

import { Router } from 'express';
import axios from 'axios';

const router = Router();

const WECHAT_APP_ID = process.env.WECHAT_APP_ID;
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET;

// 微信登录 - 通过 code 换取 token
router.post('/wechat/code', async (req, res) => {
  try {
    const { code } = req.body;

    // 1. 通过 code 获取 access_token
    const tokenResponse = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
      params: {
        appid: WECHAT_APP_ID,
        secret: WECHAT_APP_SECRET,
        code,
        grant_type: 'authorization_code',
      },
    });

    const { access_token, openid, unionid, refresh_token } = tokenResponse.data;

    // 2. 获取用户信息
    const userInfoResponse = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
      params: {
        access_token,
        openid,
      },
    });

    const wechatUser = userInfoResponse.data;

    // 3. 查找或创建用户
    let user = await prisma.user.findFirst({
      where: { wechatOpenid: openid },
    });

    if (!user) {
      // 新用户 - 创建账号
      user = await prisma.user.create({
        data: {
          phone: '', // 需要后续绑定手机号
          nickname: wechatUser.nickname,
          avatar: wechatUser.headimgurl,
          wechatOpenid: openid,
          wechatUnionid: unionid,
        },
      });
    }

    // 4. 生成应用 token
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
      wechatNickname: wechatUser.nickname,
      wechatAvatar: wechatUser.headimgurl,
    });
  } catch (error) {
    console.error('WeChat login error:', error);
    res.status(500).json({ error: 'WeChat login failed' });
  }
});

export default router;
```

### 3.2 数据库更新

```prisma
// backend/prisma/schema.prisma

model User {
  // ... existing fields
  wechatOpenid  String?  @unique
  wechatUnionid String?

  @@map("users")
}
```

```sql
-- 添加微信字段
ALTER TABLE users ADD COLUMN wechat_openid VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN wechat_unionid VARCHAR(255);
```

## 四、微信开放平台配置

### 4.1 iOS 配置

1. 登录 [微信开放平台](https://open.weixin.qq.com)
2. 添加 iOS 应用
3. 配置 Bundle ID 和 Universal Link
4. 开启「消息」和「OAuth」权限

### 4.2 Android 配置

1. 添加 Android 应用
2. 配置应用签名（SHA256）
3. 配置包名

### 4.3 Universal Link (iOS 13+)

```
https://your-domain.com/ulinks/
├── apple-app-site-association
└── index.html
```

## 五、安全考虑

### 5.1 敏感信息处理

| 信息 | 处理方式 |
|------|---------|
| WeChat App Secret | 仅在后端使用，不暴露 |
| Access Token | 加密存储，定期刷新 |
| 用户手机号 | 可选绑定，明文不存储 |

### 5.2 风险控制

- 同一 openid 短时间内频繁登录 → 限流
- 异常登录行为 → 验证码二次确认
- 微信接口调用频率限制 → 本地缓存 + 重试机制

## 六、测试清单

- [ ] WeChat SDK 初始化
- [ ] 未安装微信提示
- [ ] 用户取消授权处理
- [ ] 授权过期重新登录
- [ ] 新用户自动创建账号
- [ ] 老用户静默登录
- [ ] Token 刷新机制
- [ ] 错误处理和提示

## 七、注意事项

1. **Universal Link** 必须正确配置，否则 iOS 14+ 会失败
2. **App ID** 和 **App Secret** 必须匹配微信开放平台配置
3. **iOS ATS** 配置需允许微信 Universal Link
4. Android 签名必须与开放平台配置一致
