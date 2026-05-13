# 分享功能测试验证文档

## 测试范围

### 家长端页面
- [x] ArticleDetailScreen - 文章详情页分享

### 儿童端页面
- [x] StoryPlayerScreen - 故事播放器分享

## 测试用例

### 1. 文章详情页分享 (ArticleDetailScreen)

| 测试步骤 | 预期结果 | 实际结果 | 状态 |
|---------|---------|---------|------|
| 1. 打开文章详情页 | 页面正常加载，分享按钮可见 | - | 待测试 |
| 2. 点击分享按钮 | 弹出原生分享对话框 | - | 待测试 |
| 3. 选择分享平台（如微信） | 跳转到对应平台 | - | 待测试 |
| 4. 完成分享 | 分享按钮变为成功状态（绿色对勾） | - | 待测试 |
| 5. 取消分享 | 分享按钮状态不变 | - | 待测试 |
| 6. 重复点击分享 | 分享中状态下按钮禁用 | - | 待测试 |

### 2. 故事播放器分享 (StoryPlayerScreen)

| 测试步骤 | 预期结果 | 实际结果 | 状态 |
|---------|---------|---------|------|
| 1. 打开故事播放器 | 页面正常加载，分享按钮可见 | - | 待测试 |
| 2. 点击分享按钮 | 弹出原生分享对话框 | - | 待测试 |
| 3. 选择分享平台 | 跳转到对应平台 | - | 待测试 |
| 4. 完成分享 | 分享按钮变为成功状态（绿色对勾），2秒后恢复 | - | 待测试 |
| 5. 取消分享 | 分享按钮状态不变 | - | 待测试 |

## 功能一致性检查

| 检查项 | ArticleDetailScreen | StoryPlayerScreen | 一致性 |
|-------|---------------------|-------------------|--------|
| 分享模块导入 | useShare from '../../utils/share' | useShare from '../../utils/share' | ✅ |
| 分享方法 | shareNative(options) | shareNative(options) | ✅ |
| 加载状态 | isLoading: isSharing | isLoading: isSharing | ✅ |
| 成功状态 | shareSuccess state | shareSuccess state | ✅ |
| 成功图标 | Check (green) | Check (green) | ✅ |
| 成功状态时长 | 2秒 | 2秒 | ✅ |
| 分享选项结构 | { title, description, url } | { title, description, url, imageUrl } | ✅ |

## 布局兼容性检查

| 屏幕尺寸 | 检查项 | 预期结果 |
|---------|--------|---------|
| 小屏手机 (< 360px) | 分享按钮布局 | 按钮不重叠，可正常点击 |
| 中等屏幕 (360-414px) | 分享按钮布局 | 按钮布局合理 |
| 大屏手机 (> 414px) | 分享按钮布局 | 按钮布局合理 |
| 平板 | 分享按钮布局 | 按钮布局合理 |

## API调用验证

| 接口 | 方法 | 参数 | 预期响应 |
|------|------|------|---------|
| /api/v1/stories/{id}/share | POST | { platform?: string } | { success: true, shareId: string } |
| /api/v1/articles/{id}/share | POST | { platform?: string } | { success: true, shareId: string } |

## 测试环境

- iOS: 测试版本 15+
- Android: 测试版本 11+
- React Native: 0.72+

## 测试完成标准

1. 所有页面分享按钮正常显示
2. 分享对话框正常弹出
3. 分享成功后状态正确更新
4. API调用成功记录分享
5. 无布局错乱或交互问题


/**
 * 关键差异说明：
 *
 * 1. 【微信】
 *    - 系统分享面板 → 微信：只能分享纯文本或单张图片
 *    - 要实现"卡片式分享"（带标题+描述+缩略图+链接），
 *      必须集成微信开放平台 SDK (react-native-wechat-lib)
 *    - 朋友圈只支持图片 + 文字，不支持纯 URL 分享
 *    - 小程序分享需要独立的 MiniApp SDK
 *
 * 2. 【WhatsApp】
 *    - message 和 url 都会作为文本内容展示
 *    - 图片分享会直接作为图片消息发送
 *    - 不支持"富媒体卡片"
 *
 * 3. 【Instagram】
 *    - 文本消息几乎无用（Instagram 不展示外部文本）
 *    - 只接受图片/视频（Stories 或 Feed）
 *    - 需要通过 Instagram Content Publishing API
 *
 * 4. 【Twitter/X】
 *    - 文本有字符限制（280字）
 *    - 图片最多4张
 *    - URL 会被自动 t.co 缩短
 *    - 通过系统分享：text 和 URL 合并为推文内容
 *
 * 5. 【邮件】
 *    - 最完整的支持：subject、body、attachments 都有效
 *    - iOS 的 UIActivityViewController 自动提供邮件选项
 *    - 可携带多个附件
 *
 * 6. 【短信 iMessage】
 *    - 只接受纯文本
 *    - URL 会自动被系统识别为可点击链接
 *    - 不支持附件（需要 MMS，受运营商限制）
 */
