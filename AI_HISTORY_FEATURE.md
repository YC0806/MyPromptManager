# AI History 功能文档

## 概述

AI History 是 MyPromptManager 的新增功能，允许用户通过浏览器插件从主流 AI 提供商（ChatGPT、DeepSeek、Claude、Gemini）的网页前端自动提取对话历史，并在 MyPromptManager 网页版中统一管理和浏览。

## 功能架构

### 1. 浏览器插件（Browser Extension）

**位置**：`browser-extension/`

**组成部分**：

- **Manifest V3**：`manifest.json` - 插件配置文件
- **Background Service Worker**：`background.js` - 处理数据同步和存储
- **Popup UI**：`popup.html` + `popup.js` - 用户交互界面
- **Content Scripts**：`content-scripts/` - 针对不同 AI 提供商的提取逻辑
  - `chatgpt.js` - ChatGPT 对话提取
  - `deepseek.js` - DeepSeek 对话提取
  - `claude.js` - Claude 对话提取
  - `gemini.js` - Gemini 对话提取

**主要功能**：

1. 自动检测当前访问的 AI 提供商
2. 从页面 DOM 中提取对话历史
3. 保存到浏览器本地存储
4. 同步到 MyPromptManager 后端 API

### 2. 后端 API（Backend）

**位置**：`apps/api/views.py` + `apps/core/services/file_storage_service.py`

**新增 API 端点**：

- `GET /api/v1/ai-histories` - 获取 AI 对话历史列表
- `POST /api/v1/ai-histories` - 创建/更新 AI 对话历史
- `GET /api/v1/ai-histories/{id}` - 获取单个对话详情
- `PUT /api/v1/ai-histories/{id}` - 更新对话历史
- `DELETE /api/v1/ai-histories/{id}` - 删除对话历史

**数据存储**：

- 位置：`{GIT_REPO_ROOT}/ai-histories/`
- 格式：JSON 文件
- 命名规则：`history_{provider}_{conversation_id}-{history_id}.json`

**智能去重**：

通过 `provider` + `conversation_id` 组合检测重复，相同对话会自动更新而不是重复创建。

### 3. 前端页面（Frontend）

**位置**：`frontend/src/pages/`

**新增页面**：

- `AIHistoriesList.jsx` - AI 对话历史列表页
- `AIHistoryDetail.jsx` - AI 对话历史详情页

**设计特点**：

- 与现有 Prompts、Templates、Chats 页面风格保持一致
- 使用 Tailwind CSS + Radix UI 组件
- 支持表格/卡片两种视图模式
- 支持按提供商过滤
- 提供消息复制、对话导出功能

## 数据流程

```
AI 提供商网站（ChatGPT/DeepSeek/Claude/Gemini）
    ↓
Content Script 提取对话
    ↓
Background Service Worker 处理
    ↓
Chrome Storage（本地存储）
    ↓
REST API 同步（可选自动/手动）
    ↓
FileStorageService（文件系统存储）
    ↓
Frontend 页面展示
```

## 使用场景

### 场景 1：研究人员

研究人员在使用多个 AI 工具进行实验时，需要保存所有对话历史用于后续分析。

1. 安装浏览器插件
2. 开启自动同步
3. 正常使用各个 AI 工具
4. 所有对话自动保存到 MyPromptManager
5. 在网页版中统一查看、搜索、分析

### 场景 2：内容创作者

内容创作者使用 AI 辅助写作，需要保存灵感和草稿。

1. 与 AI 进行头脑风暴
2. 手动点击"提取当前对话"保存重要对话
3. 在 MyPromptManager 中查看历史对话
4. 复制有价值的内容用于创作

### 场景 3：开发者

开发者使用 AI 辅助编程，需要保存技术讨论和代码片段。

1. 使用 AI 解决技术问题
2. 对话自动同步到 MyPromptManager
3. 按提供商分类查看
4. 导出为 JSON 格式备份

## 技术细节

### 对话提取策略

不同 AI 提供商的页面结构不同，需要针对性的提取策略：

**ChatGPT**：
```javascript
// 基于 data-message-author-role 属性提取
const messageElements = document.querySelectorAll('[data-message-author-role]')
```

