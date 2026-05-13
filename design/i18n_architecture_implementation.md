# 前后端i18n统一架构实施记录

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档名称 | 前后端i18n统一架构实施方案 |
| 版本 | v1.0 |
| 创建日期 | 2026-05-04 |
| 状态 | ✅ 已完成 |

---

## 1. 项目概述

### 1.1 目标

建立统一的后端i18n资源管理系统，作为前端i18n资源包的唯一真实来源（SSOT - Single Source of Truth），实现：

- 前后端i18n资源的集中管理和版本控制
- 支持运营团队通过后台管理界面动态更新翻译内容
- 保持前端应用的离线使用能力
- 简化多语言内容的维护流程

### 1.2 背景问题

在实施本方案前，系统存在以下问题：

1. **存储分散**：i18n资源仅存在于前端JSON文件，后端数据库无统一存储
2. **维护困难**：多语言内容分散在多个数据模型的xxxKey字段中
3. **版本控制缺失**：无法追踪翻译内容的变更历史
4. **运营支持不足**：无法在不发布新版本的情况下更新翻译内容
5. **数据不一致风险**：同一key在不同地方可能存在不同值

---

## 2. 解决方案设计

### 2.1 架构设计

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   前端JSON文件   │ ←── │   i18n同步脚本   │ ←── │   后端API        │
│  (运行时代码)    │     │  sync-i18n.js   │     │  /api/i18n/*    │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ↓
                                                ┌─────────────────┐
                                                │  SQLite数据库    │
                                                │ i18nResource表   │
                                                └─────────────────┘
```

### 2.2 设计原则

1. **数据库为基准**：后端数据库是i18n资源的唯一真实来源
2. **前端本地优先**：前端保持使用本地JSON文件，确保离线可用性和性能
3. **按需同步**：发布前通过同步脚本从数据库拉取最新资源
4. **版本化管理**：支持翻译内容的版本控制和发布状态管理

### 2.3 I18nResource数据模型

```prisma
model I18nResource {
  id            String   @id @default(uuid())
  resourceKey   String   // 唯一标识，如 "dialogue.title.welcome"
  language      String   // ISO 639-1 + 区域，如 "zh-CN", "en"
  value         String   // 翻译值
  type          String   @default("TEXT") // TEXT, HTML, JSON, MARKDOWN
  status        String   @default("PUBLISHED") // DRAFT, REVIEW, PUBLISHED, DEPRECATED
  version       Int      @default(1)
  author        String?
  notes         String?
  lastPublished DateTime?

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([resourceKey, language])
  @@index([language])
  @@index([status])
  @@index([lastPublished])
  @@map("i18n_resources")
}
```

### 2.4 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键，UUID格式 |
| resourceKey | String | 资源唯一标识，格式如"模块.子模块.键名" |
| language | String | 语言代码，遵循ISO 639-1标准 |
| value | String | 翻译的实际内容 |
| type | String | 资源类型：TEXT/HTML/JSON/MARKDOWN |
| status | String | 状态：DRAFT/REVIEW/PUBLISHED/DEPRECATED |
| version | Int | 版本号，每次修改自动递增 |
| author | String? | 最后修改作者 |
| notes | String? | 备注信息 |
| lastPublished | DateTime? | 最后发布时间 |

---

## 3. 实施内容

### 3.1 数据库变更

#### 3.1.1 新增表

- **i18n_resources**: 统一存储所有i18n资源

#### 3.1.2 模型优化

**Dialogue模型优化**：
- 保留了 `titleKey`、`scenarioKey`、`responseKey` 字段用于i18n引用
- 移除了 `title`、`scenario`、`response` 等直接文本字段

**Article模型优化**：
- 保留了 `categoryKey` 字段用于i18n引用
- 移除了 `categoryKey` 字段（已在之前迁移中处理）

#### 3.1.3 索引优化

为 **CheckIn** 模型添加了复合索引：
```prisma
@@index([userId, date])
```

### 3.2 后端API实现

#### 3.2.1 API端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/i18n/export` | 导出i18n资源 |
| GET | `/api/i18n/resources` | 获取资源列表 |
| POST | `/api/i18n/resources` | 创建新资源 |
| PUT | `/api/i18n/resources/:id` | 更新资源 |
| DELETE | `/api/i18n/resources/:id` | 删除资源 |

#### 3.2.2 导出接口详解

**GET /api/i18n/export**

查询参数：
- `language` (optional): 指定语言，如 `zh-CN` 或 `en`

返回格式：

**按语言导出** (指定language参数)：
```json
{
  "zh-CN": {
    "common.ok": "确定",
    "common.cancel": "取消",
    "welcome.appTitle": "晚安宝贝"
  }
}
```

**全量导出** (不指定language)：
```json
{
  "zh-CN": {
    "common.ok": "确定",
    "common.cancel": "取消"
  },
  "en": {
    "common.ok": "OK",
    "common.cancel": "Cancel"
  }
}
```

#### 3.2.3 资源管理接口

**POST /api/i18n/resources**

请求体：
```json
{
  "resourceKey": "welcome.appTitle",
  "language": "zh-CN",
  "value": "晚安宝贝",
  "type": "TEXT",
  "status": "PUBLISHED",
  "author": "admin",
  "notes": "欢迎页面标题"
}
```

**PUT /api/i18n/resources/:id**

请求体：
```json
{
  "value": "新的翻译内容",
  "status": "PUBLISHED"
}
```

### 3.3 前端同步脚本

#### 3.3.1 sync-i18n.js

位置：`dozoo/scripts/sync-i18n.js`

功能：
- 从后端API获取最新的i18n资源
- 将扁平化的key转换为嵌套的JSON结构
- 写入到 `src/i18n/locales/` 目录

使用方式：
```bash
cd dozoo
npm run i18n:sync
```

环境变量：
- `I18N_API_URL`: API地址，默认为 `http://localhost:3000/api/i18n`

### 3.4 后端导入脚本

#### 3.4.1 seed-i18n.ts

位置：`backend/prisma/seed-i18n.ts`

功能：
- 读取前端现有的i18n JSON文件
- 将嵌套JSON展平为key-value格式
- 导入到数据库（支持增量更新）

使用方式：
```bash
cd backend
npm run db:seed:i18n
```

---

## 4. 使用流程

### 4.1 开发流程

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ 前端开发     │ →  │ 后端数据库    │ →  │ 同步到前端   │
│ 添加新key    │    │ 导入资源      │    │ 本地JSON    │
└─────────────┘    └──────────────┘    └─────────────┘
```

### 4.2 发布流程

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 后端运营      │ →  │ 发布新版本    │ →  │ 前端同步     │
│ 更新翻译      │    │ 资源到DB     │    │ npm run      │
│              │    │              │    │ i18n:sync   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 4.3 日常维护

#### 添加新翻译

1. **后端直接添加**（推荐）：
```bash
curl -X POST http://localhost:3000/api/i18n/resources \
  -H "Content-Type: application/json" \
  -d '{
    "resourceKey": "new.feature",
    "language": "zh-CN",
    "value": "新功能",
    "status": "PUBLISHED"
  }'
```

2. **前端开发添加**：
   - 在前端JSON中添加新key
   - 运行 `npm run db:seed:i18n` 同步到数据库

#### 查询翻译

```bash
# 查询所有中文资源
curl "http://localhost:3000/api/i18n/export?language=zh-CN"

# 分页查询资源列表
curl "http://localhost:3000/api/i18n/resources?page=1&limit=50&language=zh-CN"

# 搜索资源
curl "http://localhost:3000/api/i18n/resources?search=welcome"
```

#### 更新翻译

```bash
# 先获取资源ID
# 然后更新
curl -X PUT http://localhost:3000/api/i18n/resources/{id} \
  -H "Content-Type: application/json" \
  -d '{"value": "更新后的内容", "status": "PUBLISHED"}'
```

---

## 5. 目录结构

### 5.1 后端文件变更

```
backend/
├── prisma/
│   ├── migrations/
│   │   └── 20260504101612_add_i18n_resource_table/
│   │       └── migration.sql          # 新增迁移
│   ├── seed-i18n.ts                   # 新增：i18n导入脚本
│   └── schema.prisma                  # 修改：添加I18nResource表
└── src/
    ├── routes/
    │   └── i18n.ts                    # 新增：i18n API路由
    └── index.ts                       # 修改：注册i18n路由
```

### 5.2 前端文件变更

```
dozoo/
├── scripts/
│   └── sync-i18n.js                   # 新增：i18n同步脚本
└── package.json                        # 修改：添加i18n:sync脚本
```

---

## 6. package.json脚本

### 6.1 后端脚本

```json
{
  "scripts": {
    "db:seed:i18n": "tsx prisma/seed-i18n.ts"
  }
}
```

### 6.2 前端脚本

```json
{
  "scripts": {
    "i18n:sync": "node scripts/sync-i18n.js"
  }
}
```

---

## 7. 数据库迁移记录

### 7.1 迁移文件

**20260504101612_add_i18n_resource_table**

```sql
-- 创建i18n_resources表
CREATE TABLE "i18n_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceKey" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "author" TEXT,
    "notes" TEXT,
    "lastPublished" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- 创建唯一约束
CREATE UNIQUE INDEX "i18n_resources_resourceKey_language_key" ON "i18n_resources"("resourceKey", "language");

-- 创建普通索引
CREATE INDEX "i18n_resources_language_idx" ON "i18n_resources"("language");
CREATE INDEX "i18n_resources_status_idx" ON "i18n_resources"("status");
CREATE INDEX "i18n_resources_lastPublished_idx" ON "i18n_resources"("lastPublished");
```

### 7.2 初始数据

已通过 `seed-i18n.ts` 导入：
- **zh-CN**: 813条资源
- **en**: 812条资源
- **总计**: 1625条资源

---

## 8. 已知限制

1. **SQLite枚举限制**：由于SQLite不支持枚举类型，`type` 和 `status` 字段使用String类型，需在应用层保证数据有效性
2. **批量操作**：当前API不支持批量导入/导出，需通过seed脚本实现批量操作
3. **权限控制**：当前API未实现权限控制，生产环境需添加认证和授权机制
4. **缓存机制**：前端未实现i18n资源的运行时更新机制，需重启应用生效

---

## 9. 未来优化方向

1. **后台管理界面**：开发Web后台用于可视化管理和审核翻译内容
2. **翻译审核流程**：支持DRAFT → REVIEW → PUBLISHED的工作流
3. **版本历史**：记录每次修改的历史版本，支持回滚
4. **翻译记忆**：支持TM（Translation Memory）功能，复用相似翻译
5. **机器翻译集成**：对接第三方翻译API，辅助人工翻译
6. **实时同步**：支持WebSocket或轮询机制，实现翻译内容的热更新

---

## 10. 相关文档

- [前端架构文档](../dozoo/src/)
- [后端架构文档](../backend/)
- [i18n使用指南](./i18n-usage-guide.md) (待创建)
- [数据库设计文档](./database-design.md) (待创建)

---

## 11. 维护记录

| 日期 | 版本 | 修改内容 | 作者 |
|------|------|----------|------|
| 2026-05-04 | v1.0 | 初始实现，完成I18nResource表、API、同步脚本 | AI Assistant |

---

## 附录A：API完整示例

### A.1 导出所有中文翻译

```bash
curl "http://localhost:3000/api/i18n/export?language=zh-CN"
```

响应：
```json
{
  "zh-CN": {
    "locale": "zh-CN",
    "common": {
      "ok": "确定",
      "cancel": "取消",
      ...
    },
    ...
  }
}
```

### A.2 创建新资源

```bash
curl -X POST "http://localhost:3000/api/i18n/resources" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceKey": "test.newKey",
    "language": "zh-CN",
    "value": "测试内容",
    "type": "TEXT",
    "status": "DRAFT",
    "author": "tester",
    "notes": "测试用key"
  }'
```

响应：
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "resourceKey": "test.newKey",
  "language": "zh-CN",
  "value": "测试内容",
  "type": "TEXT",
  "status": "DRAFT",
  "version": 1,
  "author": "tester",
  "notes": "测试用key",
  "lastPublished": null,
  "createdAt": "2026-05-04T10:00:00.000Z",
  "updatedAt": "2026-05-04T10:00:00.000Z"
}
```

### A.3 批量查询

```bash
curl "http://localhost:3000/api/i18n/resources?language=zh-CN&status=PUBLISHED&page=1&limit=10"
```

响应：
```json
{
  "resources": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 813,
    "totalPages": 82
  }
}
```

---

*文档结束*



### Phase 1 - 数据库设计
1. 创建了 I18nResource 表 ：在 Prisma schema 中添加了专门的国际化资源表，包含资源key、语言、值、类型、状态、版本等字段
2. 应用了数据库迁移 ：成功创建并应用了迁移，确保SQLite兼容性（将enum改为string类型）
### Phase 2 - 后端实现
1. 清理了重复字段 ：在Dialogue和Article模型中，保留了xxxKey字段用于i18n引用，清理了原来的直接文本字段
2. 实现了i18n API接口 ：
   - GET /api/i18n/export - 导出i18n资源（支持全量或按语言导出）
   - GET /api/i18n/resources - 获取资源列表（支持过滤、分页）
   - POST /api/i18n/resources - 创建新资源
   - PUT /api/i18n/resources/:id - 更新资源
   - DELETE /api/i18n/resources/:id - 删除资源
3. 添加了复合索引 ：为CheckIn表添加了userId和date的复合索引，优化查询性能
4. 创建了i18n seed脚本 ： backend/prisma/seed-i18n.ts 用于将前端现有i18n资源导入数据库
5. 运行了seed ：成功导入了1625条i18n资源到数据库
### Phase 3 - 前端实现
1. 创建了同步脚本 ： dozoo/scripts/sync-i18n.js 用于从后端API同步i18n资源到本地JSON文件
2. 更新了package.json ：
   - 后端添加了 db:seed:i18n 脚本
   - 前端添加了 i18n:sync 脚本
## 工作流程说明
- 以数据库为基准 ：现在后端数据库是i18n资源的唯一真实来源
- 前端同步机制 ：在构建或发布前，运行 npm run i18n:sync 从后端同步最新的i18n资源到本地JSON文件
- 前端仍使用本地文件 ：为了保持应用性能，前端继续使用本地JSON文件，不直接从API加载i18n
## 如何使用
1. 在后端，如添加或修改i18n资源，可以通过API操作
2. 在发布前端应用前，运行 cd dozoo && npm run i18n:sync 同步最新i18n资源
3. 如需重新导入前端现有的i18n到后端，运行 cd backend && npm run db:seed:i18n
所有任务已完成