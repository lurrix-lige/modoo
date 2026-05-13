# 会员系统完善技术实现方案

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档名称 | 会员系统完善技术实现方案 |
| 版本 | v1.0 |
| 创建日期 | 2026-05-04 |
| 状态 | 待实施 |

---

## 1. 现状分析

### 1.1 现有数据模型

```prisma
model Membership {
  id        String   @id @default(uuid())
  userId    String
  plan      String   @default("MONTHLY")  // MONTHLY, QUARTERLY, YEARLY
  status    String   @default("ACTIVE")   // ACTIVE, CANCELLED, EXPIRED
  startedAt DateTime @default(now())
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id])
}

model Story {
  id          String   @id @default(uuid())
  isPremium   Boolean  @default(false)
  // ...
}

model Course {
  id        String    @id @default(uuid())
  isPremium Boolean @default(false)
  // ...
}

model Dialogue {
  id           String   @id @default(uuid())
  isPremium    Boolean @default(false)
  // ...
}

model BreathingExercise {
  id        String    @id @default(uuid())
  isPremium Boolean @default(false)
  // ...
}

model WhiteNoise {
  id         String    @id @default(uuid())
  isPremium  Boolean  @default(false)
  // ...
}
```

### 1.2 现有API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/membership/plans` | GET | 获取会员方案列表 |
| `/api/membership/current` | GET | 获取当前会员状态 |
| `/api/membership/subscribe` | POST | 订阅会员 |
| `/api/membership/cancel` | POST | 取消会员 |

### 1.3 现有价格体系（硬编码）

```typescript
const MEMBERSHIP_PLANS = {
  MONTHLY: { price: 28, duration: 30 },
  QUARTERLY: { price: 68, duration: 90 },
  YEARLY: { price: 198, duration: 365 },
};
```

### 1.4 发现的问题

| 问题 | 严重程度 | 说明 |
|------|----------|------|
| 价格硬编码 | 高 | 无法动态调整价格，无法支持促销活动 |
| 无购买记录 | 高 | 无法追溯用户的购买历史和退款记录 |
| 权益静态定义 | 高 | 权益通过i18n硬编码，无法灵活配置 |
| 产品关联缺失 | 高 | 会员权益与具体内容（故事、课程等）的绑定关系不清晰 |
| 无订阅管理 | 中 | 缺少续费、自动扣费、订阅状态变更等机制 |
| 无优惠券支持 | 中 | 无法支持折扣、促销活动 |

---

## 2. 解决方案设计

### 2.1 核心改进架构

```
┌─────────────────────────────────────────────────────────────┐
│                      会员系统架构                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ 价格管理     │  │ 权益管理     │  │ 订阅管理             │ │
│  │ - 定价方案   │  │ - 权益定义   │  │ - 订阅创建           │ │
│  │ - 优惠活动   │  │ - 产品关联   │  │ - 续费               │ │
│  │ - 优惠券     │  │ - 权限检查   │  │ - 取消               │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ 购买记录     │  │ 支付集成     │  │ 内容访问控制          │ │
│  │ - 订单管理   │  │ - 支付网关   │  │ - 权限校验           │ │
│  │ - 退款管理   │  │ - 支付回调   │  │ - 访问拦截           │ │
│  │ - 对账       │  │ - 退款处理   │  │ - 内容标记           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 数据模型扩展

#### 2.2.1 新增 PricingPlan（定价方案）

```prisma
model PricingPlan {
  id            String    @id @default(uuid())
  planKey       String    @unique  // "monthly", "quarterly", "yearly"
  nameKey       String              // i18n key for display name
  descriptionKey String?            // i18n key for description
  originalPrice Decimal    // 原价
  currentPrice  Decimal    // 当前价格
  currency      String    @default("CNY")
  durationDays   Int       // 有效期天数
  sortOrder     Int       @default(0)
  isActive      Boolean   @default(true)
  isRecommended Boolean   @default(false)
  savingPercent Int?      // 节省百分比，如 19 表示节省19%
  features     Json?     // 特性列表 ["feature1", "feature2"]
  notIncluded  Json?     // 不包含的特性
  metadata     Json?     // 扩展数据
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  subscriptions Subscription[]
  orderItems    OrderItem[]

  @@index([isActive])
  @@map("pricing_plans")
}
```

#### 2.2.2 新增 Subscription（订阅）

```prisma
model Subscription {
  id              String    @id @default(uuid())
  userId          String
  planId          String
  status          SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  autoRenew        Boolean   @default(true)
  cancelAtPeriodEnd Boolean @default(false)
  cancelledAt      DateTime?
  terminationReason String?
  externalSubId    String?   // 外部订阅ID（如App Store/Google Play）
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan     PricingPlan @relation(fields: [planId], references: [id])
  orders   Order[]  // 一对多：一个订阅可产生多个续费订单
  benefits SubscriptionBenefit[]

  @@index([userId])
  @@index([status])
  @@index([externalSubId])
  @@map("subscriptions")
}

