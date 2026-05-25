# Dozoo API 接口设计规范

## 1. 概述

本文档定义了 Dozoo 系统的 API 接口设计标准，旨在确保前后端接口交互的一致性、安全性、可维护性和可扩展性。

***

## 2. 接口设计原则

### 2.1 RESTful 设计原则

- **资源命名**: 使用名词而非动词，如 `/api/v1/users` 而非 `/api/v1/getUsers`
- **HTTP 方法语义**:
  - `GET`: 获取资源（幂等）
  - `POST`: 创建资源
  - `PUT`: 完整更新资源（幂等）
  - `PATCH`: 部分更新资源
  - `DELETE`: 删除资源（幂等）

### 2.2 命名规范

- **URL**: 使用小写字母，单词之间用连字符 `-` 分隔
- **查询参数**: 使用驼峰命名法 `camelCase`
- **请求体字段**: 使用驼峰命名法 `camelCase`
- **响应体字段**: 使用驼峰命名法 `camelCase`

***

## 3. 数据格式标准

### 3.1 统一响应格式

所有 API 响应必须遵循以下结构：

```typescript
interface ApiResponse<T = any> {
  success: boolean;        // 标识请求是否成功
  data?: T;               // 成功时返回的数据
  error?: ApiError;       // 失败时返回的错误信息
  meta?: ResponseMeta;    // 可选的元数据（分页等）
  timestamp: string;      // 响应时间戳 (ISO 8601)
}

interface ApiError {
  code: string;           // 错误码
  message: string;        // 错误消息
  details?: ValidationError[]; // 验证错误详情
  requestId?: string;     // 请求追踪 ID
}

interface ValidationError {
  field: string;          // 字段名
  message: string;        // 错误消息
  value?: any;            // 原始值
}

interface ResponseMeta {
  page?: number;          // 当前页码
  pageSize?: number;      // 每页数量
  total?: number;         // 总记录数
  totalPages?: number;    // 总页数
  nextCursor?: string;    // 游标分页下一页标识
  hasMore?: boolean;      // 是否还有更多
  count?: number;         // 当前返回数量
}
```

### 3.2 成功响应示例

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "张三",
    "email": "zhangsan@example.com"
  },
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3.3 失败响应示例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_INVALID_FORMAT",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确",
        "value": "invalid-email"
      }
    ],
    "requestId": "abc123-def456"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

***

## 4. 通信协议要求

### 4.1 协议版本

- **协议**: HTTPS（强制）
- **字符编码**: UTF-8
- **内容类型**: `application/json`

### 4.2 请求头规范

| 头名称               | 必填 | 说明                                |
| ----------------- | -- | --------------------------------- |
| `Content-Type`    | 是  | 固定为 `application/json`            |
| `Authorization`   | 否  | Bearer Token，格式: `Bearer <token>` |
| `X-API-Version`   | 否  | API 版本，如 `v1`                     |
| `X-Request-Id`    | 否  | 请求追踪 ID，由客户端生成或服务端生成              |
| `Accept-Language` | 否  | 语言偏好，如 `zh-CN`, `en`              |

### 4.3 响应头规范

| 头名称                     | 说明                                    |
| ----------------------- | ------------------------------------- |
| `X-API-Version`         | 当前使用的 API 版本                          |
| `X-Request-Id`          | 请求追踪 ID                               |
| `X-RateLimit-Limit`     | 限流上限                                  |
| `X-RateLimit-Remaining` | 剩余请求次数                                |
| `X-RateLimit-Reset`     | 限流重置时间（Unix 时间戳）                      |
| `Content-Type`          | 固定为 `application/json; charset=utf-8` |

### 4.4 HTTP 状态码

| 状态码 | 含义    | 使用场景                         |
| --- | ----- | ---------------------------- |
| 200 | 成功    | GET/POST/PUT/PATCH/DELETE 成功 |
| 201 | 创建成功  | POST 创建资源成功                  |
| 204 | 无内容   | DELETE 成功或返回空内容              |
| 400 | 请求错误  | 参数验证失败、请求格式错误                |
| 401 | 未授权   | Token 缺失或无效                  |
| 403 | 禁止访问  | 权限不足                         |
| 404 | 资源不存在 | 请求的资源不存在                     |
| 409 | 冲突    | 资源冲突（如重复创建）                  |
| 429 | 请求过多  | 超过限流限制                       |
| 500 | 服务器错误 | 服务器内部错误                      |

***

## 5. 版本控制策略

