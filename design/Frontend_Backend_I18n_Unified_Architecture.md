# 前后端国际化（i18n）统一架构方案

---

## 一、设计原则

### 1.1 核心原则

> **后端 I18nResource 表为单一数据源（Source of Truth），前端 i18n 资源包为本地缓存**

| 层级 | 用途 | 访问频率 | 更新频率 |
|------|------|---------|---------|
| **后端 I18nResource 表** | 存储所有翻译资源，可动态编辑 | 低频（构建时） | 可动态更新 |
| **前端 i18n 资源包** | 静态资源包，随 app 发布 | 高频（运行时） | 随 app 更新 |
| **本地缓存** | 前端本地存储，减少网络请求 | 高频（运行时） | 按需更新 |

---

## 二、架构设计

### 2.1 完整架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                     内容管理后台（CMS）                               │
│                    ┌───────────────────────────┐                    │
│                    │  翻译资源编辑器            │                    │
│                    └───────────┬───────────────┘                    │
└────────────────────────────────┼────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                    后端 I18nResource 表                               │
│              ┌──────────────────────────────────┐                   │
│              │  id: String                      │                   │
│              │  resourceKey: String (主键)      │                   │
│              │  language: String (主键)         │                   │
│              │  value: String                   │                   │
│              │  type: String                    │                   │
│              └───────────────┬──────────────────┘                   │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
┌─────────▼──────────┐ ┌────────▼─────────┐ ┌────────────▼──────────┐
│   资源导出接口    │ │   增量更新接口  │ │ 构建时同步工具     │
│   /api/i18n/export│ │  /api/i18n/delta │ │  sync-i18n.js       │
└─────────┬──────────┘ └────────┬─────────┘ └────────────┬──────────┘
          │                     │                         │
          ▼                     ▼                         ▼
┌───────────────────┐ ┌───────────────────┐  ┌──────────────────────┐
│  前端 i18n 资源包 │ │  本地存储缓存    │  │  持续集成(CI)      │
│  /src/i18n/       │ │  AsyncStorage    │  │  打包前同步          │
│  locales/en.json  │ │                  │  │  最新翻译           │
│  locales/zh-CN.json│ │                  │  │                    │
└─────────┬─────────┘ └────────┬─────────┘  └────────────┬─────────┘
          │                    │                         │
          └────────────────────┼─────────────────────────┘
                               ▼
                      ┌─────────────────┐
                      │  前端 App       │
                      │  运行时查询     │
                      └─────────────────┘
```

---

## 三、工作流程

### 3.1 常规发布流程（推荐）

```
1. CMS 编辑翻译
   ↓
2. 保存到 I18nResource 表
   ↓
3. 触发 CI/CD 同步脚本
   ↓
4. sync-i18n.js 导出资源 → 前端 src/i18n/locales/
   ↓
5. 打包构建 App
   ↓
6. 用户安装/更新 App → 随包获取完整翻译
```

**适用场景**：常规版本发布，翻译资源随 app 一起发布

---

### 3.2 热更新流程（可选）

```
1. CMS 编辑翻译并设置为 "publish"
   ↓
2. 标记为需要热更新
   ↓
3. 用户启动 App → 检查 /api/i18n/delta?lastUpdated=xxx
   ↓
4. 如果有更新 → 下载增量翻译
   ↓
5. 保存到 AsyncStorage
   ↓
6. 使用本地缓存覆盖默认资源
```

**适用场景**：快速修复翻译错误、紧急添加新语言

---

### 3.3 开发流程

```
1. 开发者新增翻译需求
   ↓
2. 在前端 i18n 资源包中添加临时翻译
   ↓
3. 开发/测试
   ↓
4. 同步到后端 CMS 进行正式翻译
   ↓
5. 更新 I18nResource 表
   ↓
