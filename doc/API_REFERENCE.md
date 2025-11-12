# MyPromptManager API Reference

统一 API 均位于 `http://<host>:8000/v1`，后端默认允许匿名访问（DRF `AllowAny`），输入输出使用 `application/json`。除另行说明外，时间戳为 ISO 8601（UTC）。

- **认证**：本地开发默认无需认证。
- **内容类型**：`Content-Type: application/json`
- **错误格式**：遵循 RFC7807 `application/problem+json`（见下例）。

```json
{
  "type": "about:blank",
  "title": "ValidationError",
  "status": 422,
  "detail": "title is required"
}
```

> **提示**：所有端点定义在 `apps/api/views.py`，存储逻辑在 `FileStorageService`，索引逻辑在 `IndexService`。以下文档直接对应后端实现。

---

## Prompts API

### 列表 / 创建 `GET | POST /v1/prompts`
**查询参数**
| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `labels` | array[string] | - | 必须包含所有指定标签 |
| `limit` | integer | 100 | 返回数量上限 |

**GET 响应**
```json
{
  "prompts": [
    {
      "id": "01HR...",
      "title": "Support Reply",
      "type": "prompt",
      "labels": ["support", "email"],
      "updated_at": "2024-11-05T09:30:00Z",
      "author": "jane.doe"
    }
  ],
  "count": 1,
  "total": 12
}
```

**POST 请求体**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | Prompt 名称 |
| `content` | string | ✅ | 完整 Markdown（含前置 Front Matter） |
| `labels` | array[string] | ❌ | 标签列表 |
| `description` | string | ❌ | 描述 |

**POST 响应** `201 Created`
```json
{ "id": "01HR...", "version_id": "A1B2C", "created_at": "2024-11-09T10:15:00Z" }
```

### 详情 `GET /v1/prompts/{prompt_id}`
返回存储在 `prompt.yaml` 中的 Metadata：
```json
{
  "id": "01HR...",
  "title": "Support Reply",
  "type": "prompt",
  "labels": ["support"],
  "description": "Auto reply",
  "updated_at": "2024-11-05T09:30:00Z",
  "created_at": "2024-11-05T08:00:00Z",
  "author": "jane.doe",
  "versions": [
    { "id": "A1B2C", "version_number": 1, "created_at": "2024-11-05T08:00:00Z" }
  ]
}
```

### 更新 `PUT /v1/prompts/{prompt_id}`
**请求体**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version_number` | integer \| string | ✅ | 新版本号（任意语义版本值，后端仅记录） |
| `content` | string | ✅ | Prompt Markdown 正文；服务端沿用现有 metadata，仅写入正文 |

**响应** `200 OK`
```json
{ "id": "01HR...", "version_id": "C3D4E" }
```

### 删除 `DELETE /v1/prompts/{prompt_id}`
- 彻底删除 prompt 及其所有版本、索引；返回 `204 No Content`。

### 版本列表 `GET /v1/prompts/{prompt_id}/versions`
```json
{
  "prompt_id": "01HR...",
  "versions": [
    { "id": "A1B2C", "version_number": 1, "created_at": "2024-11-05T08:00:00Z" },
    { "id": "F6G7H", "version_number": 2, "created_at": "2024-11-06T10:00:00Z" }
  ],
  "count": 2
}
```

### 版本详情 / 删除 `GET | DELETE /v1/prompts/{prompt_id}/versions/{version_id}`
**GET 响应**
```json
{
  "prompt_id": "01HR...",
  "version_id": "F6G7H",
  "metadata": {
    "id": "F6G7H",
    "version_number": 2,
    "created_at": "2024-11-06T10:00:00Z",
    "author": "jane.doe"
  },
  "content": "# Prompt body ..."
}
```
**DELETE** 返回 `204 No Content`。

---

## Templates API

Templates API 与 Prompts 基本一致，额外支持 `variables`。

### 列表 / 创建 `GET | POST /v1/templates`
- 查询参数与响应结构与 Prompts 相同，只是 `type` 为 `template`。
- `POST` 体：`title`、`content` 必填，`labels`、`description`、`author` 可选。

### 详情 `GET /v1/templates/{template_id}`
返回当前 HEAD 版本的概要信息：
```json
{
  "id": "01HS...",
  "version_number": 3,
  "created_at": "2024-11-07T09:00:00Z",
  "author": "you",
  "variables": [
    { "name": "customer_name", "type": "str" }
  ]
}
```
> 当前实现返回 HEAD 版本的 VersionData（不含正文）。如需完整内容请调用版本详情接口。

### 更新 `PUT /v1/templates/{template_id}`
**请求体**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version_number` | integer \| string | ✅ | 新版本号（字符串或整数均可） |
| `content` | string | ✅ | 模板 Markdown 正文；服务端复用现有 metadata 并写入新正文 |
| `variables` | array[object] | ❌ | 模板变量定义。每项需要 `name`、`type`(`str`/`int`/`float`/`bool`)，可选 `description`、`default_value` |

**响应**
```json
{ "id": "01HS...", "version_id": "P9Q0R" }
```

### 删除 `DELETE /v1/templates/{template_id}`
- 删除模板与所有版本；返回 `204`。

### 版本列表 `GET /v1/templates/{template_id}/versions`
结构与 Prompts 相同。