### 5.1 版本标识方式

支持两种版本标识方式：

1. **URL 路径方式**（推荐）: `/api/v1/users`
2. **请求头方式**: `X-API-Version: v1`

### 5.2 版本管理规则

- **主版本**: 不兼容的 API 变更，如 `v1` → `v2`
- **次版本**: 向后兼容的功能新增，如 `v1.1`
- **修订版本**: 向后兼容的问题修复，如 `v1.1.1`

### 5.3 版本支持策略

| 版本状态       | 说明        | 支持期限 |
| ---------- | --------- | ---- |
| Current    | 当前推荐版本    | 持续更新 |
| Supported  | 旧版本，仍提供支持 | 6 个月 |
| Deprecated | 已废弃，不建议使用 | 3 个月 |
| Retired    | 已移除，不再可用  | -    |

***

## 6. 安全性规范

### 6.1 身份认证

- **认证方式**: JWT Token
- **Token 格式**: `Bearer <access_token>`
- **Token 过期**: 支持 Refresh Token 机制
- **Token 存储**: 客户端应使用安全存储（如 Secure HTTP Only Cookie）

### 6.2 权限控制

- **RBAC 模型**: 基于角色的访问控制
- **权限粒度**: 支持到 API 端点级别
- **权限检查**: 每个请求都应验证用户权限

### 6.3 匿名用户支持

儿童端应用支持匿名用户交互，用于数据采集和分析：

- **匿名ID生成**: 客户端自动生成，格式为 `anonymous_` + 32位随机字符串
- **匿名ID存储**: 存储在客户端本地，用于跨会话识别同一匿名用户
- **匿名ID传递**: 通过请求头 `X-Anonymous-Id` 传递给后端
- **支持功能**: 故事浏览/收藏/分享/播放进度、课程学习进度、文章收藏、对话收藏、打卡
- **不支持功能**: 会员专属内容（音频流等需要会员身份）

### 6.4 数据加密

- **传输加密**: 强制使用 HTTPS
- **敏感数据**: 敏感字段（如密码）不应返回
- **日志脱敏**: 日志中不应记录敏感信息

### 6.5 请求限流

- **默认限制**: 15 分钟内最多 100 次请求
- **严格限制**: 敏感接口 1 分钟内最多 10 次请求
- **限流响应**: 返回 429 状态码及限流信息

### 6.6 请求验证

- **参数校验**: 所有输入参数必须进行验证
- **输入过滤**: 防止 SQL 注入、XSS 攻击
- **文件上传**: 限制文件类型和大小

***

## 7. 性能规范

### 7.1 响应时间目标

| 接口类型 | P95 目标   | P99 目标    |
| ---- | -------- | --------- |
| 简单查询 | < 100ms  | < 200ms   |
| 复杂查询 | < 500ms  | < 1000ms  |
| 文件上传 | < 5000ms | < 10000ms |

### 7.2 分页要求

- **默认分页**: 每页 20 条记录
- **最大分页**: 每页最多 100 条记录
- **分页方式**: 支持偏移分页和游标分页

### 7.3 缓存策略

- **静态资源**: 设置合理的 Cache-Control
- **API 响应**: 使用 ETag 或 Last-Modified
- **数据缓存**: 高频查询数据可缓存

***

## 8. 错误码规范

### 8.1 错误码分类

| 前缀           | 分类   | 说明            |
| ------------ | ---- | ------------- |
| AUTH\_       | 认证错误 | Token 相关、权限相关 |
| VALIDATION\_ | 验证错误 | 参数校验失败        |
| RESOURCE\_   | 资源错误 | 资源不存在、冲突等     |
| BIZ\_        | 业务错误 | 业务逻辑错误        |
| SYS\_        | 系统错误 | 服务器内部错误       |

### 8.2 通用错误码

```typescript
const ErrorCodes = {
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_PERMISSION_DENIED: 'AUTH_PERMISSION_DENIED',
  
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
  
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  BIZ_BAD_REQUEST: 'BAD_REQUEST',
  
  SYS_INTERNAL_ERROR: 'SYS_INTERNAL_ERROR',
  SYS_SERVICE_UNAVAILABLE: 'SYS_SERVICE_UNAVAILABLE',
  SYS_RATE_LIMITED: 'SYS_RATE_LIMITED',
};
```

### 8.3 业务错误码