6. 下次构建时同步到前端资源包
```

---

## 四、数据结构设计

### 4.1 后端 I18nResource 表（完整结构）

```prisma
model I18nResource {
  id            String   @id @default(uuid())
  resourceKey   String   // 唯一标识，如 "dialogue.title.welcome"
  language      String   // ISO 639-1 + 区域，如 "zh-CN", "en", "ja"
  value         String   // 翻译值
  type          I18nType @default(TEXT)
  status        I18nStatus @default(DRAFT) // DRAFT, REVIEW, PUBLISHED, DEPRECATED
  version       Int      @default(1)
  author        String?
  notes         String?
  lastPublished DateTime?
  
  // 元数据
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  // 约束
  @@unique([resourceKey, language])
  @@index([language])
  @@index([status])
  @@index([lastPublished])
  @@map("i18n_resources")
}

enum I18nType {
  TEXT      // 纯文本
  HTML      // HTML 格式
  JSON      // JSON 数据
  MARKDOWN  // Markdown 格式
}

enum I18nStatus {
  DRAFT     // 草稿
  REVIEW    // 审核中
  PUBLISHED // 已发布（生产环境可用）
  DEPRECATED // 已废弃
}
```

### 4.2 前端 i18n 资源包（简化结构）

```json
// src/i18n/locales/en.json
{
  "welcome": {
    "title": "Welcome to Dozoo",
    "subtitle": "Sleep better tonight"
  },
  "auth": {
    "login": "Sign In",
    "register": "Create Account"
  }
}
```

**注意**：
- 前端只包含 `PUBLISHED` 状态的翻译
- 格式简化为嵌套对象（扁平化处理 `resourceKey`）

---

## 五、同步脚本设计

### 5.1 sync-i18n.js（构建工具）

```javascript
#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../../src/i18n/locales');

const languages = ['zh-CN', 'en']; // 目标语言

async function syncI18n() {
  console.log('🔄 开始同步 i18n 资源...');
  
  const translations = await fetchTranslations();
  
  mkdirSync(OUTPUT_DIR, { recursive: true });
  
  for (const lang of languages) {
    const langData = flattenToNested(translations, lang);
    writeFileSync(
      join(OUTPUT_DIR, `${lang}.json`),
      JSON.stringify(langData, null, 2)
    );
    console.log(`✅ 已生成 ${lang}.json`);
  }
  
  console.log('✅ i18n 资源同步完成！');
}

async function fetchTranslations() {
  const response = await fetch('http://localhost:3000/api/i18n/export');
  const { data } = await response.json();
  return data;
}

function flattenToNested(data, lang) {
  const result = {};
  
  for (const item of data.filter(d => d.language === lang)) {
    const keys = item.resourceKey.split('.');
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = item.value;
  }
  
  return result;
}

syncI18n().catch(console.error);
```

### 5.2 package.json 脚本配置

```json
{
  "scripts": {
    "sync-i18n": "node ./tools/sync-i18n.js",
    "prebuild": "npm run sync-i18n"
  }
}
```

---

## 六、后端 API 设计

### 6.1 资源导出接口

```typescript
GET /api/i18n/export

Query:
- status: "PUBLISHED" | "DRAFT" | "REVIEW" (默认: "PUBLISHED")
- language?: string (可选，指定语言)
- updatedSince?: string (可选，只返回更新的资源)

Response:
{
  data: [
    {
      id: string,
      resourceKey: string,
      language: string,
      value: string,
      type: I18nType,
      lastPublished: string
    }
  ],
  version: string,
  generatedAt: string
}
```

### 6.2 增量更新接口

```typescript
GET /api/i18n/delta

Query:
- lastUpdated: string (ISO 时间)
- language: string