### 版本详情 / 删除 `GET | DELETE /v1/templates/{template_id}/versions/{version_id}`
**GET 响应**
```json
{
  "template_id": "01HS...",
  "version_id": "P9Q0R",
  "metadata": {
    "id": "P9Q0R",
    "version_number": 3,
    "created_at": "2024-11-07T09:00:00Z",
    "author": "design-system",
    "variables": [ { "name": "tone", "type": "str" } ]
  },
  "content": "# Template body ..."
}
```
**DELETE** 返回 `204 No Content`。

---

## Chats API

### 列表 / 创建 `GET | POST /v1/chats`
**查询参数**
| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `provider` | string | - | 过滤 provider（忽略大小写） |
| `limit` | integer | 100 | 数量上限 |

**GET 响应**
```json
{
  "chats": [
    {
      "id": "01HT...",
      "title": "Feature Discussion",
      "provider": "claude",
      "conversation_id": "chatcmpl-123",
      "tags": ["product"],
      "messages": [{"role": "user", "content": "..."}],
      "turn_count": 5,
      "created_at": "2024-11-08T10:00:00Z",
      "updated_at": "2024-11-08T15:30:00Z"
    }
  ],
  "count": 1,
  "total": 10
}
```

**POST 请求体**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 聊天标题 |
| `description` | string | ❌ | 描述 |
| `tags` | array[string] | ❌ | 标签 |
| `provider` | string | ❌ | AI 提供方（配合 `conversation_id` 做去重） |
| `conversation_id` | string | ❌ | 第三方会话 ID |
| `messages` | array[object] | ❌ | `{ role: "user|assistant", content, timestamp }` |

- 若提供 `provider + conversation_id`，服务会尝试查找并更新现有聊天，响应 `200 OK`：
```json
{ "id": "01HT...", "updated_at": "2024-11-12T12:00:00Z", "message": "Chat updated" }
```
- 否则创建新聊天，响应 `201 Created`：
```json
{ "id": "01HT...", "created_at": "2024-11-12T11:58:00Z", "message": "Chat created" }
```

### 详情 `GET /v1/chats/{chat_id}`
返回完整聊天 JSON，并自动附加 `turn_count`（统计 user 消息数）。

### 更新 `PUT /v1/chats/{chat_id}`
- 请求体：完整聊天对象（至少包含 `title`）。
- 响应：`{ "id": "01HT...", "updated_at": "2024-11-12T12:30:00Z" }`

### 删除 `DELETE /v1/chats/{chat_id}`
- 删除 JSON 文件并从索引移除；响应 `204`。

---

## Search API

### `GET /v1/search`
**查询参数**
| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `type` | string | - | `prompt` / `template` / `chat`，缺省表示全部 |
| `labels` | array[string] | - | 必须包含所有指定标签 |
| `slug` | string | - | 精确匹配 slug |
| `author` | string | - | 精确匹配作者 |
| `limit` | integer | 50 | 返回上限 |
| `cursor` | string | - | 基于 `id` 的游标分页 |

**响应**
```json
{
  "items": [
    {
      "id": "01HR...",
      "type": "prompt",
      "title": "Support Reply",
      "description": "Auto reply",
      "slug": "support-reply",
      "labels": ["support"],
      "author": "jane.doe",
      "created_at": "2024-11-05T08:00:00Z",
      "updated_at": "2024-11-05T09:30:00Z",
      "file_path": "prompts/prompt_support-reply-01HR.../HEAD",
      "sha": "latest"
    }
  ],
  "count": 1,
  "next_cursor": null
}
```

---

## Index API

### 状态 `GET /v1/index/status`
```json
{
  "prompts_count": 12,
  "templates_count": 4,
  "chats_count": 28,
  "last_updated": "2024-11-10T12:00:00Z",
  "index_size_bytes": 40960
}
```

### 重建 `POST /v1/index/rebuild`
- 全量扫描 `repo_root`，重写 `index.json`，适用于手动编辑文件或索引损坏。
```json
{
  "status": "completed",
  "stats": {
    "prompts_added": 12,
    "templates_added": 4,
    "chats_added": 28,
    "errors": []
  }
}
```

---

## Health API

### `GET /v1/health`
- 检查 FileStorageService 与 IndexService 是否可用。
```json
{
  "status": "healthy",
  "storage": { "healthy": true },
  "index": {
    "healthy": true,
    "prompts_count": 12,
    "templates_count": 4,
    "chats_count": 28,
    "last_updated": "2024-11-10T12:00:00Z",
    "index_size_bytes": 40960
  }
}
```
- 若任一失败，`status` 变为 `unhealthy` 且 HTTP 503。

---

## 常见状态码
| 状态码 | 含义 |
|--------|------|
| `200 OK` | 成功读取或更新 |
| `201 Created` | 资源创建成功 |
| `204 No Content` | 删除成功，无响应体 |
| `400 Bad Request` | 参数缺失或格式错误 |
| `404 Not Found` | 资源不存在 |
| `409 Conflict` | 写入冲突（如版本重复） |
| `422 Unprocessable Entity` | 语义验证失败 |
| `423 Locked` | 索引锁定中（并发 rebuild） |
| `503 Service Unavailable` | `GET /v1/health` 检测失败 |

---

如需更多示例，可参考 `scripts/api_request_simulator.py` 以及 `frontend/src` 中的 API 调用。EOF