| 错误码           | 说明                    | HTTP状态码 |
| ------------- | --------------------- | ------- |
| `BAD_REQUEST` | 请求缺少用户信息或匿名ID         | 400     |
| `NOT_FOUND`   | 资源不存在（故事/课程/文章/话术/收藏） | 404     |

***

## 9. 接口文档规范

### 9.1 文档结构

每个 API 接口文档应包含：

1. **接口路径**
2. **HTTP 方法**
3. **所属版本**
4. **认证要求**
5. **请求参数**
6. **请求体结构**
7. **成功响应结构**
8. **失败响应结构**
9. **示例请求/响应**

### 9.2 文档工具

使用 OpenAPI 3.0 规范，配合 Swagger UI 或 Redoc 展示。

***

## 10. 变更管理

### 10.1 变更流程

1. **需求分析** → 2. **设计评审** → 3. **开发实现** → 4. **测试验证** → 5. **文档更新** → 6. **发布部署**

### 10.2 向后兼容原则

- **新增字段**: 允许在响应中新增字段
- **废弃字段**: 使用 `@deprecated` 标记，保留至少 3 个版本
- **删除字段**: 必须在主版本升级时进行

***

## 附录：接口示例

### 获取用户列表

**请求:**

```
GET /api/v1/users?page=1&pageSize=20
Authorization: Bearer <token>
```

**成功响应:**

```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "name": "张三",
      "email": "zhangsan@example.com",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**失败响应:**

```json
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_EXPIRED",
    "message": "登录已过期，请重新登录",
    "requestId": "abc123"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

***

## 附录B：儿童端API端点规范

### B.1 故事模块 `/api/v1/stories`

#### 获取故事列表

- **路径**: `GET /api/v1/stories`
- **认证**: 可选（支持匿名用户）
- **匿名ID**: 通过 `X-Anonymous-Id` 头传递

**查询参数**:

| 参数名        | 类型     | 必填 | 默认值 | 说明         |
| ---------- | ------ | -- | --- | ---------- |
| `category` | string | 否  | -   | 故事分类筛选     |
| `page`     | number | 否  | 1   | 页码         |
| `limit`    | number | 否  | 20  | 每页数量，最大100 |

**成功响应**:

