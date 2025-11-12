# 浏览器插件 API 集成说明

## 概述

本文档说明了浏览器插件与 MyPromptManager 后端 API 的集成方式。

**重要**: 从 v1.1 开始，AI Histories 已合并到 Chats API。浏览器插件现在使用统一的 `/v1/chats` 端点来存储从各 AI 提供商提取的对话历史。

## API 端点

### 基础 URL
- **开发环境**: `http://localhost:8000/v1`
- **生产环境**: 根据部署配置

### Chats 端点（用于浏览器插件）

#### 1. 创建/更新对话记录
```
POST /v1/chats
```

**请求体**:
```json
{
  "provider": "ChatGPT",
  "conversation_id": "unique-conversation-id",
  "title": "对话标题",
  "messages": [
    {
      "role": "user",
      "content": "用户消息",
      "timestamp": null,
      "index": 0
    },
    {
      "role": "assistant",
      "content": "AI回复",
      "timestamp": null,
      "index": 1
    }
  ],
  "metadata": {
    "url": "https://...",
    "extracted_at": "2024-01-01T00:00:00Z",
    "messageCount": 2
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**响应**（创建新对话）:
```json
{
  "id": "01K9QCNP996X3CYQWW8W2J89J2",
  "created_at": "2024-01-01T00:00:00Z",
  "message": "Chat created"
}
```

**响应**（更新已有对话）:
```json
{
  "id": "01K9QCNP996X3CYQWW8W2J89J2",
  "updated_at": "2024-01-01T00:00:00Z",
  "message": "Chat updated"
}
```

**说明**:
- **自动去重**: 如果 `provider` + `conversation_id` 组合已存在，会自动更新现有记录而不是创建新记录
- `provider` 必需，支持的值：ChatGPT, DeepSeek, Claude, Gemini 等
- `conversation_id` 必需，用于去重标识
- `title` 必需
- `messages` 可选，默认为空数组
- `metadata` 可选，存储额外信息（如原始 URL、提取时间等）

#### 2. 获取对话列表
```
GET /v1/chats?provider=ChatGPT&limit=100
```

**查询参数**:
- `provider`: 按提供商过滤（可选）
- `limit`: 返回数量限制，默认 100

**响应**:
```json
{
  "chats": [...],
  "count": 10,
  "total": 10
}
```

#### 3. 获取单个对话
```
GET /v1/chats/{chat_id}
```

**响应**: 返回完整的对话记录对象

#### 4. 更新对话
```
PUT /v1/chats/{chat_id}
```

**请求体**: 与 POST 相同

#### 5. 删除对话
```
DELETE /v1/chats/{chat_id}
```

**响应**: HTTP 204 No Content

#### 6. 健康检查
```
GET /v1/health
```

**响应**:
```json
{
  "status": "healthy",
  "storage": {
    "healthy": true
  },
  "index": {
    "healthy": true,
    "prompts_count": 7,
    "templates_count": 6,
    "chats_count": 16,
    "last_updated": "2025-11-09T12:51:46.203725",
    "index_size_bytes": 15394
  }
}
```

## 插件实现

### 数据流程

1. **用户触发提取** (手动或自动)
   - 用户点击"提取当前对话"按钮
   - 或页面加载后自动触发（如果启用自动同步）

2. **Content Script 提取数据**
   - 解析页面 DOM
   - 提取对话 ID、标题、消息列表
   - 构建标准化数据格式

3. **发送到 Background Script**
   - Content Script 将数据发送给 Background
   - Background 先保存到本地存储

4. **同步到后端**
   - 如果启用自动同步，立即发送 POST 请求到 `/v1/chats`
   - 后端自动处理去重（相同 provider + conversation_id 会更新）

### 关键代码

#### Background Script ([background.js](background.js:76-110))

```javascript
async function syncToBackend(conversationData, apiUrl) {
  const now = new Date().toISOString();
  const response = await fetch(`${apiUrl}/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider: conversationData.provider,
      conversation_id: conversationData.conversationId,
      title: conversationData.title,
      messages: conversationData.messages || [],
      metadata: {
        ...(conversationData.metadata || {}),
        extracted_at: now,
      },
      created_at: now,
      updated_at: now,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}
```

#### Content Script 数据格式

所有 Content Script 都遵循相同的数据格式：

```javascript
{
  provider: 'ChatGPT',
  conversationId: 'abc123',
  title: '对话标题',
  messages: [
    {
      role: 'user',
      content: '消息内容',
      timestamp: null,
      index: 0
    }
  ],
  metadata: {
    url: window.location.href,
    extractedAt: new Date().toISOString(),
    messageCount: messages.length
  }
}
```

## 测试

运行测试脚本验证 API 集成：

```bash
cd browser-extension
./test_api.sh
```

测试涵盖：
- ✅ 健康检查
- ✅ 创建新对话
- ✅ 获取对话列表
- ✅ 获取单个对话
- ✅ 更新对话
- ✅ 去重处理（相同 provider + conversation_id）
- ✅ 按提供商过滤

## 错误处理

### 插件端

- 网络错误：显示友好错误消息，数据保留在本地
- API 错误：解析错误响应，显示具体错误信息
- 本地存储错误：使用 try-catch 捕获并记录

### 后端

- 400 Bad Request：缺少必需字段（title）
- 404 Not Found：对话记录不存在
- 500 Internal Server Error：服务器内部错误

## 配置

用户可在插件设置中配置：

- **API URL**: 后端服务地址（默认：`http://localhost:8000/v1`）
- **自动同步**: 是否自动提取和同步对话
- **同步间隔**: 定期同步的时间间隔（分钟）

配置保存在 Chrome Storage Sync 中，会跨设备同步。

## 迁移说明

### 从 AI Histories 迁移到 Chats

如果你之前使用过 `ai-histories` 端点，现在需要更新：

**旧版本**:
```javascript
fetch(`${apiUrl}/ai-histories`, { ... })
```

**新版本**:
```javascript
fetch(`${apiUrl}/chats`, { ... })
```

数据格式保持不变，只需要更改端点 URL。后端会自动处理去重逻辑。

### 数据存储位置变化

- **旧**: 数据存储在 `data/ai-histories/` 目录
- **新**: 数据存储在 `data/chats/` 目录

旧数据不会自动迁移。如需保留旧数据，可以手动迁移或同时保留两个目录。

## 隐私与安全

- ✅ 本地优先存储
- ✅ 用户可控的同步
- ✅ 自托管后端
- ✅ 无第三方服务
- ✅ HTTPS 支持（生产环境）

## 兼容性

- Chrome 88+
- Edge 88+
- 其他基于 Chromium 的浏览器
- Firefox（需修改为 Manifest V2）

## 后续优化

- [ ] 批量同步优化
- [ ] 增量更新（只同步新消息）
- [ ] 同步状态指示器
- [ ] 离线队列管理
- [ ] 错误重试机制
- [ ] 同步冲突解决
- [ ] 数据迁移工具（从 ai-histories 到 chats）

## 相关文件

- [background.js](background.js) - 后台服务和 API 通信
- [popup.js](popup.js) - 用户界面和配置管理
- [content-scripts/](content-scripts/) - 各平台的数据提取器
- [test_api.sh](test_api.sh) - API 集成测试脚本
- [README.md](README.md) - 完整使用文档

## 变更日志

### v1.1 (2025-11-10)
- ✅ AI Histories 合并到 Chats API
- ✅ 统一使用 `/v1/chats` 端点
- ✅ 保持自动去重功能
- ✅ 更新所有文档和测试脚本