enum SubscriptionStatus {
  ACTIVE        // 有效
  CANCELLED      // 已取消（用户主动取消，到期前仍可用）
  EXPIRED       // 已过期（到期未续费）
  PAUSED        // 暂停（支付失败导致）
  PENDING       // 待激活（创建订阅但未支付）
}
```

#### 2.2.3 新增 Benefit（权益定义）

```prisma
model Benefit {
  id            String   @id @default(uuid())
  benefitKey    String   @unique  // "all_stories", "premium_support"
  nameKey       String            // i18n key
  descriptionKey String?          // i18n key
  type          BenefitType       // CONTENT_ACCESS, FEATURE, SERVICE
  value         Json?             // 权益值，如允许访问的课程数
  sortOrder     Int       @default(0)
  isActive      Boolean   @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  productBenefits ProductBenefit[]
  subscriptionBenefits SubscriptionBenefit[]

  @@map("benefits")
}

enum BenefitType {
  CONTENT_ACCESS  // 内容访问权限
  FEATURE        // 功能权限
  SERVICE        // 服务权限
}
```

#### 2.2.4 新增 ProductBenefit（产品与权益关联）

```prisma
model ProductBenefit {
  id              String   @id @default(uuid())
  benefitId       String
  productType     ProductType  // STORY, COURSE, DIALOGUE, etc.
  productId       String?      // 特定产品ID，null表示该类型全部产品
  accessLevel     AccessLevel  // FULL, LIMITED, PREVIEW
  limitQuantity   Int?         // 限制数量（如每月10个故事）
  limitPeriod     String?      // 限制周期 "monthly", "weekly"
  isGrantByDefault Boolean @default(true) // 订阅时默认授予
  conditions      Json?        // 额外条件
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  benefit Benefit @relation(fields: [benefitId], references: [id], onDelete: Cascade)

  @@unique([benefitId, productType, productId])
  @@index([productType, productId])
  @@map("product_benefits")
}

enum ProductType {
  STORY
  COURSE
  LESSON
  DIALOGUE
  BREATHING_EXERCISE
  WHITE_NOISE
  EXPERT_CONSULTATION
  ARTICLE
  CHECK_IN_REWARD        // 打卡奖励
  SLEEP_ANALYSIS         // 睡眠分析报告
  CUSTOM_PLAN            // 定制计划
  FAMILY_SHARING         // 家庭共享功能
}

enum AccessLevel {
  FULL      // 完全访问
  LIMITED   // 限制访问（如部分内容）
  PREVIEW   // 预览（免费部分）
}
```

#### 2.2.5 新增 SubscriptionBenefit（订阅权益记录）

```prisma
model SubscriptionBenefit {
  id              String   @id @default(uuid())
  subscriptionId   String
  benefitId       String
  grantedAt       DateTime @default(now())
  expiresAt       DateTime?
  usageCount      Int      @default(0)
  usageLimit      Int?     // 使用上限
  usagePeriod     String?  // 使用周期 "monthly", "unlimited"
  lastUsedAt      DateTime?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  subscription Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  benefit     Benefit      @relation(fields: [benefitId], references: [id])

  @@unique([subscriptionId, benefitId])
  @@index([subscriptionId])
  @@map("subscription_benefits")
}
```

#### 2.2.6 新增 PaymentTransaction（支付流水）

```prisma
model PaymentTransaction {
  id              String    @id @default(uuid())
  orderId         String?
  subscriptionId  String?
  userId          String
  type            TransactionType  // PAYMENT, REFUND, RENEWAL
  status          TransactionStatus // PENDING, SUCCESS, FAILED
  amount          Decimal
  currency        String   @default("CNY")
  paymentMethod   String?  // WECHAT, ALIPAY, APPLE_IAP, GOOGLE_IAP
  transactionId   String?  // 第三方交易号
  gatewayResponse Json?   // 网关响应原始数据
  failureReason   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  order        Order?       @relation(fields: [orderId], references: [id], onDelete: SetNull)
  subscription Subscription? @relation(fields: [subscriptionId], references: [id], onDelete: SetNull)
  user        User         @relation(fields: [userId], references: [id])

  @@index([orderId])
  @@index([subscriptionId])
  @@index([userId])
  @@index([transactionId])
  @@index([status])
  @@map("payment_transactions")
}