```json
{
  "success": true,
  "data": {
    "stories": [
      {
        "id": "story-uuid",
        "title": "故事标题",
        "category": "睡眠",
        "coverUrl": "https://example.com/cover.jpg",
        "audioUrl": "https://example.com/audio.mp3",
        "duration": 600,
        "progress": 0.5,
        "completed": false,
        "isFavorite": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 获取故事详情

- **路径**: `GET /api/v1/stories/:id`
- **认证**: 可选（支持匿名用户）

**路径参数**:

| 参数名  | 类型     | 必填 | 说明   |
| ---- | ------ | -- | ---- |
| `id` | string | 是  | 故事ID |

**成功响应**:

```json
{
  "success": true,
  "data": {
    "id": "story-uuid",
    "title": "故事标题",
    "category": "睡眠",
    "coverUrl": "https://example.com/cover.jpg",
    "audioUrl": "https://example.com/audio.mp3",
    "duration": 600,
    "description": "故事描述",
    "progress": 0.5,
    "completed": false,
    "isFavorite": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 更新播放进度

- **路径**: `POST /api/v1/stories/:id/progress`
- **认证**: 可选（支持匿名用户）

**请求体**:

| 参数名         | 类型      | 必填 | 说明        |
| ----------- | ------- | -- | --------- |
| `progress`  | number  | 是  | 播放进度（0-1） |
| `completed` | boolean | 是  | 是否完成播放    |

**成功响应**:

```json
{
  "success": true,
  "data": {
    "id": "progress-uuid",
    "storyId": "story-uuid",
    "progress": 0.75,
    "completed": false,
    "lastPlayedAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 收藏故事

- **路径**: `POST /api/v1/stories/:id/favorite`
- **认证**: 可选（支持匿名用户）

**成功响应**:

```json
{
  "success": true,
  "isFavorite": true
}
```

#### 取消收藏故事

- **路径**: `DELETE /api/v1/stories/:id/favorite`
- **认证**: 可选（支持匿名用户）

**成功响应**:

```json
{
  "success": true,
  "isFavorite": false
}
```

#### 分享故事

- **路径**: `POST /api/v1/stories/:id/share`
- **认证**: 可选（支持匿名用户）

**请求体**:

| 参数名        | 类型     | 必填 | 说明                       |
| ---------- | ------ | -- | ------------------------ |
| `platform` | string | 否  | 分享平台（wechat/weibo/qzone） |

**成功响应**:

```json
{
  "success": true,
  "shareId": "share-uuid"
}
```

#### 获取故事播放统计

- **路径**: `GET /api/v1/stories/stats/summary`
- **认证**: 可选（支持匿名用户）

**成功响应**:

```json
{
  "success": true,
  "data": {
    "storiesCompleted": 5,
    "totalStories": 100,
    "favoritesCount": 10,
    "recentlyPlayed": [
      {
        "id": "story-uuid",
        "title": "最近播放的故事",
        "coverUrl": "https://example.com/cover.jpg",
        "lastPlayedAt": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 获取收藏的故事列表

- **路径**: `GET /api/v1/stories/favorites`
- **认证**: 可选（支持匿名用户）

**成功响应**:

```json
{
  "success": true,
  "data": {
    "stories": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### B.2 课程模块 `/api/v1/courses`

#### 获取课程列表

- **路径**: `GET /api/v1/courses`
- **认证**: 可选（支持匿名用户）

**查询参数**:

| 参数名     | 类型     | 必填 | 默认值 | 说明   |
| ------- | ------ | -- | --- | ---- |
| `page`  | number | 否  | 1   | 页码   |
| `limit` | number | 否  | 20  | 每页数量 |

**成功响应**:

```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course-uuid",
        "title": "课程标题",
        "description": "课程描述",
        "level": 1,
        "coverUrl": "https://example.com/cover.jpg",
        "lessons": [...],
        "completedLessons": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 获取课程详情

- **路径**: `GET /api/v1/courses/:id`
- **认证**: 可选（支持匿名用户）

**成功响应**:

```json
{
  "success": true,
  "data": {
    "id": "course-uuid",
    "title": "课程标题",
    "description": "课程描述",
    "level": 1,
    "lessons": [
      {
        "id": "lesson-uuid",
        "title": "课时标题",
        "order": 1,
        "isCompleted": true
      }
    ],
    "completedLessons": 3
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 完成课时

- **路径**: `POST /api/v1/courses/lessons/:lessonId/complete`
- **认证**: 可选（支持匿名用户）

**成功响应**:

```json
{
  "success": true,
  "data": {
    "id": "progress-uuid",
    "lessonId": "lesson-uuid",
    "isCompleted": true,
    "completedAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### B.3 文章模块 `/api/v1/articles`

#### 获取文章列表

- **路径**: `GET /api/v1/articles`
- **认证**: 不需要

**查询参数**:

| 参数名        | 类型     | 必填 | 默认值 | 说明   |
| ---------- | ------ | -- | --- | ---- |
| `category` | string | 否  | -   | 文章分类 |
| `page`     | number | 否  | 1   | 页码   |
| `limit`    | number | 否  | 20  | 每页数量 |

**成功响应**:

```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "article-uuid",
        "title": "文章标题",
        "category": "健康",
        "coverUrl": "https://example.com/cover.jpg",
        "summary": "文章摘要",
        "readTime": 5,
        "views": 100,
        "publishDate": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 获取文章详情

- **路径**: `GET /api/v1/articles/:id`
- **认证**: 可选（支持匿名用户）

**成功响应**:

```json
{
  "success": true,
  "data": {
    "id": "article-uuid",
    "title": "文章标题",
    "content": "文章内容HTML",
    "category": "健康",
    "coverUrl": "https://example.com/cover.jpg",
    "readTime": 5,
    "views": 101,
    "isFavorited": false,
    "publishDate": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 获取文章分类

- **路径**: `GET /api/v1/articles/categories`
- **认证**: 不需要

**成功响应**:

```json
{
  "success": true,
  "data": [
    { "name": "健康", "count": 20 },
    { "name": "教育", "count": 15 }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 收藏/取消收藏/分享文章

- **收藏**: `POST /api/v1/articles/:id/favorite`
- **取消收藏**: `DELETE /api/v1/articles/:id/favorite`
- **分享**: `POST /api/v1/articles/:id/share`
- **认证**: 都支持匿名用户

#### 获取收藏的文章列表

- **路径**: `GET /api/v1/articles/favorites`
- **认证**: 可选（支持匿名用户）

### B.4 话术/对话模块 `/api/v1/dialogues`

#### 获取话术列表

- **路径**: `GET /api/v1/dialogues`
- **认证**: 不需要

**查询参数**:

| 参数名        | 类型     | 必填 | 默认值 | 说明    |
| ---------- | ------ | -- | --- | ----- |
| `category` | string | 否  | -   | 话术分类  |
| `search`   | string | 否  | -   | 搜索关键词 |
| `page`     | number | 否  | 1   | 页码    |
| `limit`    | number | 否  | 20  | 每页数量  |

**成功响应**:

```json
{
  "success": true,
  "data": {
    "dialogues": [
      {
        "id": "dialogue-uuid",
        "titleKey": "话术标题",
        "category": "社交",
        "scenarioKey": "使用场景",
        "responseKey": "回复内容",
        "tags": ["标签1", "标签2"],
        "useCount": 50
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 获取话术详情

- **路径**: `GET /api/v1/dialogues/:id`
- **认证**: 不需要

#### 获取话术分类

- **路径**: `GET /api/v1/dialogues/categories`
- **认证**: 不需要

#### 收藏/取消收藏/话术

- **收藏**: `POST /api/v1/dialogues/:id/favorite`
- **取消收藏**: `DELETE /api/v1/dialogues/:id/favorite`
- **认证**: 都支持匿名用户

#### 获取收藏的话术列表

- **路径**: `GET /api/v1/dialogues/favorites`
- **认证**: 可选（支持匿名用户）

### B.5 打卡模块 `/api/v1/checkin`

#### 创建/更新打卡

- **路径**: `POST /api/v1/checkin`
- **认证**: 可选（支持匿名用户）

**请求体**:

| 参数名         | 类型     | 必填 | 默认值 | 说明               |
| ----------- | ------ | -- | --- | ---------------- |
| `date`      | string | 否  | 今天  | 打卡日期（YYYY-MM-DD） |
| `sleepTime` | string | 是  | -   | 入睡时间（HH:mm）      |
| `wakeTime`  | string | 是  | -   | 起床时间（HH:mm）      |
| `quality`   | number | 是  | -   | 睡眠质量（1-5）        |

**成功响应**:

```json
{
  "success": true,
  "data": {
    "id": "checkin-uuid",
    "date": "2024-01-15",
    "sleepTime": "21:30",
    "wakeTime": "07:00",
    "quality": 4
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 获取打卡连续天数

- **路径**: `GET /api/v1/checkin/streak`
- **认证**: 可选（支持匿名用户）

**成功响应**:

```json
{
  "success": true,
  "data": {
    "streak": 7,
    "longestStreak": 14,
    "totalDays": 30
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 获取今日打卡

- **路径**: `GET /api/v1/checkin/today`
- **认证**: 可选（支持匿名用户）

**成功响应**:

```json
{
  "success": true,
  "data": {
    "id": "checkin-uuid",
    "date": "2024-01-15",
    "sleepTime": "21:30",
    "wakeTime": "07:00",
    "quality": 4
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 获取打卡历史

- **路径**: `GET /api/v1/checkin/history`
- **认证**: 可选（支持匿名用户）

**查询参数**:

| 参数名     | 类型     | 必填 | 说明            |
| ------- | ------ | -- | ------------- |
| `month` | string | 否  | 月份筛选（YYYY-MM） |

**成功响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": "checkin-uuid",
      "date": "2024-01-15",
      "sleepTime": "21:30",
      "wakeTime": "07:00",
      "quality": 4
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 获取打卡统计数据

- **路径**: `GET /api/v1/checkin/stats`
- **认证**: 可选（支持匿名用户）

**查询参数**:

| 参数名      | 类型     | 必填 | 默认值  | 说明               |
| -------- | ------ | -- | ---- | ---------------- |
| `period` | string | 否  | week | 统计周期（week/month） |

**成功响应**:

```json
{
  "success": true,
  "data": {
    "averageSleepDuration": 8.5,
    "averageSleepDurationTrend": "stable",
    "averageBedtime": "21:30",
    "bedtimeStability": 85,
    "nightWakes": 1,
    "checkInStreak": 7,
    "longestStreak": 14,
    "weeklyData": [
      { "day": "Sun", "duration": 8.5 },
      { "day": "Mon", "duration": 8.0 }
    ],
    "monthlyData": [
      { "day": "1", "duration": 8.2 },
      { "day": "5", "duration": 7.8 }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### B.6 错误响应

所有API端点可能返回以下错误：

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "需要用户信息或匿名ID"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "故事不存在"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

```json
{
  "success": false,
  "error": {
    "code": "AUTH_PERMISSION_DENIED",
    "message": "需要会员权限"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

