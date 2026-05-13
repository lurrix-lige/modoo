# 会员系统实施文档

## 一、项目概述

本文档记录了会员价格体系与权益管理系统的完整实现方案，包括：
1. 会员价格体系与购买记录管理
2. 会员权益与具体产品的关联关系管理

## 二、数据库模型设计

### 2.1 新增模型概览

| 模型名称 | 说明 | 核心功能 |
|---------|------|---------|
| `PricingPlan` | 定价方案 | 定义会员套餐价格、时长、特性 |
| `Benefit` | 权益定义 | 定义会员可享受的权益项 |
| `ProductBenefit` | 产品权益关联 | 权益与具体产品类型的绑定 |
| `Subscription` | 订阅记录 | 用户订阅状态管理 |
| `SubscriptionBenefit` | 订阅权益 | 用户订阅拥有的权益实例 |
| `Order` | 订单记录 | 购买订单管理 |
| `OrderItem` | 订单项 | 订单包含的商品 |
| `PaymentTransaction` | 支付交易 | 支付流水记录 |
| `Promotion` | 促销活动 | 优惠券/折扣管理 |

### 2.2 产品类型枚举

```typescript
type ProductType = 
  | 'STORY'              // 故事
  | 'COURSE'             // 课程
  | 'LESSON'             // 课时
  | 'DIALOGUE'           // 话术
  | 'BREATHING_EXERCISE' // 呼吸训练
  | 'WHITE_NOISE'        // 白噪声
  | 'EXPERT_CONSULTATION'// 专家咨询
  | 'ARTICLE'            // 文章
  | 'CHECK_IN_REWARD'    // 签到奖励
  | 'SLEEP_ANALYSIS'     // 睡眠分析
  | 'CUSTOM_PLAN'        // 定制计划
  | 'FAMILY_SHARING'     // 家庭共享
```

### 2.3 权益类型枚举

```typescript
type BenefitType = 'CONTENT_ACCESS' | 'FEATURE' | 'SERVICE' | 'REWARD'
type AccessScope = 'ALL_USERS' | 'SUBSCRIBERS_ONLY' | 'PREMIUM_ONLY' | 'VIP_ONLY' | 'TRIAL_USERS'
type AccessLevel = 'FULL' | 'LIMITED' | 'PREVIEW'
```

## 三、服务层实现

### 3.1 BenefitService（权益服务）

**文件位置**: `src/services/BenefitService.ts`

**核心功能**:
- `getBenefits()` - 获取权益列表
- `getBenefitById()` / `getBenefitByKey()` - 获取单个权益
- `createBenefit()` / `updateBenefit()` / `deleteBenefit()` - 权益CRUD
- `getProductBenefits()` - 获取产品关联权益
- `createProductBenefit()` - 创建产品权益关联
- `checkUserAccess()` - 检查用户访问权限

### 3.2 PricingPlanService（定价方案服务）

**文件位置**: `src/services/PricingPlanService.ts`

**核心功能**:
- `getPricingPlans()` - 获取定价方案列表
- `getPricingPlanById()` / `getPricingPlanByKey()` - 获取单个方案
- `createPricingPlan()` / `updatePricingPlan()` / `deletePricingPlan()` - 方案CRUD

### 3.3 SubscriptionService（订阅服务）

**文件位置**: `src/services/SubscriptionService.ts`

**核心功能**:
- `getActiveSubscription()` - 获取用户活跃订阅
- `getUserSubscriptions()` - 获取用户所有订阅
- `createSubscription()` - 创建订阅
- `updateSubscription()` / `cancelSubscription()` / `renewSubscription()` - 订阅管理
- `checkSubscriptionStatus()` - 检查订阅状态
- `incrementBenefitUsage()` - 记录权益使用

### 3.4 OrderService（订单服务）

**文件位置**: `src/services/OrderService.ts`

**核心功能**:
- `createOrder()` - 创建订单
- `getOrderById()` / `getOrderByOrderNo()` - 获取订单
- `markOrderAsPaid()` - 标记订单已支付
- `cancelOrder()` / `refundOrder()` - 取消/退款
- `createTransaction()` - 创建交易记录
- `expirePendingOrders()` - 过期待支付订单

## 四、API 路由

### 4.1 定价方案接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/membership/plans` | 获取所有定价方案 | 否 |
| POST | `/api/membership/plans` | 创建定价方案 | 是 |
| GET | `/api/membership/plans/:planId` | 获取单个方案 | 否 |
| PUT | `/api/membership/plans/:planId` | 更新定价方案 | 是 |
| DELETE | `/api/membership/plans/:planId` | 删除定价方案 | 是 |

### 4.2 权益接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/membership/benefits` | 获取权益列表 | 否 |
| GET | `/api/membership/benefits/:benefitId` | 获取单个权益 | 否 |
| GET | `/api/membership/benefits/key/:benefitKey` | 按key获取权益 | 否 |
| POST | `/api/membership/benefits` | 创建权益 | 是 |
| PUT | `/api/membership/benefits/:benefitId` | 更新权益 | 是 |
| DELETE | `/api/membership/benefits/:benefitId` | 删除权益 | 是 |
| GET | `/api/membership/benefits/product/:productType` | 获取产品权益 | 否 |
| POST | `/api/membership/benefits/product` | 创建产品权益关联 | 是 |