enum TransactionType {
  PAYMENT   // 支付
  REFUND    // 退款
  RENEWAL   // 续费扣款
}

enum TransactionStatus {
  PENDING  // 处理中
  SUCCESS   // 成功
  FAILED    // 失败
}
```

#### 2.2.7 新增 Order（订单）

```prisma
model Order {
  id              String    @id @default(uuid())
  orderNo         String    @unique  // 订单号：ORD{yyyyMMdd}{8位随机数}
  userId          String
  subscriptionId  String?   // 可为空（未关联订阅的订单）
  status          OrderStatus @default(PENDING)
  totalAmount     Decimal   @db.Decimal(10,2)
  discountAmount  Decimal   @default(0) @db.Decimal(10,2)
  finalAmount     Decimal   @db.Decimal(10,2)
  currency        String    @default("CNY")
  paymentMethod   String?   // WECHAT, ALIPAY, APPLE_IAP, GOOGLE_IAP
  paymentChannel  String?   // 支付渠道细分
  transactionId   String?   // 关联支付流水ID
  paidAt          DateTime?
  expiredAt       DateTime? // 订单过期时间（15分钟）
  completedAt     DateTime?
  cancelledAt     DateTime?
  cancelReason    String?
  refundAmount    Decimal?  @db.Decimal(10,2)
  refundedAt      DateTime?
  refundReason    String?
  metadata        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     OrderItem[]
  paymentTransaction PaymentTransaction?

  @@index([userId])
  @@index([status])
  @@index([subscriptionId])
  @@index([orderNo])
  @@index([createdAt])
  @@map("orders")
}

enum OrderStatus {
  PENDING       // 待支付
  PAID          // 已支付
  COMPLETED     // 已完成
  CANCELLED     // 已取消
  REFUNDED      // 已退款
  PARTIAL_REFUND // 部分退款
  EXPIRED       // 已过期
}
```

#### 2.2.8 新增 OrderItem（订单项）

```prisma
model OrderItem {
  id              String   @id @default(uuid())
  orderId         String
  planId          String
  planSnapshot    Json     // 购买时的方案快照（价格、权益列表等）
  quantity        Int      @default(1)
  unitPrice       Decimal  @db.Decimal(10,2)
  discountAmount  Decimal  @default(0) @db.Decimal(10,2)
  finalPrice      Decimal  @db.Decimal(10,2)
  currency        String   @default("CNY")
  createdAt       DateTime @default(now())

  order Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  plan  PricingPlan @relation(fields: [planId], references: [id])

  @@map("order_items")
}
```

#### 2.2.9 订单号生成策略

订单号格式：`{前缀}{日期}{序号}`
- 格式：`ORD{yyyyMMdd}{8位随机数}`
- 示例：`ORD20260512001234567`
- 优势：短时间内的订单有自增序号，便于对账
- 注意：8位随机数需保证在同日期内唯一

```typescript
function generateOrderNo(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).slice(2, 10).padStart(8, '0').toUpperCase();
  return `ORD${dateStr}${randomStr}`;
}
```

#### 2.2.10 新增 Promotion（促销活动）

```prisma
model Promotion {
  id            String    @id @default(uuid())
  nameKey       String
  descriptionKey String?
  code          String?   @unique  // 优惠码
  type          PromotionType
  value         Decimal   @db.Decimal(10,2) // 折扣值
  minPurchase   Decimal?  @db.Decimal(10,2) // 最低消费
  maxDiscount   Decimal?  @db.Decimal(10,2) // 最高折扣
  startDate     DateTime
  endDate       DateTime
  usageLimit    Int?      // 总使用次数限制
  usageCount    Int       @default(0)
  perUserLimit  Int       @default(1) // 每人使用次数
  isActive      Boolean   @default(true)
  applicablePlans Json?   // 适用的方案ID列表
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([code])
  @@index([isActive, startDate, endDate])
  @@map("promotions")
}