**DeepSeek**：
```javascript
// 基于类名模糊匹配
const messageElements = document.querySelectorAll('[class*="message"]')
// 通过子元素判断角色
```

**Claude**：
```javascript
// 基于 Claude 特定的类名
const messageElements = document.querySelectorAll('[class*="Message"]')
```

**Gemini**：
```javascript
// 基于 Google 的命名规范
const messageElements = document.querySelectorAll('[class*="turn"]')
```

### 数据模型

```typescript
interface AIHistory {
  id: string                    // ULID
  provider: string              // "ChatGPT" | "DeepSeek" | "Claude" | "Gemini"
  conversation_id: string       // 提供商的对话 ID
  title: string                 // 对话标题
  messages: Message[]           // 消息列表
  metadata: {
    url: string                 // 原始对话 URL
    extractedAt: string         // 提取时间
    messageCount: number        // 消息数量
  }
  created_at: string            // 创建时间
  updated_at: string            // 更新时间
}

interface Message {
  role: "user" | "assistant"    // 角色
  content: string               // 内容
  timestamp: string | null      // 时间戳（如果可用）
  index: number                 // 消息序号
}
```

### 安全性考虑

1. **本地优先**：数据先保存到浏览器本地存储
2. **自托管**：同步到用户自己的服务器，不经过第三方
3. **权限最小化**：只请求必要的浏览器权限
4. **域名限制**：只在特定的 AI 提供商域名上运行
5. **开源透明**：所有代码开源，可审查

### 性能优化

1. **延迟提取**：页面加载后延迟 3 秒再提取，确保内容完全加载
2. **增量同步**：只同步新的或更新的对话
3. **后台处理**：使用 Service Worker 在后台处理同步
4. **批量操作**：支持批量同步多个对话

## 安装和配置

### 1. 后端配置

后端无需额外配置，AI History 功能已集成到现有架构中。

确保后端服务运行：
```bash
python manage.py runserver
```

### 2. 前端配置

前端无需额外配置，页面和路由已自动添加。

启动前端开发服务器：
```bash
cd frontend
npm run dev
```

### 3. 浏览器插件安装

1. 打开浏览器扩展程序页面
2. 开启"开发者模式"
3. 加载 `browser-extension` 目录
4. 配置 API 地址（默认：`http://localhost:8000/api/v1`）

详见：`browser-extension/README.md`

## 未来计划

### 短期计划

- [ ] 添加插件图标
- [ ] 支持对话标签功能
- [ ] 添加全文搜索
- [ ] 支持对话导出为 Markdown

### 中期计划

- [ ] 支持 Firefox 浏览器
- [ ] 添加对话统计和可视化
- [ ] 支持更多 AI 提供商（文心一言、通义千问等）
- [ ] 支持对话分享功能

### 长期计划

- [ ] 移动端支持
- [ ] 对话分析和洞察
- [ ] AI 对话质量评分
- [ ] 多用户协作功能

## 常见问题

### Q: 插件会收集我的对话数据吗？

A: 不会。所有数据都存储在你的浏览器本地和你自己的 MyPromptManager 服务器上，不会发送到任何第三方服务器。

### Q: 如果 AI 提供商更新了页面怎么办？

A: 如果页面结构变化导致提取失败，我们会及时更新插件。你也可以自行修改对应的 content script。

### Q: 可以选择性地提取对话吗？

A: 可以。你可以关闭"自动同步"，然后手动点击"提取当前对话"来选择性保存。

### Q: 数据存储在哪里？

A: 浏览器本地存储在 Chrome Storage，服务器端存储在 `{GIT_REPO_ROOT}/ai-histories/` 目录下的 JSON 文件中。

### Q: 支持哪些浏览器？

A: 目前支持 Chrome 和基于 Chromium 的浏览器（如 Edge、Brave）。Firefox 支持计划中。

## 贡献指南

欢迎贡献代码！以下是一些贡献方向：

1. **添加新的 AI 提供商支持**
2. **改进对话提取逻辑**
3. **优化前端界面**
4. **增加新功能**
5. **修复 Bug**
6. **完善文档**

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 GitHub Issue。
