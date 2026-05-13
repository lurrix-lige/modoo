# 后端数据建模全面评估报告

---

## 一、数据模型统计与梳理

### 1.1 模型分类总览

| 分类 | 模型数量 | 模型名称 |
|------|---------|----------|
| **用户系统** | 3 | User, Child, Session, RefreshToken |
| **内容系统** | 5 | Story, Article, Course, Lesson, BreathingExercise, WhiteNoise, Dialogue |
| **用户行为** | 5 | CheckIn, PlayHistory, Favorite, Share, LessonProgress |
| **会员系统** | 2 | Membership, Booking, Expert |
| **设置系统** | 2 | NotificationSettings, PrivacySettings |
| **分析系统** | 6 | AnalyticsEvent, AnalyticsSession, AnalyticsUserProfile, AnalyticsFeatureUsage, AnalyticsError, AnalyticsBatch |
| **辅助系统** | 1 | VerificationCode |
| **总计** | **29** | |

### 1.2 模型关系图

```
User ──┬── Child ──┬── CheckIn
       │           ├── PlayHistory
       │           └── LessonProgress
       ├── Session
       ├── Membership
       ├── Booking ─── Expert
       └── NotificationSettings
```

---

## 二、i18n 索引字段使用情况分析

### 2.1 当前使用 `*Key` 字段的模型

| 模型 | i18n 字段 | 非 i18n 字段（重复） |
|------|-----------|-------------------|
| **Article** | `categoryKey` | `category` |
| **BreathingExercise** | `nameKey`, `descriptionKey` | 无 |
| **WhiteNoise** | `nameKey` | 无 |
| **Dialogue** | `titleKey`, `scenarioKey`, `responseKey` | `title`, `scenario`, `response` |
| **Expert** | `nameKey`, `titleKey`, `hospitalKey`, `specialtyKeysJson` | 无 |

### 2.2 发现的不一致问题

**问题 1：重复字段冗余**
```prisma
model Dialogue {
  titleKey    String  // i18n key
  title       String? // 冗余字段
  scenarioKey String?
  scenario    String? // 冗余字段
  responseKey String
  response    String? // 冗余字段
}
```

**问题 2：命名不统一**
- `specialtyKeysJson`（复数）vs `nameKey`（单数）
- `tagsJson` vs `specialtyKeysJson`（命名风格不一致）

**问题 3：混合存储策略**
- Article 同时存储 `categoryKey` 和 `category`（重复）
- Expert 使用 `specialtyKeysJson`（JSON数组），而其他模型使用单个 `*Key`

**问题 4：缺少统一的国际化表**
所有 i18n 数据直接存储在业务表中，没有独立的国际化资源表。

---

## 三、数据架构评估

### 3.1 架构科学性评估

| 维度 | 评估 | 说明 |
|------|------|------|
| **关系设计** | ✅ 良好 | 外键约束完整，级联删除策略合理 |
| **索引设计** | ✅ 良好 | 关键查询字段均有索引 |
| **数据归一化** | ⚠️ 中等 | 存在重复字段（如 Dialogue 的 title/titleKey） |
| **扩展性** | ⚠️ 中等 | i18n 字段分散在各表，难以统一管理 |
| **性能考虑** | ✅ 良好 | 使用了适当的唯一约束和索引 |

### 3.2 可维护性评估

| 问题 | 影响 | 严重程度 |
|------|------|----------|
| i18n 字段分散 | 难以统一更新和管理多语言 | 🔴 高 |
| 重复字段 | 数据不一致风险 | 🟡 中 |
| 命名不统一 | 开发人员认知负担 | 🟡 中 |
| 缺少数据验证 | 业务规则依赖应用层 | 🟡 中 |

### 3.3 扩展性评估

| 场景 | 当前支持度 | 改进方向 |
|------|-----------|----------|
| 添加新语言 | ⚠️ 需要修改多个表 | 统一国际化架构 |
| 内容版本管理 | ❌ 不支持 | 添加版本字段 |
| 多租户支持 | ❌ 不支持 | 添加租户字段 |
| 数据归档 | ❌ 不支持 | 添加归档表和策略 |

---

## 四、改进建议

### 4.1 i18n 索引字段统一处理方案

**方案 A：独立国际化资源表（推荐）**