Response:
{
  hasUpdates: boolean,
  version: string,
  data: [
    {
      resourceKey: string,
      value: string,
      action: "UPDATE" | "DELETE" | "CREATE"
    }
  ]
}
```

---

## 七、前端运行时实现

### 7.1 i18n 初始化逻辑

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

const defaultResources = {
  'zh-CN': { translation: zhCN },
  en: { translation: en },
};

const I18N_CACHE_KEY = '@dozoo:i18n_cache';
const I18N_VERSION_KEY = '@dozoo:i18n_version';

async function initI18n() {
  let resources = { ...defaultResources };
  
  // 尝试加载本地缓存
  try {
    const cachedVersion = await AsyncStorage.getItem(I18N_VERSION_KEY);
    if (cachedVersion) {
      const cachedData = await AsyncStorage.getItem(I18N_CACHE_KEY);
      if (cachedData) {
        const cache = JSON.parse(cachedData);
        resources = mergeResources(resources, cache);
      }
    }
  } catch (error) {
    console.warn('加载 i18n 缓存失败', error);
  }
  
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'zh-CN',
      fallbackLng: 'zh-CN',
      interpolation: {
        escapeValue: false,
      },
    });
    
  // 后台检查更新
  checkAndUpdateTranslations();
}

async function checkAndUpdateTranslations() {
  try {
    const lastUpdated = await AsyncStorage.getItem(I18N_VERSION_KEY);
    const response = await fetch(`/api/i18n/delta?lastUpdated=${lastUpdated || ''}`);
    const { hasUpdates, data } = await response.json();
    
    if (hasUpdates && data.length > 0) {
      const currentCache = await getCurrentCache();
      const newCache = applyDelta(currentCache, data);
      await saveCache(newCache);
      
      // 动态更新 i18n
      for (const lang in newCache) {
        i18n.addResources(lang, 'translation', newCache[lang]);
      }
    }
  } catch (error) {
    console.warn('检查 i18n 更新失败', error);
  }
}

export { initI18n, i18n };
```

---

## 八、关系总结

| 对比项 | 后端 I18nResource 表 | 前端 i18n 资源包 |
|--------|---------------------|-----------------|
| **定位** | 单一数据源（Source of Truth） | 静态副本，随包发布 |
| **谁是基准** | ✅ 是基准 | 副本 |
| **编辑方式** | 通过 CMS 管理 | 只读 |
| **更新频率** | 按需 | 随 App 版本 |
| **使用场景** | 内容管理、导出同步 | 前端运行时渲染 |
| **支持特性** | 版本管理、审核流程、热更新 | 快速加载、离线可用 |

---

## 九、推荐实施策略

### 9.1 阶段一：基础架构（MVP）

- [x] 创建 I18nResource 表
- [x] 添加同步脚本 sync-i18n.js
- [x] 构建前同步资源
- [x] 清理现有 i18n 字段（使用 *Key）

### 9.2 阶段二：热更新支持（可选）

- [ ] 实现增量更新接口 /api/i18n/delta
- [ ] 实现前端本地缓存逻辑
- [ ] 添加更新检测和应用逻辑

### 9.3 阶段三：完整 CMS（高级）

- [ ] 构建 i18n 管理后台界面
- [ ] 支持在线翻译编辑
- [ ] 添加版本对比和回滚功能

---

## 十、关键决策说明

### 10.1 为什么以 I18nResource 表为基准？

| 理由 | 说明 |
|------|------|
| 统一管理 | 翻译资源从多个表集中到一个表 |
| 版本控制 | 支持翻译历史和回滚 |
| 动态更新 | 支持热更新，无需发布新版本 |
| 权限控制 | 翻译和开发权限分离 |
| 分析统计 | 跟踪翻译覆盖率、翻译进度 |

### 10.2 为什么还需要前端 i18n 资源包？

| 理由 | 说明 |
|------|------|
| 离线可用 | 无网络时也能显示 |
| 性能优化 | 直接读取本地文件，无需网络请求 |
| 发布稳定 | App 发布时已包含完整翻译 |
| 开发便捷 | 开发者可以直接编辑资源包进行开发 |

---

**文档版本**: v1.0  
**生成日期**: 2026-05-04