enum PromotionType {
  PERCENTAGE_OFF    // 百分比折扣（如15% off）
  FIXED_AMOUNT_OFF  // 固定金额折扣（如减10元）
  FREE_TRIAL        // 免费试用（如7天免费）
  BUNDLE            // 捆绑销售（如买一送一）
}
```

#### 2.2.9 更新现有模型

**更新 Membership 模型**（保留向后兼容）：

```prisma
model Membership {
  id        String   @id @default(uuid())
  userId    String
  plan      String   @default("MONTHLY")
  status    String   @default("ACTIVE")
  startedAt DateTime @default(now())
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("memberships")
}
```

**更新 Story, Course, Dialogue 等模型**（添加产品关联字段）：

```prisma
model Story {
  // ... existing fields
  isPremium   Boolean  @default(false)
  accessTier  String   @default("STANDARD") // STANDARD, PREMIUM, VIP
  previewContent String? // 预览内容（部分音频URL）
  previewDuration Int?  // 预览时长（秒）
  // ... relations
}

model Course {
  // ... existing fields
  isPremium   Boolean  @default(false)
  accessTier  String   @default("STANDARD")
  previewLessons Int   @default(0) // 预览课程数
  // ... relations
}
```

---

## 3. API 设计

### 3.1 会员方案管理

#### GET /api/membership/plans
获取可用订阅方案列表

**响应**：
```json
{
  "plans": [
    {
      "id": "plan_monthly",
      "planKey": "monthly",
      "nameKey": "membership.plan.monthly",
      "currentPrice": 28,
      "originalPrice": 38,
      "currency": "CNY",
      "period": "/月",
      "durationDays": 30,
      "isRecommended": false,
      "savingPercent": null,
      "features": [...],
      "notIncluded": [...]
    }
  ]
}
```

#### GET /api/membership/plans/:planKey
获取特定方案详情

#### GET /api/membership/current
获取当前用户订阅状态

**响应**：
```json
{
  "active": true,
  "subscription": {
    "id": "sub_xxx",
    "plan": {
      "id": "plan_quarterly",
      "nameKey": "membership.plan.quarterly",
      "currentPrice": 68
    },
    "status": "ACTIVE",
    "currentPeriodStart": "2026-04-01T00:00:00Z",
    "currentPeriodEnd": "2026-07-01T00:00:00Z",
    "autoRenew": true,
    "benefits": [
      {
        "benefitKey": "all_stories",
        "nameKey": "benefit.allStories",
        "type": "CONTENT_ACCESS",
        "accessLevel": "FULL"
      }
    ]
  },
  "expiresAt": "2026-07-01T00:00:00Z"
}
```

### 3.2 订阅管理

#### POST /api/membership/subscribe
创建新订阅

**请求**：
```json
{
  "planId": "plan_quarterly",
  "promotionCode": "SUMMER2026",
  "paymentMethod": "WECHAT"
}
```

**响应**：
```json
{
  "order": {
    "id": "order_xxx",
    "orderNo": "ORD20260504001",
    "totalAmount": 68,
    "discountAmount": 10,
    "finalAmount": 58,
    "status": "PENDING",
    "paymentParams": {
      "wechat": { "prepayId": "xxx" }
    }
  },
  "subscription": {
    "id": "sub_xxx",
    "status": "PENDING_ACTIVATION"
  }
}
```

#### POST /api/membership/subscription/:id/cancel
取消订阅

**请求**：
```json
{
  "reason": "too_expensive",
  "feedback": "价格太贵"
}
```

#### POST /api/membership/subscription/:id/pause
暂停订阅

#### POST /api/membership/subscription/:id/resume
恢复订阅

#### GET /api/membership/subscription/:id/renewal-preview
获取续费预览

### 3.3 订单管理

#### GET /api/membership/orders
获取订单列表

**查询参数**：
- `status`: 订单状态过滤
- `page`, `limit`: 分页
- `startDate`, `endDate`: 日期范围

#### GET /api/membership/orders/:orderNo
获取订单详情

#### POST /api/membership/orders/:orderNo/refund
申请退款

### 3.4 权益查询

#### GET /api/membership/benefits
获取当前用户的所有权益

**响应**：
```json
{
  "benefits": [
    {
      "benefitKey": "all_stories",
      "nameKey": "benefit.allStories",
      "type": "CONTENT_ACCESS",
      "products": [
        { "type": "STORY", "accessLevel": "FULL" }
      ],
      "usage": {
        "used": 45,
        "limit": null,
        "period": null
      }
    },
    {
      "benefitKey": "expert_consultations",
      "nameKey": "benefit.expertConsultations",
      "type": "SERVICE",
      "usage": {
        "used": 2,
        "limit": 5,
        "period": "monthly"
      }
    }
  ]
}
```

#### GET /api/membership/check-access
检查内容访问权限

**请求**：
```json
{
  "productType": "STORY",
  "productId": "story_xxx"
}
```

**响应**：
```json
{
  "hasAccess": true,
  "accessLevel": "FULL",
  "reason": "active_subscription",
  "remainingUses": null
}
```

### 3.5 促销管理

#### POST /api/membership/promotions/validate
验证优惠码

**请求**：
```json
{
  "code": "SUMMER2026",
  "planId": "plan_quarterly"
}
```

**响应**：
```json
{
  "valid": true,
  "discount": {
    "type": "PERCENTAGE_OFF",
    "value": 15,
    "finalPrice": 57.8
  }
}
```

---

## 4. 权限检查机制

### 4.1 权限检查流程

```
用户请求内容
    ↓