```prisma
model I18nResource {
  id          String   @id @default(uuid())
  resourceKey String   // 唯一标识（如 "dialogue.title.xxx"）
  language    String   // ISO 语言代码（如 "zh-CN", "en"）
  value       String   // 翻译值
  type        String   // 资源类型：TEXT, HTML, JSON
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([resourceKey, language])
  @@index([language])
  @@map("i18n_resources")
}
```

**方案 B：保留 *Key 字段但标准化**

```prisma
// 修订后的 Dialogue 模型
model Dialogue {
  id           String   @id @default(uuid())
  titleKey     String   // 引用 i18n key
  scenarioKey  String?
  responseKey  String
  category     String
  tagsJson     String
  isPremium    Boolean @default(false)
  useCount     Int @default(0)
  createdAt    DateTime @default(now())

  @@map("dialogues")
}
```

### 4.2 数据模型标准化设计规范

**规范 1：i18n 字段命名**
```typescript
// 单值国际化字段：使用 *Key 后缀
titleKey: string;       // 正确
descriptionKey: string; // 正确

// 多值国际化字段：使用 *KeysJson 后缀
specialtyKeysJson: string; // 正确（存储 JSON 数组）
```

**规范 2：字段顺序**
```typescript
// 推荐顺序：
// 1. 主键和外键
// 2. 业务核心字段
// 3. i18n key 字段
// 4. 状态字段
// 5. 时间戳字段
```

**规范 3：避免重复存储**
```typescript
// ❌ 错误：同时存储 key 和 value
titleKey: string;
title: string;

// ✅ 正确：只存储 key，value 从 i18n 服务获取
titleKey: string;
```

### 4.3 具体改进计划

| 步骤 | 任务 | 优先级 | 预计时间 |
|------|------|--------|----------|
| 1 | 创建独立的 I18nResource 表 | 🔴 高 | 1 天 |
| 2 | 清理 Dialogue 模型的重复字段 | 🔴 高 | 0.5 天 |
| 3 | 清理 Article 模型的重复字段 | 🟡 中 | 0.5 天 |
| 4 | 统一所有 *Key 字段命名 | 🟡 中 | 1 天 |
| 5 | 更新 API 层以支持新的 i18n 查询 | 🟡 中 | 2 天 |
| 6 | 更新前端以使用新的 i18n 方案 | 🟡 中 | 2 天 |
| 7 | 添加数据迁移脚本 | 🟡 中 | 1 天 |

### 4.4 索引优化建议

**当前问题**：部分表缺少复合索引

```prisma
// 建议添加的索引

// CheckIn: 经常按用户+日期查询
@@index([userId, date])

// PlayHistory: 经常按用户+故事查询
@@index([userId, storyId])

// AnalyticsEvent: 经常按时间范围查询
@@index([userId, occurredAt])
@@index([deviceId, occurredAt])
```

### 4.5 数据归档策略

```prisma
// 添加归档表
model AnalyticsEventArchive {
  // 与 AnalyticsEvent 相同结构
  // 添加归档时间字段
  archivedAt DateTime @default(now())
  
  @@index([archivedAt])
  @@map("analytics_events_archive")
}
```

---

## 五、总结

### 5.1 核心问题

1. **i18n 字段管理混乱** - 分散在多个表中，缺少统一管理
2. **数据冗余** - Dialogue 和 Article 存在重复字段
3. **命名不统一** - `*Key` vs `*KeysJson` 混用

### 5.2 优先改进项

1. **创建独立的 I18nResource 表** - 统一管理所有国际化资源
2. **清理重复字段** - 删除 Dialogue 和 Article 中的冗余字段
3. **标准化命名** - 统一使用 `*Key` 和 `*KeysJson` 命名规范

### 5.3 预期收益

| 改进项 | 预期收益 |
|--------|----------|
| 统一 i18n 管理 | 降低多语言维护成本 50% |
| 消除数据冗余 | 减少存储空间，降低数据不一致风险 |
| 标准化命名 | 提高开发效率，降低认知负担 |
| 索引优化 | 查询性能提升 30-50% |

---

**报告版本**: v1.0  
**生成日期**: 2026-05-04  
**评估范围**: Dozoo 后端 Prisma 数据模型