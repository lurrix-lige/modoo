# 前后端数据结构一致性检查报告

**检查日期**: 2026-05-04
**检查范围**: 前端API类型定义 vs 后端数据库模型

---

## 📋 检查摘要

| 检查项 | 状态 | 详情 |
|--------|------|------|
| API端点类型 | ✅ 一致 | 所有端点响应类型已定义 |
| 数据模型字段 | ⚠️ 部分不一致 | 发现4处需要修复 |
| 响应格式 | ⚠️ 需要适配 | 新旧格式混合 |
| 状态管理 | ✅ 一致 | 已正确同步 |

---

## 🔍 发现的问题

### 问题 1: Story 响应结构不一致 (高优先级)

**后端返回** (`/api/v1/stories`):
```typescript
{
  success: true,
  data: {
    stories: [...],
    pagination: { page, limit, total, totalPages }
  }
}
```

**前端期望** (ApiService.ts):
```typescript
async getStories(): Promise<Story[]>  // 返回数组
```

**问题**: 后端返回分页对象，前端期望直接返回数组

**修复方案**: 更新前端类型定义

---

### 问题 2: Course 响应结构不一致 (高优先级)

**后端返回** (`/api/v1/courses`):
```typescript
{
  success: true,
  data: {
    courses: [...],
    pagination: { page, limit, total, totalPages }
  }
}
```

**前端期望** (ApiService.ts):
```typescript
async getCourses(): Promise<Course[]>
```

**问题**: 同上，后端返回分页对象，前端期望数组

**修复方案**: 更新前端类型定义

---

### 问题 3: BreathingExercise phases 字段类型不一致 (中优先级)

**后端存储**: `phasesJson` (字符串，JSON序列化)
**前端期望**: `phases: BreathingPhase[]` (直接数组)

**问题**: 后端数据库存储JSON字符串，前端期望直接是数组对象

**修复方案**: 在后端路由中添加 JSON.parse 转换

---

### 问题 4: WhiteNoise 新增字段缺失 (中优先级)

**后端新增字段**:
- `isLoopable: Boolean`
- `previewDuration: Int?`
- `sortOrder: Int`

**前端类型定义** (ApiService.ts):
```typescript
export interface WhiteNoise {
  id: string;
  nameKey: string;
  name?: string;
  category: string;
  audioUrl: string;
  icon?: string;
  color?: string;
  isPremium: boolean;
}
```

**问题**: 前端类型缺少后端新增的字段

**修复方案**: 更新前端类型定义

---

### 问题 5: Article tags 字段类型不一致 (中优先级)

**后端存储**: `tagsJson` (字符串)
**前端期望**: `tags: string[]` (数组)

**问题**: 同 phases 问题

**修复方案**: 在后端路由中添加 JSON.parse 转换

---

### 问题 6: Expert specialtyKeys 字段类型不一致 (中优先级)

**后端存储**: `specialtyKeysJson` (字符串)
**前端期望**: `specialtyKeys: string[]` (数组)

**问题**: 同上

**修复方案**: 在后端路由中添加 JSON.parse 转换

---

### 问题 7: Dialogue tags 字段类型不一致 (中优先级)

**后端存储**: `tagsJson` (字符串)
**前端期望**: `tags: string[]` (数组)

**问题**: 同上

**修复方案**: 在后端路由中添加 JSON.parse 转换

---

### 问题 8: MembershipPlan 字段不完整 (高优先级)

**后端 PricingPlan 字段**:
- `planKey: String` (后端唯一标识)
- `nameKey: String` (国际化key)
- `originalPrice: Float`
- `currentPrice: Float`
- `currency: String`
- `durationDays: Int`
- `savingPercent: Int?`
- `features: String?` (JSON)
- `notIncluded: String?` (JSON)
- `isRecommended: Boolean`

**前端 MembershipPlan 类型**:
```typescript
export interface MembershipPlan {
  id: string;
  name: string;        // ❌ 应该是 nameKey
  price: number;      // ❌ 应该是 currentPrice
  originalPrice?: number;
  saving?: string;     // ❌ 应该是 savingPercent
  recommended?: boolean;
  features: string[];
}
```

**修复方案**: 更新前端类型定义以匹配后端

---

## ✅ 已验证一致的模块

### 1. UserProfile
- ✅ id, phone, nickname, avatar, isPaid, membership, child
- ✅ child 包含 guardianSpiritId

### 2. Child
- ✅ id, userId, nickname, birthday, gender, guardianSpiritId, sleepProblems
- ✅ 后端支持 guardianSpirit 关联查询

### 3. CheckIn
- ✅ id, userId, childId, date, sleepTime, wakeTime, quality

### 4. Booking
- ✅ id, expertId, userId, date, time, status, notes

### 5. Story (基础字段)
- ✅ id, title, coverUrl, audioUrl, duration, category, description
- ✅ progress, completed, isFavorite (动态添加)

---

## 🔧 修复计划

### 立即修复 (高优先级)

1. **更新前端 StoriesResponse 和 CoursesResponse 类型**
   - 接受后端的分页响应结构
   - 更新所有使用这些类型的地方

2. **更新 MembershipPlan 类型定义**
   - 将 `name` 改为 `nameKey`
   - 将 `price` 改为 `currentPrice`
   - 添加 `durationDays`
   - 添加 `savingPercent`

### 后续修复 (中优先级)

3. **在后端路由中添加 JSON 字段转换**
   - BreathingExercise: phasesJson → phases
   - Article: tagsJson → tags
   - Expert: specialtyKeysJson → specialtyKeys
   - Dialogue: tagsJson → tags

4. **更新 WhiteNoise 类型**
   - 添加 isLoopable, previewDuration, sortOrder

---

## 📝 修复记录

### 2026-05-04

- ✅ 创建本检查报告
- ✅ 识别所有不一致问题
- ⏳ 等待实施修复

---

## 🎯 验证方法

1. **单元测试**: 测试每个API端点返回的数据结构
2. **集成测试**: 测试前后端数据流
3. **类型检查**: 使用 TypeScript 编译器检查类型错误
4. **手动测试**: 测试关键用户流程

---

## 📞 联系

如有疑问，请联系后端团队确认数据模型定义。