检查产品类型和ID
    ↓
查询用户活跃订阅
    ↓
查询订阅关联的权益
    ↓
检查产品-权益关联
    ↓
返回访问结果
```

### 4.2 中间件实现

```typescript
// middleware/membershipAuthorization.ts
export async function requireMembership(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.userId;
  const { productType, productId } = request.query as {
    productType: ProductType;
    productId: string;
  };

  const accessResult = await checkContentAccess(userId, productType, productId);

  if (!accessResult.hasAccess) {
    throw customError(
      'MEMBERSHIP_REQUIRED',
      accessResult.reason,
      403
    );
  }

  request.accessLevel = accessResult.accessLevel;
}

async function checkContentAccess(
  userId: string,
  productType: ProductType,
  productId: string
): Promise<AccessCheckResult> {
  // 1. 获取用户活跃订阅
  const subscription = await getActiveSubscription(userId);
  if (!subscription) {
    return { hasAccess: false, reason: 'no_active_subscription' };
  }

  // 2. 检查产品是否需要会员
  const product = await getProduct(productType, productId);
  if (!product.isPremium) {
    return { hasAccess: true, accessLevel: 'FULL' };
  }

  // 3. 查询订阅权益
  const benefits = await getSubscriptionBenefits(subscription.id);

  // 4. 检查是否有对应产品类型的访问权益
  const relevantBenefit = benefits.find(
    b => b.productType === productType &&
         (b.productId === productId || b.productId === null)
  );

  if (!relevantBenefit) {
    return { hasAccess: false, reason: 'benefit_not_granted' };
  }

  return {
    hasAccess: true,
    accessLevel: relevantBenefit.accessLevel
  };
}
```

### 4.3 内容标记策略

| 内容类型 | isPremium | accessTier | 访问控制 |
|---------|-----------|-------------|----------|
| 免费故事 | false | STANDARD | 完全开放 |
| 会员故事 | true | PREMIUM | 仅VIP |
| 免费课程 | false | STANDARD | 预览2节课 |
| 会员课程 | true | PREMIUM | 全课程 |
| 专家咨询 | true | VIP | 限次VIP |

---

## 5. 数据库迁移计划

### Phase 1: 基础表结构

```sql
-- 1. 创建定价方案表
CREATE TABLE pricing_plans (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  plan_key TEXT NOT NULL UNIQUE,
  name_key TEXT NOT NULL,
  description_key TEXT,
  original_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  duration_days INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_recommended BOOLEAN DEFAULT false,
  saving_percent INTEGER,
  features TEXT, -- JSON
  not_included TEXT, -- JSON
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建权益表
CREATE TABLE benefits (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  benefit_key TEXT NOT NULL UNIQUE,
  name_key TEXT NOT NULL,
  description_key TEXT,
  type TEXT NOT NULL CHECK (type IN ('CONTENT_ACCESS', 'FEATURE', 'SERVICE')),
  value TEXT, -- JSON
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建订阅表
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAUSED', 'PENDING')),
  current_period_start DATETIME NOT NULL,
  current_period_end DATETIME NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at DATETIME,
  termination_reason TEXT,
  external_sub_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES pricing_plans(id)
);

-- 4. 创建产品权益关联表
CREATE TABLE product_benefits (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  benefit_id TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('STORY', 'COURSE', 'LESSON', 'DIALOGUE', 'BREATHING_EXERCISE', 'WHITE_NOISE', 'EXPERT_CONSULTATION', 'ARTICLE')),
  product_id TEXT,
  access_level TEXT NOT NULL DEFAULT 'FULL' CHECK (access_level IN ('FULL', 'LIMITED', 'PREVIEW')),
  limit_quantity INTEGER,
  limit_period TEXT,
  is_grant_by_default BOOLEAN DEFAULT true,
  conditions TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (benefit_id) REFERENCES benefits(id) ON DELETE CASCADE
);

