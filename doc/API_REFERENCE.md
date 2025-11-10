# MyPromptManager API Reference

完整的后端 REST API 文档，包含所有端点的请求和响应格式。

**Base URL**: `http://localhost:8000/v1`

**认证**: 本地开发环境无需认证（AllowAny）

**内容类型**: `application/json`

---

## 目录

- [Prompts API](#prompts-api)
- [Templates API](#templates-api)
- [Chats API](#chats-api)
- [Search API](#search-api)
- [Index Management API](#index-management-api)
- [Health Check API](#health-check-api)
- [数据模型](#数据模型)
- [错误响应](#错误响应)

---

## Prompts API

### 列出所有 Prompts

获取所有 prompts 列表，支持过滤和分页。

**端点**: `GET /v1/prompts`

**查询参数**:
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `labels` | array[string] | 否 | - | 按标签过滤（可多个） |
| `limit` | integer | 否 | 100 | 返回结果数量限制 |

**请求示例**:
```http
GET /v1/prompts?labels=support&labels=email&limit=50
```

**响应** (200 OK):
```json
{
  "prompts": [
    {
      "id": "01HQXYZ123ABC456DEF789",
      "title": "Personalized Support Reply",
      "description": "Auto-generate support replies based on context",
      "type": "prompt",
      "slug": "support-reply",
      "labels": ["support", "email"],
      "author": "jane.doe",
      "created_at": "2024-11-05T08:00:00Z",
      "updated_at": "2024-11-05T09:30:00Z",
      "version_id": "2024-11-05T09-30Z_A1B2C"
    }
  ],
  "count": 1,
  "total": 1
}
```

---

### 创建 Prompt

创建一个新的 prompt。

**端点**: `POST /v1/prompts`

**请求体**:
```json
{
  "content": "---\ntitle: Code Review Assistant\ndescription: Help review code for best practices\nslug: code-review\nlabels:\n  - development\n  - code-quality\nauthor: john.doe\n---\n\n# Code Review Prompt\n\nReview the following code and provide feedback on:\n- Code quality\n- Best practices\n- Potential bugs\n"
}
```

**字段说明**:
- `content` (string, required): 完整的 Markdown 内容，包含 YAML Front Matter
  - Front Matter 必须包含 `title` 字段
  - `slug` 可选，未提供时自动从 title 生成
  - `type` 会自动设置为 "prompt"
  - 时间戳会自动生成

**响应** (201 Created):
```json
{
  "id": "01HQZ8PQRS9TUV0WXYZ123",
  "version_id": "2024-11-09T10-15Z_X7Y8Z",
  "created_at": "2024-11-09T10:15:00Z"
}
```

---

### 获取 Prompt 详情

获取指定 prompt 的 HEAD 版本详情。

**端点**: `GET /v1/prompts/{prompt_id}`

**路径参数**:
- `prompt_id` (string, required): Prompt 的 ULID

**响应** (200 OK):
```json
{
  "id": "01HQXYZ123ABC456DEF789",
  "metadata": {
    "id": "01HQXYZ123ABC456DEF789",
    "title": "Personalized Support Reply",
    "description": "Auto-generate support replies based on context",
    "type": "prompt",
    "slug": "support-reply",
    "labels": ["support", "email"],
    "author": "jane.doe",
    "created_at": "2024-11-05T08:00:00Z",
    "updated_at": "2024-11-05T09:30:00Z"
  },
  "content": "# Reply Template\n\nDear {{customer_name}},\n\nThank you for reaching out...",
  "full_content": "---\nid: 01HQXYZ123ABC456DEF789\ntitle: Personalized Support Reply\n...\n---\n\n# Reply Template\n\nDear {{customer_name}}..."
}
```

**错误响应** (404 Not Found):
```json
{
  "detail": "Prompt 01HQXYZ123ABC456DEF789 not found"
}
```

---

### 更新 Prompt

更新 prompt 内容（创建新版本）。

**端点**: `PUT /v1/prompts/{prompt_id}`

**路径参数**:
- `prompt_id` (string, required): Prompt 的 ULID

**请求体**:
```json
{
  "content": "---\ntitle: Personalized Support Reply (Updated)\ndescription: Enhanced version with more options\nslug: support-reply\nlabels:\n  - support\n  - email\n  - automation\nauthor: jane.doe\n---\n\n# Enhanced Reply Template\n\nDear {{customer_name}},\n\n{{greeting}}\n\n..."
}
```

**响应** (200 OK):
```json
{
  "id": "01HQXYZ123ABC456DEF789",
  "version_id": "2024-11-09T11-20Z_M9N0P",
  "updated_at": "2024-11-09T11:20:00Z"
}
```

---

### 删除 Prompt

删除指定的 prompt（包括所有版本）。

**端点**: `DELETE /v1/prompts/{prompt_id}`

**路径参数**:
- `prompt_id` (string, required): Prompt 的 ULID

**响应** (204 No Content):
```
无响应体
```

---

### 列出 Prompt 版本

获取指定 prompt 的所有历史版本。

**端点**: `GET /v1/prompts/{prompt_id}/versions`

**路径参数**:
- `prompt_id` (string, required): Prompt 的 ULID

**响应** (200 OK):
```json
{
  "prompt_id": "01HQXYZ123ABC456DEF789",
  "versions": [
    {
      "version_id": "2024-11-09T11-20Z_M9N0P",
      "created_at": "2024-11-09T11:20:00Z",
      "file_path": "prompts/prompt_support-reply-01HQXYZ123ABC456DEF789/versions/pv_support-reply-01HQXYZ123ABC456DEF789_2024-11-09T11-20Z_M9N0P.md"
    },
    {
      "version_id": "2024-11-05T09-30Z_A1B2C",
      "created_at": "2024-11-05T09:30:00Z",
      "file_path": "prompts/prompt_support-reply-01HQXYZ123ABC456DEF789/versions/pv_support-reply-01HQXYZ123ABC456DEF789_2024-11-05T09-30Z_A1B2C.md"
    }
  ],
  "count": 2
}
```

---

### 获取特定版本的 Prompt

获取 prompt 的指定历史版本。

**端点**: `GET /v1/prompts/{prompt_id}/versions/{version_id}`

**路径参数**:
- `prompt_id` (string, required): Prompt 的 ULID
- `version_id` (string, required): 版本 ID（格式：`YYYY-MM-DDTHH-MMZ_XXXXX`）

**响应** (200 OK):
```json
{
  "prompt_id": "01HQXYZ123ABC456DEF789",
  "version_id": "2024-11-05T09-30Z_A1B2C",
  "metadata": {
    "id": "01HQXYZ123ABC456DEF789",
    "title": "Personalized Support Reply",
    "description": "Auto-generate support replies based on context",
    "type": "prompt",
    "slug": "support-reply",
    "labels": ["support", "email"],
    "author": "jane.doe",
    "created_at": "2024-11-05T08:00:00Z",
    "updated_at": "2024-11-05T09:30:00Z"
  },
  "content": "# Reply Template\n\nDear {{customer_name}}..."
}
```

---

## Templates API

Templates API 的端点结构与 Prompts API 完全相同，只需将 URL 中的 `prompts` 替换为 `templates`。

### 端点列表

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/v1/templates` | 列出所有 templates |
| POST | `/v1/templates` | 创建新 template |
| GET | `/v1/templates/{template_id}` | 获取 template 详情 |
| PUT | `/v1/templates/{template_id}` | 更新 template |
| DELETE | `/v1/templates/{template_id}` | 删除 template |
| GET | `/v1/templates/{template_id}/versions` | 列出 template 版本 |
| GET | `/v1/templates/{template_id}/versions/{version_id}` | 获取特定版本 |

**请求和响应格式与 Prompts API 相同**，唯一区别：
- 响应中的 `type` 字段为 `"template"`
- JSON key 使用 `template_id` 而非 `prompt_id`

---

## Chats API

### 列出所有 Chats

获取所有 chats 列表。

**端点**: `GET /v1/chats`

**查询参数**:
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `limit` | integer | 否 | 100 | 返回结果数量限制 |

**响应** (200 OK):
```json
{
  "chats": [
    {
      "id": "01HR1A2B3C4D5E6F7G8H9J",
      "title": "Product Feature Discussion",
      "description": "Discussion about new feature requirements",
      "tags": ["product", "features"],
      "created_at": "2024-11-08T10:00:00Z",
      "updated_at": "2024-11-08T15:30:00Z",
      "message_count": 15
    }
  ],
  "count": 1,
  "total": 1
}
```

---

### 创建 Chat

创建一个新的 chat。

**端点**: `POST /v1/chats`

**请求体**:
```json
{
  "title": "Project Planning Session",
  "description": "Planning for Q4 2024 roadmap",
  "tags": ["planning", "roadmap"],
  "messages": [
    {
      "role": "user",
      "content": "Let's discuss the Q4 roadmap",
      "timestamp": "2024-11-09T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "I'd be happy to help with that. What are the key priorities?",
      "timestamp": "2024-11-09T10:00:15Z"
    }
  ]
}
```

**字段说明**:
- `title` (string, required): Chat 标题
- `description` (string, optional): Chat 描述
- `tags` (array[string], optional): 标签列表
- `messages` (array[object], optional): 消息列表，默认为空数组
  - `role` (string): "user" 或 "assistant"
  - `content` (string): 消息内容
  - `timestamp` (string): ISO 8601 格式时间戳

**响应** (201 Created):
```json
{
  "id": "01HR2X3Y4Z5A6B7C8D9E0F",
  "created_at": "2024-11-09T10:00:00Z"
}
```

---

### 获取 Chat 详情

获取指定 chat 的完整信息。

**端点**: `GET /v1/chats/{chat_id}`

**路径参数**:
- `chat_id` (string, required): Chat 的 ULID

**响应** (200 OK):
```json
{
  "id": "01HR1A2B3C4D5E6F7G8H9J",
  "title": "Product Feature Discussion",
  "description": "Discussion about new feature requirements",
  "tags": ["product", "features"],
  "created_at": "2024-11-08T10:00:00Z",
  "updated_at": "2024-11-08T15:30:00Z",
  "messages": [
    {
      "role": "user",
      "content": "We need a new dashboard feature",
      "timestamp": "2024-11-08T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "What specific metrics should the dashboard show?",
      "timestamp": "2024-11-08T10:00:30Z"
    }
  ]
}
```

---

### 更新 Chat

更新 chat 信息或添加新消息。

**端点**: `PUT /v1/chats/{chat_id}`

**路径参数**:
- `chat_id` (string, required): Chat 的 ULID

**请求体**:
```json
{
  "title": "Product Feature Discussion (Updated)",
  "description": "Comprehensive feature planning",
  "tags": ["product", "features", "planning"],
  "messages": [
    {
      "role": "user",
      "content": "We need a new dashboard feature",
      "timestamp": "2024-11-08T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "What specific metrics should the dashboard show?",
      "timestamp": "2024-11-08T10:00:30Z"
    },
    {
      "role": "user",
      "content": "User engagement metrics and conversion rates",
      "timestamp": "2024-11-08T15:30:00Z"
    }
  ]
}
```

**响应** (200 OK):
```json
{
  "id": "01HR1A2B3C4D5E6F7G8H9J",
  "updated_at": "2024-11-09T11:00:00Z"
}
```

---

### 删除 Chat

删除指定的 chat。

**端点**: `DELETE /v1/chats/{chat_id}`

**路径参数**:
- `chat_id` (string, required): Chat 的 ULID

**响应** (204 No Content):
```
无响应体
```

---

## Search API

### 搜索所有内容

在 prompts、templates 和 chats 中搜索。

**端点**: `GET /v1/search`

**查询参数**:
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `type` | string | 否 | - | 过滤类型: "prompt", "template", "chat" |
| `labels` | array[string] | 否 | - | 按标签过滤（可多个） |
| `slug` | string | 否 | - | 按 slug 过滤 |
| `author` | string | 否 | - | 按作者过滤 |
| `limit` | integer | 否 | 50 | 返回结果数量限制 |
| `cursor` | string | 否 | - | 分页游标 |

**请求示例**:
```http
GET /v1/search?type=prompt&labels=support&author=jane.doe&limit=20
```

**响应** (200 OK):
```json
{
  "items": [
    {
      "id": "01HQXYZ123ABC456DEF789",
      "title": "Personalized Support Reply",
      "description": "Auto-generate support replies based on context",
      "type": "prompt",
      "slug": "support-reply",
      "labels": ["support", "email"],
      "author": "jane.doe",
      "created_at": "2024-11-05T08:00:00Z",
      "updated_at": "2024-11-05T09:30:00Z",
      "file_path": "prompts/prompt_support-reply-01HQXYZ123ABC456DEF789/versions/pv_...",
      "version_id": "2024-11-05T09-30Z_A1B2C"
    }
  ],
  "count": 1,
  "total": 1,
  "cursor": null
}
```

---

## Index Management API

### 获取索引状态

获取当前索引的状态信息。

**端点**: `GET /v1/index/status`

**响应** (200 OK):
```json
{
  "prompts_count": 42,
  "templates_count": 18,
  "chats_count": 7,
  "last_updated": "2024-11-09T10:30:00Z",
  "index_size_bytes": 15360
}
```

---

### 重建索引

从文件系统重建索引。

**端点**: `POST /v1/index/rebuild`

**请求体**: 无需请求体

**响应** (200 OK):
```json
{
  "status": "completed",
  "stats": {
    "prompts_indexed": 42,
    "templates_indexed": 18,
    "chats_indexed": 7,
    "total_indexed": 67,
    "duration_seconds": 1.23
  }
}
```

---

## Health Check API

### 健康检查

检查 API 和存储系统的健康状态。

**端点**: `GET /v1/health`

**认证**: 不需要（公开端点）

**响应** (200 OK - 健康):
```json
{
  "status": "healthy",
  "storage": {
    "healthy": true
  },
  "index": {
    "healthy": true,
    "prompts_count": 42,
    "templates_count": 18,
    "chats_count": 7,
    "last_updated": "2024-11-09T10:30:00Z",
    "index_size_bytes": 15360
  }
}
```

**响应** (503 Service Unavailable - 不健康):
```json
{
  "status": "unhealthy",
  "storage": {
    "healthy": false
  },
  "index": {
    "healthy": false
  }
}
```

---

## 数据模型

### Prompt/Template Metadata

Front Matter 中的元数据结构：

```yaml
id: string              # ULID (26 字符)
title: string           # 标题 (必需)
description: string     # 描述
type: string            # "prompt" 或 "template"
slug: string            # URL 友好的标识符
labels: array[string]   # 标签列表
author: string          # 作者
created_at: string      # ISO 8601 时间戳
updated_at: string      # ISO 8601 时间戳
```

### Chat Data Structure

```json
{
  "id": "string",              // ULID
  "title": "string",           // 标题 (必需)
  "description": "string",     // 描述
  "tags": ["string"],          // 标签列表
  "created_at": "string",      // ISO 8601 时间戳
  "updated_at": "string",      // ISO 8601 时间戳
  "messages": [                // 消息数组
    {
      "role": "user|assistant",
      "content": "string",
      "timestamp": "string"    // ISO 8601 时间戳
    }
  ]
}
```

### Version ID Format

版本 ID 格式：`{ISO_DATE}T{ISO_TIME}Z_{RANDOM_5CHARS}`

示例：`2024-11-09T10-30Z_A1B2C`

- 日期时间部分：`YYYY-MM-DDTHH-MMZ`
- 随机后缀：5 个大写字母数字字符

---

## 错误响应

所有错误响应遵循统一格式：

### 400 Bad Request

请求参数错误或验证失败。

```json
{
  "detail": "content is required"
}
```

### 404 Not Found

请求的资源不存在。

```json
{
  "detail": "Prompt 01HQXYZ123ABC456DEF789 not found"
}
```

### 422 Validation Error

数据验证失败。

```json
{
  "detail": "title is required in frontmatter"
}
```

### 500 Internal Server Error

服务器内部错误。

```json
{
  "detail": "Internal server error"
}
```

### 503 Service Unavailable

服务不可用（通常来自健康检查）。

```json
{
  "status": "unhealthy",
  "storage": {
    "healthy": false
  },
  "index": {
    "healthy": false
  }
}
```

---

## 使用示例

### Python (requests)

```python
import requests

BASE_URL = "http://localhost:8000/v1"

# 创建 Prompt
content = """---
title: Test Prompt
description: A test prompt
slug: test-prompt
labels:
  - test
author: developer
---

# Test Content

This is a test prompt.
"""

response = requests.post(
    f"{BASE_URL}/prompts",
    json={"content": content}
)
print(response.json())
# {"id": "01HR...", "version_id": "2024-11-09T...", "created_at": "..."}

# 获取 Prompt
prompt_id = response.json()["id"]
response = requests.get(f"{BASE_URL}/prompts/{prompt_id}")
print(response.json())

# 搜索
response = requests.get(
    f"{BASE_URL}/search",
    params={"type": "prompt", "labels": "test"}
)
print(response.json())
```

### JavaScript (fetch)

```javascript
const BASE_URL = "http://localhost:8000/v1";

// 创建 Prompt
const content = `---
title: Test Prompt
description: A test prompt
slug: test-prompt
labels:
  - test
author: developer
---

# Test Content

This is a test prompt.
`;

const createResponse = await fetch(`${BASE_URL}/prompts`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content })
});
const { id } = await createResponse.json();

// 获取 Prompt
const getResponse = await fetch(`${BASE_URL}/prompts/${id}`);
const prompt = await getResponse.json();
console.log(prompt);

// 搜索
const searchResponse = await fetch(
  `${BASE_URL}/search?type=prompt&labels=test`
);
const results = await searchResponse.json();
console.log(results);
```

### cURL

```bash
# 健康检查
curl http://localhost:8000/v1/health

# 列出 Prompts
curl http://localhost:8000/v1/prompts

# 创建 Prompt
curl -X POST http://localhost:8000/v1/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "---\ntitle: Test\n---\n\nContent"
  }'

# 搜索
curl "http://localhost:8000/v1/search?type=prompt&labels=test"
```

---

**最后更新**: 2025-11-09

**版本**: 1.0

**相关文档**:
- [项目 README](../README.md)
- [架构变更说明](ARCHITECTURE_CHANGES.md)
