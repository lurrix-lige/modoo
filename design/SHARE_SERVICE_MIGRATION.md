# ShareService 模块迁移文档

## 1. 迁移概述

### 1.1 迁移背景

原 Share 模块位于 `src/utils/share/` 目录，由于其包含业务逻辑、状态管理和外部依赖，不符合 util 包的设计定位（util 包应存放无状态、无副作用的纯工具函数）。为了遵循单一职责原则和关注点分离原则，将 Share 模块迁移至 `src/services/ShareService/` 目录。

### 1.2 迁移目标

| 目标 | 描述 |
|------|------|
| 架构优化 | 将业务服务与工具类分离，符合软件设计原则 |
| 职责清晰 | ShareService 作为业务服务层，负责分享功能的完整实现 |
| 可扩展性 | 便于后续添加新的分享平台和功能扩展 |
| 团队协作 | 清晰的模块边界提高团队协作效率 |

---

## 2. 架构设计

### 2.1 新架构结构

```
src/services/ShareService/
├── types/                     # 类型定义
│   └── index.ts
├── strategies/                # 分享策略实现
│   ├── BaseShareStrategy.ts   # 基础策略抽象类
│   ├── NativeShareStrategy.ts # 原生分享策略
│   ├── WechatShareStrategy.ts # 微信分享策略
│   ├── QQShareStrategy.ts     # QQ分享策略
│   ├── WeiboShareStrategy.ts  # 微博分享策略
│   └── index.ts
├── hooks/                     # React Hooks
│   ├── useShare.ts            # 分享状态管理Hook
│   └── index.ts
├── ShareFactory.ts            # 工厂类（单例模式）
├── ShareContentOptimizer.ts   # 内容优化器（平台适配）
├── share.ts                   # 便捷API入口
├── index.ts                   # 模块出口
└── share.test.ts              # 单元测试
```

### 2.2 核心设计模式

| 模式 | 应用位置 | 作用 |
|------|----------|------|
| **工厂模式** | ShareFactory | 管理策略注册和分发 |
| **策略模式** | strategies/ | 封装不同平台的分享逻辑 |
| **单例模式** | ShareFactory | 确保全局唯一实例 |

### 2.3 模块依赖关系

```
┌─────────────────────────────────────────────────────────┐
│                     ShareService                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌──────────────────┐               │
│  │ ShareFactory│────▶│  Strategies      │               │
│  │  (工厂类)   │    │ (Native/Wechat/  │               │
│  └─────────────┘    │  QQ/Weibo)       │               │
│         │           └──────────────────┘               │
│         ▼                                              │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │ShareContentOpti- │    │      hooks       │          │
│  │   mizer          │    │   (useShare)    │          │
│  └──────────────────┘    └──────────────────┘          │
└─────────────────────────────────────────────────────────┘
            │                        │
            ▼                        ▼
    ┌──────────────┐      ┌──────────────────────┐
    │   share.ts   │      │  StoryPlayerScreen   │
    │ (便捷API)    │      │  ArticleDetailScreen │
    └──────────────┘      └──────────────────────┘
```

---

## 3. 迁移步骤

### 3.1 准备阶段

1. **评估迁移范围**：识别所有引用原 share 模块的文件
   - `src/screens/children/StoryPlayerScreen.tsx`
   - `src/screens/parent/ArticleDetailScreen.tsx`

2. **备份原文件**：在迁移前备份 `src/utils/share/` 目录

### 3.2 执行阶段

| 步骤 | 操作 | 文件 |
|------|------|------|
| 1 | 创建目录结构 | `src/services/ShareService/{strategies,hooks,types}` |
| 2 | 迁移类型定义 | `types/index.ts` |
| 3 | 迁移策略类 | `strategies/*.ts` |
| 4 | 迁移工厂类 | `ShareFactory.ts` |
| 5 | 迁移内容优化器 | `ShareContentOptimizer.ts` |
| 6 | 迁移便捷API | `share.ts` |
| 7 | 迁移 Hooks | `hooks/useShare.ts` |
| 8 | 更新模块出口 | `index.ts` |
| 9 | 更新页面导入 | `StoryPlayerScreen.tsx`, `ArticleDetailScreen.tsx` |
| 10 | 更新 services/index.ts | 添加 ShareService 导出 |
| 11 | 删除旧目录 | `src/utils/share/` |

### 3.3 验证阶段

1. **TypeScript 编译验证**：确保无类型错误
   ```bash
   npx tsc --noEmit
   ```

2. **功能测试**：验证分享功能正常工作

3. **回滚机制**：保留旧代码备份，如需回滚可快速恢复

---

## 4. API 接口说明

### 4.1 核心 API

#### share 便捷接口

```typescript
// 使用指定平台分享
await share.to('wechat', { title: '标题', description: '描述', url: 'https://...' });

// 原生分享
await share.native(options);

// 微信分享
await share.wechat(options);

// QQ分享
await share.qq(options);

// 微博分享
await share.weibo(options);

// 自动选择可用平台
await share.auto(options, ['wechat', 'qq', 'native']);
```