-- 5. 创建订阅权益记录表
CREATE TABLE subscription_benefits (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  subscription_id TEXT NOT NULL,
  benefit_id TEXT NOT NULL,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  usage_count INTEGER DEFAULT 0,
  usage_limit INTEGER,
  usage_period TEXT,
  last_used_at DATETIME,
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (benefit_id) REFERENCES benefits(id)
);

-- 6. 创建订单表
CREATE TABLE orders (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  order_no TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIAL_REFUND', 'EXPIRED')),
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  payment_method TEXT,
  payment_channel TEXT,
  transaction_id TEXT,
  paid_at DATETIME,
  expired_at DATETIME,
  completed_at DATETIME,
  cancelled_at DATETIME,
  cancel_reason TEXT,
  refund_amount DECIMAL(10,2),
  refunded_at DATETIME,
  refund_reason TEXT,
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. 创建支付流水表
CREATE TABLE payment_transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  order_id TEXT,
  subscription_id TEXT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PAYMENT', 'REFUND', 'RENEWAL')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  payment_method TEXT,
  transaction_id TEXT,
  gateway_response TEXT, -- JSON
  failure_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 8. 创建订单项表
CREATE TABLE order_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  order_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  plan_snapshot TEXT NOT NULL, -- JSON
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES pricing_plans(id)
);

