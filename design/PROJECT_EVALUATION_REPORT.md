# Modoo 项目全面评估报告

> 评估日期：2026-05-19
> 评估范围：`D:\work\modoo` 全仓库（backend + modoo + design）
> 仓库状态：main 分支，47 次提交（2026年4月至今）

---

## 目录

1. [项目架构设计](#1-项目架构设计)
2. [代码质量](#2-代码质量)
3. [性能表现](#3-性能表现)
4. [安全性](#4-安全性)
5. [可扩展性](#5-可扩展性)
6. [文档完整性](#6-文档完整性)
7. [测试覆盖率](#7-测试覆盖率)
8. [团队协作流程](#8-团队协作流程)
9. [综合风险矩阵](#9-综合风险矩阵)
10. [改进优先级路线图](#10-改进优先级路线图)

---

## 1. 项目架构设计

### 1.1 现状

| 维度 | 现状 | 评分 |
|------|------|------|
| 架构模式 | 前后端分离的单体仓库（Monorepo），无 Monorepo 工具 | ★★★☆☆ |
| 后端框架 | Fastify v4 + TypeScript，RESTful API | ★★★★☆ |
| 前端框架 | React Native 0.81 + Expo SDK 54 | ★★★★☆ |
| 数据库 | SQLite（文件数据库） | ★★☆☆☆ |
| ORM | Prisma v5 | ★★★★☆ |
| API 版本化 | URL 路径版本（`/api/v1/`）+ Header 版本（`x-api-version`） | ★★★★☆ |
| 状态管理 | Zustand（轻量）+ React Context（多个 Provider） | ★★★☆☆ |
| 路由设计 | 后端：按业务领域拆分（auth, user, stories, courses 等） | ★★★★☆ |
| 支付集成 | 微信支付 + Apple Pay | ★★★★☆ |
| 国际化 | 双端统一架构：后端 I18nResource 表为数据源，前端 i18next 消费 | ★★★★★ |

### 1.2 架构亮点

- **后端路由按领域拆分清晰**：`backend/src/routes/` 下 20+ 个路由文件按业务模块划分（analytics, auth, articles, breathing, checkin, courses, dialogues, payment, stories 等），职责边界明确。
- **前端 Feature-based 架构**：`modoo/src/features/` 下按功能域划分（auth, child-mode, home, parent-mode, player），每个 feature 内聚组件/hooks/screens。
- **i18n 双端统一架构**：后端 I18nResource 表作为唯一数据源，前端 locale JSON 文件为构建时副本，配合 sync 脚本保证一致性，设计合理。
- **双版本控制机制**：同时支持 URL 路径版本化和 Header 版本化，灵活性强。
- **音频架构分层清晰**：AudioCore → AudioFocusManager → UnifiedAudioProvider → CourseAudioProvider 四层抽象，职责分离良好。

### 1.3 架构风险与问题

| 风险 | 严重程度 | 说明 |
|------|----------|------|
| **SQLite 不适合生产级后端** | 🔴 高 | SQLite 是嵌入式文件数据库，不支持并发写入、缺少连接池、无主从复制、备份需锁库。当前活跃用户数少时尚可，用户增长后将出现性能瓶颈。 |
| **无 API Schema 验证** | 🟡 中 | Fastify 原生支持 JSON Schema 验证，但当前所有路由均未使用。所有参数校验均为手动 ad-hoc 检查。 |
| **Context Provider 嵌套过深** | 🟡 中 | `App.tsx` 中 Provider 嵌套已达 8 层以上（GestureHandler → SafeArea → Theme → i18n → UnifiedAudio → CourseAudio → Audio → ErrorBoundary → ActivityProvider → NavigationCallback），影响渲染性能和可维护性。 |
| **Monorepo 无工具支撑** | 🟡 中 | 无 Nx/Turborepo/pnpm-workspace 等工具，前后端各自维护独立的 `package.json` 和 `node_modules`，无共享类型定义、无统一脚本。 |
| **自定义 Rate Limiter 中间件未挂载** | 🟡 中 | `middleware/rateLimiter.ts` 定义了但未在 `index.ts` 的服务启动流程中注册，仅依赖 `@fastify/rate-limit` 的全局限制。 |
| **bcrypt 依赖未使用** | 🟢 低 | `bcrypt` 在 `package.json` 中声明但源码中无引用，属于死依赖。 |
| **expo-secure-store 未充分使用** | 🟡 中 | 已安装但 AuthService 中仍使用 `AsyncStorage` 存储 token，未使用 Keychain/Keystore 加密存储。 |

### 1.4 改进建议

1. **数据库迁移**：制定从 SQLite 到 PostgreSQL 的迁移计划。Prisma 支持多数据库，迁移成本可控。建议在用户量达到临界值前完成。
2. **引入 Fastify Schema Validation**：为每个路由添加 JSON Schema 定义，利用 Fastify 内置的 Ajv 编译优化，同时自动生成 API 文档。
3. **整理 Provider 层级**：考虑使用单一 `AppProvider` 组合多个 Context，或使用 Jotai/Recoil 等原子化状态管理减少 Context 数量。
4. **引入 Monorepo 工具**：推荐 Turborepo（轻量、快速），可共享 TypeScript 类型包（如 `@modoo/shared-types`），统一 lint/test/build 脚本。
5. **移除死依赖**：清理未使用的 `bcrypt` 依赖。

---

## 2. 代码质量

### 2.1 现状

| 维度 | 现状 | 评分 |
|------|------|------|
| 类型安全 | 双端均启用 `strict: true` | ★★★★★ |
| Lint 配置 | 双端均有 ESLint 配置（back-end：`no-console: error`，front-end：React + hooks 规则） | ★★★★☆ |
| 代码格式化 | **无 Prettier/EditorConfig 配置** | ★☆☆☆☆ |
| 错误处理 | 527 处 try/catch/.catch/throw，覆盖 89 个文件 | ★★★★☆ |
| 魔法数字 | 后端 env 集中在 `config/index.ts`（40处 process.env）；前端集中在 `config/env.ts`（19处） | ★★★★☆ |
| console.log | 后端 src 为 0；前端 src 有 15 处（主要在 TimePickerModal.tsx：13处） | ★★★☆☆ |
| TODO/FIXME | 8 处，分布在 6 个文件 | ★★★☆☆ |
| 注释掉的代码 | 4 个文件存在 | ★★★☆☆ |

### 2.2 代码亮点

- **配置集中管理**：后端的 `config/index.ts` 和前端的 `config/env.ts` 将环境变量统一收敛到类型安全的配置对象中，配合 `validateConfig()` 启动时校验，避免运行时因缺配置而崩溃。
- **错误处理体系完善**：后端有 `AppError` 类层次结构和 `errorHandler` 中间件；前端有 `ErrorBoundary`、`ErrorToast`、`ErrorState`、`ErrorHandler` 服务和 `ErrorContext`。
- **API 请求健壮性**：前端 ApiService 实现了 GET 请求去重、失败重试（含指数退避）、超时控制、并发 token 刷新互斥锁，工程质量良好。

### 2.3 代码问题

| 问题 | 位置 | 说明 |
|------|------|------|
| **console.log 违反 lint 规则** | `modoo/src/components/TimePickerModal.tsx`（13处） | 两个 ESLint 配置均设置 `no-console: error`（仅允许 warn/error），这些代码无法通过 lint 检查。 |
| **被注释的认证绕过代码** | `backend/src/middleware/authorization.ts:7-8`、`modoo/src/infrastructure/auth/AuthService.ts:137` | 注释掉的 `return` 语句会绕过认证检查，标注为"临时处理"。极易被误取消注释导致安全漏洞。 |
| **硬编码第三方 API URL** | 后端 auth.ts、settings.ts、AppleAuthService.ts | 微信 OAuth URL、Apple JWKS URL 等 7 处硬编码在业务代码中，应移至 config。 |
| **无代码格式化工具** | 全仓库 | 缺乏 Prettier/EditorConfig，不同开发者可能产生格式冲突，Code Review 噪音大。 |

### 2.4 改进建议

1. **立即添加 Prettier 配置**：同时添加 `.prettierrc` 和 `.editorconfig`，在 CI 中添加格式检查步骤。
2. **清理 console.log**：移除 `TimePickerModal.tsx` 中的调试日志（13 处），替换为项目统一 logger。
3. **删除注释掉的认证绕过代码**：移除 `authorization.ts` 和 `AuthService.ts` 中被注释的 `return` 语句，或至少添加明确的 `WARNING:` 注释说明不可取消注释。
4. **迁移硬编码 URL 至 config**：将微信 API URL、Apple API URL 等统一移至 `config/index.ts` 管理，方便切换环境（沙箱/生产）。
5. **补充 .editorconfig**：确保行尾、缩进、字符集等基础格式规范统一。

---

## 3. 性能表现

### 3.1 现状

| 维度 | 现状 | 评分 |
|------|------|------|
| 数据库查询优化 | Prisma ORM，有策略性索引（userId, childId, category, status 等） | ★★★☆☆ |
| 分页 | 所有列表端点均支持 `page`/`limit` 分页 | ★★★★☆ |
| 缓存 | 仅客户端 AsyncStorage TTL 缓存（30min/2h/24h），无服务端缓存 | ★★☆☆☆ |
| 请求去重 | 前端 ApiService 的 `pendingRequests` Map 去重重复 GET 请求 | ★★★★☆ |
| 连接池 | 依赖 Prisma 内置连接管理（SQLite 连接池能力有限） | ★★☆☆☆ |
| 批量写入 | AnalyticsBatch 模型支持批量插入分析事件 | ★★★★☆ |
| 资源优化 | 静态资源（音频、图片）直接通过 Fastify 静态文件服务提供，无 CDN 实际配置 | ★★☆☆☆ |

### 3.2 性能风险

| 风险 | 严重程度 | 说明 |
|------|----------|------|
| **SQLite 并发写瓶颈** | 🔴 高 | SQLite 使用文件级锁，同一时间只能有一个写操作。当用户提交 check-in、播放记录、分析事件等并发写入时，会出现锁等待甚至失败。 |
| **无服务端缓存** | 🟡 中 | 文章列表、课程列表、定价方案等相对静态的数据每次请求都查库，缺少 Redis/Memcached 缓存层。 |
| **静态资源直出** | 🟡 中 | 音频文件（MP3，13 个故事 + 11 个白噪音）直接从 Fastify 提供，无 CDN 分发，大文件下载可能阻塞服务响应。 |
| **前端 Provider 嵌套** | 🟢 低 | 8+ 层 Context 嵌套在 React 19 下影响已减轻（React 19 优化了 Context 渲染），但仍需关注。 |

### 3.3 改进建议

1. **数据库迁移至 PostgreSQL**（与 §1.4 协同）：解决并发写入瓶颈。
2. **引入 Redis 缓存**：为热点数据（文章、课程、定价方案）添加缓存层，减少数据库读压力。
3. **静态资源 CDN 化**：将音频/图片资源上传至 CDN（如阿里云 OSS + CDN），前端通过 CDN URL 加载。
4. **添加数据库查询性能监控**：利用 Prisma 的 `log: ['query']` + Sentry Performance 追踪慢查询。

---

## 4. 安全性

### 4.1 现状

| 维度 | 现状 | 评分 |
|------|------|------|
| 认证机制 | JWT（access + refresh token），三种登录方式（手机验证码、Apple、微信） | ★★★★☆ |
| 鉴权中间件 | `requireAuth`、`requireMembership`、`optionalAuth` 三级鉴权 | ★★★★☆ |
| 密码存储 | 无密码登录体系（手机验证码登录），用户无密码字段 | ★★★★★ |
| CORS | `origin: true`（允许所有来源） | ★★☆☆☆ |
| 速率限制 | `@fastify/rate-limit`（100 req/min 全局）+ 自定义 rateLimiter（未注册） | ★★★☆☆ |
| 安全头 | **无 Helmet/安全头中间件** | ★☆☆☆☆ |
| CSRF 防护 | **无** | ★☆☆☆☆ |
| 输入验证 | 手动 ad-hoc 校验（手机号正则、长度限制），无 Schema 验证库 | ★★☆☆☆ |
| 敏感数据存储 | JWT secret 有硬编码回退值 + .env 文件存在磁盘但已 gitignore | ★★☆☆☆ |
| Token 安全 | Refresh Token 明文存库（未哈希）；Access Token 有效期 7 天（过长）；AsyncStorage 明文存 Token | ★★☆☆☆ |
| SQL 注入 | 统一使用 Prisma ORM，无原始 SQL，安全 | ★★★★★ |
| 代码注入 | 未发现 eval()/Function() 使用 | ★★★★★ |
| 支付安全 | 微信支付 MD5 签名（平台要求，非项目选择） | ★★★★☆ |

### 4.2 安全风险清单

| 风险 | 严重程度 | 影响 | 修复难度 |
|------|----------|------|----------|
| **JWT Secret 硬编码回退值** | 🔴 严重 | 若生产环境未设 `JWT_SECRET` 环境变量，攻击者可直接伪造 JWT | 低（移除回退值即可） |
| **CORS 全开放** | 🔴 严重 | 任意网站可发起跨域请求，结合 `credentials: true` 可窃取用户数据 | 低（配置白名单） |
| **Refresh Token 明文存库** | 🟠 高 | 数据库泄露 = 所有 Refresh Token 可被直接使用 | 中（需哈希存储） |
| **Access Token 7 天有效期** | 🟠 高 | Token 一旦泄露，攻击者拥有长达 7 天的操作窗口 | 低（缩短至 15min-1h） |
| **被注释的认证绕过代码** | 🟠 高 | 代码中保留着可直接跳过认证的注释代码，误取消注释或合并冲突可能激活 | 低（删除即可） |
| **无安全头（Helmet）** | 🟡 中 | 缺少 CSP、X-Frame-Options、HSTS、X-Content-Type-Options 等基础防护 | 低（安装 fastify-helmet） |
| **Token 存 AsyncStorage** | 🟡 中 | iOS 上 AsyncStorage 不加密，设备丢失可导致 Token 泄露 | 中（迁移到 expo-secure-store） |
| **自定义 rateLimiter 未挂载** | 🟡 中 | 敏感端点（发送验证码、登录）可能无有效的细粒度限流 | 低（注册到路由） |
| **XML 正则解析支付回调** | 🟢 低 | 仅在微信支付回调端点使用，攻击面有限 | 低 |

### 4.3 改进建议（按优先级）

1. **P0 — 紧急修复**：
   - 移除 `config/index.ts` 中 JWT Secret 的硬编码回退值，启动时若无 `JWT_SECRET` 直接退出
   - 配置 CORS 白名单（生产环境限定到 `modoo.baby` 域名）
   - 删除 `authorization.ts` 和 `AuthService.ts` 中被注释的认证绕过代码
2. **P1 — 尽快修复**：
   - 缩短 Access Token 有效期至 15 分钟，Refresh Token 有效期至 7 天
   - 对数据库中存储的 Refresh Token 进行 SHA-256 哈希
   - 安装 `@fastify/helmet` 并配置安全头
   - 将 Token 存储从 AsyncStorage 迁移到 expo-secure-store
3. **P2 — 计划修复**：
   - 为所有路由添加 JSON Schema 输入验证
   - 在敏感端点（/auth/send-code, /auth/login）挂载 `strictRateLimiter`
   - 使用专业的 XML 解析库替代正则解析微信支付回调

---

## 5. 可扩展性

### 5.1 现状

| 维度 | 现状 | 评分 |
|------|------|------|
| 水平扩展能力 | SQLite 单机架构，无法水平扩展 | ★☆☆☆☆ |
| 模块化设计 | 路由按领域拆分，Feature 按功能拆分 | ★★★★☆ |
| API 版本化 | 支持双机制（URL + Header） | ★★★★☆ |
| 配置管理 | 环境变量集中，类型安全 | ★★★★☆ |
| 数据库迁移 | Prisma Migrate，13 个迁移记录 | ★★★★☆ |
| 插件/中间件体系 | 利用 Fastify 插件系统，中间件可插拔 | ★★★☆☆ |
| 分享策略模式 | 前端 ShareService 使用策略模式，支持微信/QQ/微博/原生 | ★★★★★ |

### 5.2 可扩展性风险

| 风险 | 说明 |
|------|------|
| **SQLite 无法水平扩展** | 无法做主从复制、读写分离、分库分表 |
| **无消息队列** | 无异步任务处理能力（如发送短信、生成报告、批量推送等耗时操作会阻塞请求） |
| **无微服务拆分基础** | 当前为单体后端，业务增长后 API 路由和数据库耦合在同一进程 |

### 5.3 改进建议

1. **数据库升级**（协同 §1.4、§3.3）：迁移至 PostgreSQL，为后续读写分离/连接池扩容打基础。
2. **引入消息队列**：使用 BullMQ（基于 Redis）或简单的内存队列处理异步任务（短信发送、分析事件批量写入、推送通知）。
3. **保持模块化优势**：当前路由级拆分已为未来微服务化做好准备，保持这一架构原则。

---

## 6. 文档完整性

### 6.1 现状

| 文档类型 | 数量/状态 | 评分 |
|----------|-----------|------|
| 商业计划文档 | `design/business_plan.md` | ★★★★☆ |
| API 设计文档 | `design/API_DESIGN_SPEC.md` | ★★★★☆ |
| 数据库设计文档 | `design/Backend_Data_Model_Evaluation.md` | ★★★★☆ |
| 实现计划 | `design/IMPLEMENTATION_PLAN.md` | ★★★☆☆ |
| 架构决策记录（ADR） | **无正式 ADR** | ★☆☆☆☆ |
| 前后端一致性检查 | `design/frontend-backend-consistency-check.md` + deep 版本 | ★★★★☆ |
| i18n 架构文档 | `design/Frontend_Backend_I18n_Unified_Architecture.md` | ★★★★☆ |
| Auth 实现文档 | `backend/docs/AUTH_IMPLEMENTATION.md` | ★★★★★ |
| OpenAPI/Swagger | **无** | ★☆☆☆☆ |
| 组件文档 | 无 | ★☆☆☆☆ |
| 部署文档 | 无 | ★☆☆☆☆ |
| Onboarding 文档 | 无 | ★☆☆☆☆ |

### 6.2 文档亮点

- `AUTH_IMPLEMENTATION.md` 详细介绍了认证系统的 API 端点、错误码、安全特性、使用示例，是文档质量的标杆。
- `Frontend_Backend_I18n_Unified_Architecture.md` 清晰描述了双端 i18n 同步机制和数据流，对于理解国际化架构至关重要。
- `design/` 目录下有 35 个设计文档，覆盖商业、UI、数据模型、API、实现计划等多个维度。

### 6.3 文档缺口

1. **无 OpenAPI/Swagger 规范文件**：虽然有 `API_DESIGN_SPEC.md` 手动文档，但无法自动生成客户端 SDK 或交互式 API 文档。
2. **无架构决策记录（ADR）**：47 次提交中有多个重要决策（数据库选型、认证方案、i18n 架构），但缺少正式的决策记录。
3. **无部署运维文档**：缺少环境搭建指南、部署流程、监控告警配置等内容。
4. **无组件文档**：前端的 AudioProvider 体系、ShareService 策略模式等复杂组件缺少使用文档。
5. **`design/` 目录被 gitignore**：所有设计文档不在版本控制中，团队成员可能看不到或使用过期版本。

### 6.4 改进建议

1. **生成 OpenAPI 规范**：利用 Fastify JSON Schema → Swagger 插件（`@fastify/swagger`）自动生成 OpenAPI 规范文件。
2. **建立 ADR 制度**：在 `design/adr/` 下为已做出的关键决策补充 ADR（使用 Michael Nygard 格式）。
3. **编写部署文档**：包含环境要求、配置项说明、数据库初始化、启动流程、健康检查端点。
4. **移除 design/ 的 gitignore**：设计文档应与代码一起版本管理，确保团队始终访问最新版本。
5. **为复杂组件编写 README**：重点覆盖 AudioProvider 体系、ShareService 策略模式、PermissionGate 组件。

---

## 7. 测试覆盖率

### 7.1 现状

| 维度 | 现状 | 评分 |
|------|------|------|
| 测试框架 | 后端：Vitest；前端：Jest | ★★★★☆ |
| 后端测试文件 | 5 个（accountValidationService, authService, userService, currencyUtils, dateUtils） | ★★☆☆☆ |
| 前端测试文件 | 2 个（AudioFocusManager, AudioCore） | ★☆☆☆☆ |
| 测试总数 | 7 个测试文件 | ★★☆☆☆ |
| 覆盖率配置 | Vitest 配置仅覆盖 `src/services/**/*.ts`（已配置但未强制阈值） | ★★☆☆☆ |
| E2E 测试 | 无 | ★☆☆☆☆ |
| 集成测试 | 无（仅单元测试） | ★☆☆☆☆ |

### 7.2 测试风险

| 风险 | 严重程度 | 说明 |
|------|----------|------|
| **测试覆盖严重不足** | 🔴 高 | 后端的 20+ 个路由文件、中间件、支付服务等核心业务逻辑均无测试覆盖。前端的 features、components、hooks 几乎完全无测试。 |
| **无覆盖率门槛** | 🟡 中 | vitest.config.ts 和 jest.config.js 均未设置 `thresholds`，允许覆盖率为 0。 |
| **无 CI 运行测试** | 🔴 高 | 无 CI/CD 配置，测试仅在开发者本地手动运行，无法保证每次提交的质量。 |

### 7.3 测试文件清单

**后端（5 个）：**
- `src/services/__tests__/accountValidationService.test.ts`
- `src/services/__tests__/authService.test.ts`
- `src/services/__tests__/userService.test.ts`
- `src/utils/__tests__/currencyUtils.test.ts`
- `src/utils/__tests__/dateUtils.test.ts`

**前端（2 个）：**
- `src/providers/__tests__/AudioFocusManager.test.ts`
- `src/providers/__tests__/AudioCore.test.ts`

### 7.4 改进建议

1. **建立测试分层策略**：
   - **单元测试**：覆盖 services、utils、hooks 中的纯逻辑函数
   - **集成测试**：覆盖 API 路由（使用 Fastify 的 `inject()` 方法模拟请求）+ 数据库操作
   - **E2E 测试**：使用 Detox 或 Maestro 覆盖核心用户流程
2. **设定覆盖率目标**：
   - 短期：核心 services 达到 80%+（accountValidation、auth、payment 等）
   - 中期：路由层达到 60%+
   - 长期：整体 70%+
3. **配置覆盖率阈值**：在 vitest 和 jest 配置中设置 `thresholds`，CI 不达标禁止合并。
4. **优先补测核心模块**：authService、payment 相关逻辑（WechatPayService、ApplePayService）、rateLimiter。

---

## 8. 团队协作流程

### 8.1 现状

| 维度 | 现状 | 评分 |
|------|------|------|
| 版本控制 | Git，main 分支直接开发 | ★★☆☆☆ |
| 分支策略 | 无明确分支策略（未见 feature/fix 分支） | ★☆☆☆☆ |
| CI/CD | **无 CI/CD 配置** | ★☆☆☆☆ |
| 代码审查 | 未见 PR 记录（可能直接 push main） | ★☆☆☆☆ |
| 提交规范 | 无 Conventional Commits 规范，中文提交信息 | ★★☆☆☆ |
| 代码格式化 | 无 Prettier/EditorConfig | ★☆☆☆☆ |
| 预提交检查 | 无 pre-commit hooks（如 husky + lint-staged） | ★☆☆☆☆ |
| 环境管理 | .env + .env.example 模式 | ★★★★☆ |
| 依赖管理 | npm（有 package-lock.json） | ★★★☆☆ |

### 8.2 协作风险

| 风险 | 严重程度 | 说明 |
|------|----------|------|
| **无 CI/CD** | 🔴 高 | 无自动化测试、构建、部署流程。Bug 只能靠开发者手动发现，部署依赖人工操作。 |
| **无分支策略** | 🟠 高 | 直接在 main 分支开发，无法进行代码审查，无法同时进行多个功能开发，回滚困难。 |
| **无 Pre-commit Hooks** | 🟡 中 | Lint 规则不会在提交前自动执行，不符合规范的代码可直接进入仓库。 |
| **无代码格式化约定** | 🟡 中 | 不同 IDE/编辑器可能产生格式差异，Code Review 中产生不必要的格式变更噪音。 |

### 8.3 改进建议

1. **建立 CI/CD 流水线**（使用 GitHub Actions）：
   ```yaml
   # 建议的 CI 流程
   Pull Request 触发 →
     Lint 检查 (eslint) →
     格式检查 (prettier --check) →
     类型检查 (tsc --noEmit) →
     单元测试 (vitest / jest) →
     构建验证 (tsc / expo build)
   ```
2. **采用 Git Flow 或 Trunk-based Development**：
   - 推荐 Trunk-based：从 main 创建短命 feature 分支 → PR → Code Review → 合并
   - 保护 main 分支：禁止直接 push，要求 PR + CI 通过 + 至少 1 人 Review
3. **配置 Pre-commit Hooks**：
   ```bash
   npx husky init
   # .husky/pre-commit: npx lint-staged
   # lint-staged 配置：*.ts → eslint --fix + prettier --write
   ```
4. **采用 Conventional Commits**：使用 `feat:`、`fix:`、`refactor:`、`docs:`、`chore:` 等标准前缀，便于自动生成 CHANGELOG 和版本管理。
5. **统一开发环境工具链**：推荐 VS Code + 项目级推荐插件配置（`.vscode/extensions.json`），确保 ESLint 和 Prettier 插件生效。

---

## 9. 综合风险矩阵

| 风险类别 | 风险项 | 可能性 | 影响 | 风险等级 |
|----------|--------|--------|------|----------|
| 安全 | JWT Secret 硬编码回退值 | 中 | 严重 | 🔴 严重 |
| 安全 | CORS 全开放 + credentials: true | 高 | 严重 | 🔴 严重 |
| 安全 | Refresh Token 明文存库 | 中 | 高 | 🟠 高 |
| 安全 | 被注释的认证绕过代码 | 低 | 严重 | 🟠 高 |
| 架构 | SQLite 不适合生产规模 | 高 | 高 | 🔴 严重 |
| 质量 | 测试覆盖率极低 + 无 CI | 高 | 高 | 🔴 严重 |
| 质量 | 无代码格式化配置 | 高 | 低 | 🟡 中 |
| 协作 | 无 CI/CD + 无分支策略 | 高 | 高 | 🔴 严重 |
| 性能 | SQLite 并发写入瓶颈 | 中 | 高 | 🟠 高 |
| 性能 | 无服务端缓存 | 中 | 中 | 🟡 中 |
| 安全 | 无 Helmet 安全头 | 高 | 中 | 🟡 中 |
| 安全 | Access Token 7 天有效期 | 中 | 中 | 🟡 中 |
| 可扩展 | 无消息队列 | 中 | 中 | 🟡 中 |
| 文档 | 无 OpenAPI 规范 | 中 | 低 | 🟢 低 |
| 文档 | design/ 目录被 gitignore | 中 | 低 | 🟢 低 |

---

## 10. 改进优先级路线图

### 阶段一：紧急修复（1-2 周）

目标：消除严重安全风险和阻断性质量问题。

| 序号 | 改进项 | 涉及文件 | 工作量 |
|------|--------|----------|--------|
| 1.1 | 移除 JWT Secret 硬编码回退值，启动时强制校验 | `backend/src/config/index.ts` | 0.5h |
| 1.2 | 配置 CORS 白名单 | `backend/src/index.ts` | 0.5h |
| 1.3 | 删除注释的认证绕过代码 | `backend/src/middleware/authorization.ts`, `modoo/src/infrastructure/auth/AuthService.ts` | 0.5h |
| 1.4 | 安装 fastify-helmet 并配置安全头 | `backend/src/index.ts` | 1h |
| 1.5 | 缩短 Access Token 有效期至 15min | `backend/src/config/index.ts` | 0.5h |
| 1.6 | 将自定义 rateLimiter 挂载到敏感端点 | `backend/src/index.ts`, `backend/src/routes/auth.ts` | 1h |

### 阶段二：质量基础（2-4 周）

目标：建立代码质量基础设施和团队协作规范。

| 序号 | 改进项 | 涉及范围 | 工作量 |
|------|--------|----------|--------|
| 2.1 | 添加 Prettier + EditorConfig 配置 | 全仓库 | 1h |
| 2.2 | 配置 GitHub Actions CI 流水线 | `.github/workflows/ci.yml` | 4h |
| 2.3 | 建立分支保护规则 + PR 模板 | GitHub 仓库设置 | 1h |
| 2.4 | 配置 husky + lint-staged 预提交检查 | 全仓库 | 2h |
| 2.5 | 清理 console.log（TimePickerModal.tsx） | `modoo/src/components/TimePickerModal.tsx` | 1h |
| 2.6 | 迁移硬编码 URL 至 config | `backend/src/routes/auth.ts`, `backend/src/services/AppleAuthService.ts` | 2h |
| 2.7 | 为路由添加 Fastify JSON Schema 验证 | `backend/src/routes/*.ts` | 8h |
| 2.8 | 安装 @fastify/swagger 自动生成 OpenAPI 文档 | `backend/src/index.ts` | 2h |

### 阶段三：架构加固（4-8 周）

目标：提升可扩展性、性能和测试覆盖。

| 序号 | 改进项 | 涉及范围 | 工作量 |
|------|--------|----------|--------|
| 3.1 | 制定 SQLite → PostgreSQL 迁移计划并执行 | 数据库 | 16h |
| 3.2 | 补测核心 service 单元测试（达到 80%+） | `backend/src/services/` | 16h |
| 3.3 | 补测核心路由集成测试 | `backend/src/routes/` | 24h |
| 3.4 | Refresh Token 哈希存储 | `backend/src/services/authService.ts` | 4h |
| 3.5 | Token 存储迁移至 expo-secure-store | `modoo/src/infrastructure/auth/AuthService.ts` | 4h |
| 3.6 | 引入 Redis 缓存热点数据 | 新基础设施 | 8h |
| 3.7 | 引入 BullMQ 处理异步任务 | 新基础设施 | 8h |

### 阶段四：持续优化（长期）

| 序号 | 改进项 | 说明 |
|------|--------|------|
| 4.1 | 引入 Turborepo 统一 Monorepo 管理 | 共享类型、统一脚本 |
| 4.2 | 静态资源迁移 CDN | 阿里云 OSS + CDN |
| 4.3 | 前端组件/E2E 测试 | Detox / Maestro |
| 4.4 | 建立 ADR 文档制度 | `design/adr/` |
| 4.5 | 编写部署运维文档 | 环境搭建、部署流程、监控告警 |
| 4.6 | 采用 Conventional Commits + automated changelog | commitlint + standard-version |
| 4.7 | 移除 design/ 的 gitignore | 设计文档纳入版本控制 |

---

## 附录 A：项目优势总结

尽管本报告侧重于风险和改进，但项目在以下方面表现出色：

1. **i18n 架构**：双端统一的国际化架构设计，以后端数据库为唯一数据源，前端同步消费，设计理念先进。
2. **认证体系**：无密码登录设计（手机验证码 + 社交登录）降低了凭证泄露风险，三种登录方式覆盖完整。
3. **前端工程化细节**：ApiService 的请求去重、重试退避、并发 Token 刷新互斥锁等实现质量高。
4. **错误处理体系**：前后端均有分层的错误处理机制（AppError 类层次、ErrorBoundary、ErrorHandler）。
5. **配置管理**：环境变量集中管理 + 类型安全 + 启动校验，工程质量良好。
6. **功能完整度**：从用户系统、内容管理、支付集成、会员体系到分析数据管道，商业功能的实现广度较好。
7. **设计文档丰富**：35 个设计文档覆盖商业、产品、技术多个维度。

## 附录 B：技术栈评估

| 技术选型 | 适用性 | 风险 | 替代方案 |
|----------|--------|------|----------|
| Fastify | ✅ 高性能、插件化、TypeScript 友好 | 低 | Express（性能较低） |
| Prisma | ✅ 类型安全 ORM，迁移管理成熟 | 低 | TypeORM, Drizzle |
| SQLite | ⚠️ 仅适合开发/原型阶段 | 高 | PostgreSQL |
| React Native + Expo | ✅ 跨平台效率高，生态丰富 | 低 | Flutter |
| Zustand | ✅ 轻量、TS 友好 | 低 | Redux Toolkit |
| i18next | ✅ 生态成熟 | 低 | react-intl |
| Vitest | ✅ 快速、与 Vite 生态集成好 | 低 | Jest（后端） |
| AsyncStorage | ⚠️ 无加密 | 中 | expo-secure-store |