#### useShare Hook

```typescript
const { 
  isLoading, 
  error, 
  result, 
  shareNative, 
  shareWechat 
} = useShare();

const handleShare = async () => {
  const result = await shareNative({ title: '测试', description: '描述' });
  if (result.success) {
    // 分享成功
  }
};
```

### 4.2 类型定义

```typescript
export type SharePlatform = 'native' | 'wechat' | 'qq' | 'weibo';

export interface ShareOptions {
  title: string;           // 必填：分享标题
  description?: string;    // 可选：分享描述
  url?: string;            // 可选：分享链接
  imageUrl?: string;       // 可选：分享图片
}

export interface ShareResult {
  success: boolean;        // 是否成功
  platform?: SharePlatform; // 分享平台
  message?: string;        // 错误信息
}
```

---

## 5. 平台适配策略

### 5.1 内容优化规则

| 平台 | 标题最大长度 | 描述最大长度 | 是否支持Emoji |
|------|-------------|-------------|--------------|
| native | 100 | 500 | ✅ |
| wechat | 50 | 100 | ❌ |
| qq | 60 | 120 | ❌ |
| weibo | 140 | 140 | ✅ |

### 5.2 平台检测机制

每个策略类实现 `canShare()` 方法，用于检测平台可用性：

- **Native**：始终可用
- **WeChat**：检测 SDK 是否安装且微信客户端存在
- **QQ**：检测 SDK 是否安装且 QQ 客户端存在
- **Weibo**：检测 SDK 是否安装且微博客户端存在

---

## 6. 测试验证

### 6.1 测试用例覆盖

| 测试类别 | 测试内容 |
|----------|----------|
| 工厂模式 | 单例验证、策略注册、平台分发 |
| 策略模式 | 平台检测、分享执行、错误处理 |
| 内容优化 | 文本截断、Emoji过滤、平台适配 |
| Hooks | 状态管理、异步分享、错误捕获 |

### 6.2 测试配置

**Jest 配置文件** (`jest.config.js`)：
```javascript
module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'node',
  clearMocks: false,
};
```

### 6.3 测试命令

```bash
# 运行 ShareService 单元测试
npm test -- --testPathPatterns=ShareService

# 运行所有测试
npm test

# 监听模式（开发时使用）
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

### 6.4 测试结果

| 测试类别 | 测试用例 | 状态 |
|----------|----------|------|
| ShareContentOptimizer | 10个测试 | ✅ 通过 |
| Platform Configurations | 5个测试 | ✅ 通过 |
| String Utilities | 3个测试 | ✅ 通过 |
| **总计** | **18个测试** | ✅ **全部通过** |

---

## 7. 运维指南

### 7.1 添加新分享平台

1. 创建新策略类，继承 `BaseShareStrategy`
2. 实现 `platform` 属性和 `share()` 方法
3. 在 `ShareFactory.registerDefaultStrategies()` 中注册

```typescript
// 示例：添加抖音分享策略
export class DouyinShareStrategy extends BaseShareStrategy {
  platform: 'douyin' = 'douyin';
  
  canShare(): boolean {
    // 检测抖音客户端
  }
  
  async share(options: ShareOptions): Promise<ShareResult> {
    // 抖音分享逻辑
  }
}
```

### 7.2 配置默认平台

```typescript
// 设置默认分享平台
share.setDefaultPlatform('wechat');

// 设置降级平台（当首选平台不可用时）
share.setFallbackPlatform('native');
```

### 7.3 自定义分享策略

```typescript
share.registerStrategy({
  platform: 'custom',
  canShare: () => true,
  share: async (options) => {
    // 自定义分享逻辑
    return { success: true, platform: 'custom' };
  }
});
```

---

## 8. 迁移注意事项

### 8.1 向后兼容性

迁移后提供相同的 API 接口，现有代码只需更新导入路径：

```typescript
// 迁移前
import { useShare } from '../../utils/share';

// 迁移后
import { useShare } from '../../services/ShareService';
```

### 8.2 第三方依赖

微信、QQ、微博分享需要安装对应 SDK：

```bash
# 微信
npm install react-native-wechat

# QQ
npm install react-native-qq

# 微博
npm install react-native-weibo
```

### 8.3 iOS/Android 配置

每个第三方分享 SDK 需要在原生项目中进行配置：

- **iOS**：配置 `Info.plist` URL Schemes
- **Android**：配置 `AndroidManifest.xml` 和签名

---

## 9. 故障排除

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 分享对话框不弹出 | SDK 未安装或配置错误 | 检查 SDK 安装和原生配置 |
| 500 错误 | 后端分享接口问题 | 检查后端日志和 API 文档 |
| 类型错误 | 导入路径错误 | 更新导入路径 |
| 平台不可用 | 客户端未安装 | 使用 fallback 机制 |

---

## 10. 版本记录

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2026-05-11 | 完成从 util 到 services 的迁移 |
| v1.1 | - | 添加微信、QQ、微博策略 |
| v1.2 | - | 添加内容优化器 |