-- 9. 创建促销表
CREATE TABLE promotions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  name_key TEXT NOT NULL,
  description_key TEXT,
  code TEXT UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('PERCENTAGE_OFF', 'FIXED_AMOUNT_OFF', 'FREE_TRIAL', 'BUNDLE')),
  value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  applicable_plans TEXT, -- JSON
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_external_sub_id ON subscriptions(external_sub_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_active_dates ON promotions(is_active, start_date, end_date);
CREATE INDEX idx_product_benefits_type_id ON product_benefits(product_type, product_id);
```

### Phase 2: 数据初始化

```sql
-- 插入定价方案
INSERT INTO pricing_plans (id, plan_key, name_key, original_price, current_price, duration_days, sort_order, is_recommended, saving_percent, features, not_included) VALUES
('plan_monthly', 'monthly', 'membership.plan.monthly', 38.00, 28.00, 30, 1, false, null, '["allStories", "adFree", "unlimitedBreathing", "premiumSupport"]', '["familySharing", "exclusiveContent"]'),
('plan_quarterly', 'quarterly', 'membership.plan.quarterly', 84.00, 68.00, 90, 2, true, 19, '["allStories", "adFree", "unlimitedBreathing", "premiumSupport", "exclusiveContent"]', '["familySharing"]'),
('plan_yearly', 'yearly', 'membership.plan.yearly', 336.00, 198.00, 365, 3, false, 41, '["allStories", "adFree", "unlimitedBreathing", "premiumSupport", "familySharing", "exclusiveContent"]', '[]');

-- 插入权益
INSERT INTO benefits (id, benefit_key, name_key, description_key, type, value) VALUES
('benefit_all_stories', 'all_stories', 'benefit.allStories', 'benefit.allStoriesDesc', 'CONTENT_ACCESS', '{"productTypes": ["STORY"]}'),
('benefit_all_courses', 'all_courses', 'benefit.allCourses', 'benefit.allCoursesDesc', 'CONTENT_ACCESS', '{"productTypes": ["COURSE", "LESSON"]}'),
('benefit_ad_free', 'ad_free', 'benefit.adFree', 'benefit.adFreeDesc', 'FEATURE', null),
('benefit_unlimited_breathing', 'unlimited_breathing', 'benefit.unlimitedBreathing', 'benefit.unlimitedBreathingDesc', 'FEATURE', null),
('benefit_premium_support', 'premium_support', 'benefit.premiumSupport', 'benefit.premiumSupportDesc', 'SERVICE', '{"monthlyLimit": 5}'),
('benefit_exclusive_content', 'exclusive_content', 'benefit.exclusiveContent', 'benefit.exclusiveContentDesc', 'CONTENT_ACCESS', '{"productTypes": ["STORY", "COURSE"]}'),
('benefit_family_sharing', 'family_sharing', 'benefit.familySharing', 'benefit.familySharingDesc', 'FEATURE', '{"maxMembers": 5}');

-- 插入产品权益关联（默认授予的权益）
INSERT INTO product_benefits (id, benefit_id, product_type, product_id, access_level, is_grant_by_default) VALUES
('pb_all_stories', 'benefit_all_stories', 'STORY', NULL, 'FULL', true),
('pb_all_courses', 'benefit_all_courses', 'COURSE', NULL, 'FULL', true);
```

### Phase 3: 代码适配

- 更新 `membershipRoutes.ts` 使用新数据模型
- 实现权益检查服务 `BenefitService.ts`
- 实现订阅管理服务 `SubscriptionService.ts`
- 实现订单服务 `OrderService.ts`
- 更新前端会员页面

---

## 6. 实施计划

### 阶段一：基础架构（1-2天）

| 任务 | 负责人 | 工期 | 依赖 |
|------|--------|------|------|
| 创建数据库迁移脚本 | 后端 | 0.5天 | - |
| 更新Prisma schema | 后端 | 0.5天 | 迁移脚本 |
| 实现PricingPlan CRUD | 后端 | 0.5天 | schema |
| 实现Benefit CRUD | 后端 | 0.5天 | schema |

### 阶段二：订阅系统（2-3天）

| 任务 | 负责人 | 工期 | 依赖 |
|------|--------|------|------|
| 实现Subscription服务 | 后端 | 1天 | 阶段一 |
| 实现订阅API端点 | 后端 | 1天 | Subscription服务 |
| 实现权益检查中间件 | 后端 | 1天 | Benefit服务 |

### 阶段三：订单系统（2-3天）

| 任务 | 负责人 | 工期 | 依赖 |
|------|--------|------|------|
| 实现Order服务 | 后端 | 1天 | 阶段一 |
| 实现促销系统 | 后端 | 1天 | Order服务 |
| 实现支付集成 | 后端 | 1-2天 | Order服务 |

### 阶段四：前端集成（2-3天）

| 任务 | 负责人 | 工期 | 依赖 |
|------|--------|------|------|
| 更新会员页面 | 前端 | 1天 | API就绪 |
| 实现权益展示组件 | 前端 | 1天 | API就绪 |
| 集成订阅流程 | 前端 | 1天 | API就绪 |

### 阶段五：测试与部署（1-2天）

| 任务 | 负责人 | 工期 | 依赖 |
|------|--------|------|------|
| 单元测试 | 后端 | 0.5天 | 所有代码 |
| 集成测试 | 全栈 | 0.5天 | 前后端完成 |
| 部署上线 | DevOps | 0.5天 | 测试通过 |

---

## 7. 风险评估与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 支付集成复杂度 | 高 | 中 | 使用第三方支付SDK封装 |
| 数据迁移丢失 | 高 | 低 | 提前备份，灰度迁移 |
| 权益检查性能 | 中 | 中 | 缓存热点数据 |
| 历史数据兼容 | 中 | 低 | 保留Membership表，双写 |
| 并发订阅问题 | 中 | 中 | 数据库事务 + 幂等性设计 |

---

## 8. 成本估算

| 资源 | 数量 | 单价 | 周期 | 小计 |
|------|------|------|------|------|
| 后端开发 | 1人 | ¥1500/人天 | 6天 | ¥9,000 |
| 前端开发 | 1人 | ¥1500/人天 | 4天 | ¥6,000 |
| 测试 | 0.5人 | ¥1200/人天 | 2天 | ¥1,200 |
| 合计 | | | | **¥16,200** |

---

## 9. 后续优化方向

1. **家庭共享**：支持一个账号多个儿童档案
2. **积分体系**：消费返积分，积分抵现金
3. **推荐奖励**：老用户推荐新用户得优惠
4. **内容试用**：部分高级内容限次试用
5. **智能推荐**：基于使用习惯推荐会员方案

---

*文档结束*