### 4.3 订阅接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/membership/current` | 获取当前订阅状态 | 是 |
| GET | `/api/membership/subscriptions` | 获取用户订阅列表 | 是 |
| POST | `/api/membership/subscribe` | 创建订阅 | 是 |
| PUT | `/api/membership/subscriptions/:subscriptionId` | 更新订阅 | 是 |
| POST | `/api/membership/cancel` | 取消订阅 | 是 |

### 4.4 订单接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/membership/orders` | 创建订单 | 是 |
| GET | `/api/membership/orders/:orderId` | 获取订单详情 | 是 |
| GET | `/api/membership/orders/orderNo/:orderNo` | 按订单号查询 | 是 |
| GET | `/api/membership/orders` | 获取用户订单列表 | 是 |
| POST | `/api/membership/orders/:orderId/pay` | 支付订单 | 是 |
| POST | `/api/membership/orders/:orderId/cancel` | 取消订单 | 是 |
| POST | `/api/membership/orders/:orderId/refund` | 退款 | 是 |

### 4.5 交易接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/membership/transactions` | 获取用户交易记录 | 是 |
| GET | `/api/membership/access/check` | 检查产品访问权限 | 是 |
| GET | `/api/membership/status` | 获取会员状态 | 是 |

## 五、测试数据

### 5.1 预置权益（15项）

| 权益Key | 类型 | 适用范围 |
|---------|------|---------|
| `benefit.all_stories` | CONTENT_ACCESS | SUBSCRIBERS_ONLY |
| `benefit.ad_free` | FEATURE | SUBSCRIBERS_ONLY |
| `benefit.unlimited_breathing` | CONTENT_ACCESS | SUBSCRIBERS_ONLY |
| `benefit.premium_support` | SERVICE | SUBSCRIBERS_ONLY |
| `benefit.exclusive_content` | CONTENT_ACCESS | PREMIUM_ONLY |
| `benefit.family_sharing` | FEATURE | VIP_ONLY |
| `benefit.story_preview` | CONTENT_ACCESS | ALL_USERS |
| `benefit.basic_breathing` | CONTENT_ACCESS | ALL_USERS |
| `benefit.white_noise_basic` | CONTENT_ACCESS | ALL_USERS |
| `benefit.white_noise_premium` | CONTENT_ACCESS | SUBSCRIBERS_ONLY |
| `benefit.dialogue_access` | CONTENT_ACCESS | SUBSCRIBERS_ONLY |
| `benefit.expert_consultation` | SERVICE | PREMIUM_ONLY |
| `benefit.course_access` | CONTENT_ACCESS | SUBSCRIBERS_ONLY |
| `benefit.sleep_analysis` | FEATURE | SUBSCRIBERS_ONLY |
| `benefit.checkin_reward` | REWARD | ALL_USERS |

### 5.2 预置定价方案（3种）

| 方案 | 原价 | 现价 | 时长 | 推荐 | 节省 |
|------|------|------|------|------|------|
| MONTHLY | 38 | 28 | 30天 | 否 | - |
| QUARTERLY | 99 | 68 | 90天 | 是 | 19% |
| YEARLY | 336 | 198 | 365天 | 否 | 41% |

## 六、数据初始化

运行以下命令初始化测试数据：

```bash
npx ts-node prisma/seed-membership.ts
```

## 七、权限控制流程

```
用户访问产品 → 检查用户订阅状态 → 获取用户权益列表 → 匹配产品权益规则 → 返回访问权限
```

### 访问级别说明

- **FULL**: 完全访问权限
- **LIMITED**: 有限访问（如每日次数限制）
- **PREVIEW**: 预览权限（如试听）

## 八、代码优化说明

### 8.1 避免大量 if-else 的策略

1. **使用对象映射替代条件判断**
   - 将条件分支转换为配置对象查找
   - 使用策略模式处理不同场景

2. **使用短路求值简化逻辑**
   - `condition && action()`
   - `condition ? value1 : value2`

3. **提取辅助函数**
   - 将复杂逻辑封装为独立函数
   - 提高代码可读性和可测试性

4. **使用类型系统约束**
   - 通过 TypeScript 类型定义限制可能的值
   - 减少运行时条件检查

## 九、技术亮点

1. **完整的权益体系**：支持多级别会员、多种权益类型、灵活的权限控制
2. **统一的访问检查**：通过 `checkUserAccess()` 统一处理所有产品的权限验证
3. **灵活的定价策略**：支持原价/现价、折扣、促销码等多种定价方式
4. **完整的订单流程**：订单创建、支付、完成、取消、退款全流程支持
5. **权益使用追踪**：记录权益使用次数和使用限制
6. **SQLite 兼容性**：使用 Float 和 String 替代 Decimal 和 Json，确保兼容性