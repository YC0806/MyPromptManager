# API 接口说明

本文档基于 `MyPromptManager` 项目当前实现，总结了 `/api/` 前缀下所有可用接口的输入输出要求。除非特别说明，接口使用 JSON 作为请求与响应格式。

## 通用约定
- 基础路径：`/api/`
- 权限：所有接口均使用 `IsAuthenticatedOrReadOnly`，即 GET 请求可匿名访问，POST/PUT/PATCH/DELETE 需要已登录用户。
- 时间字段均为 ISO 8601 字符串。
- 带版本的资源（Prompt、Prompt Template）使用 `<资源ID>:v<版本号>` 作为版本主键，例如 `welcome-email:v3`。

## 数据模型

### Tag 对象
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 标签名称 |
| `slug` | string | 标签唯一标识，创建时自动生成 |
| `created_at` | string | 创建时间 |

### Prompt 对象
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | Prompt 唯一标识 |
| `name` | string | 标题 |
| `description` | string | 描述，可为空 |
| `tags` | string[] | 标签名称列表 |
| `is_archived` | boolean | 是否归档 |
| `created_at` | string | 创建时间 |
| `updated_at` | string | 最近更新时间 |
| `created_by` | string\|null | 创建者用户名 |
| `active_version` | PromptVersion\|null | 当前激活版本 |
| `latest_version` | PromptVersion\|null | 最新版本 |

### PromptVersion 对象
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 版本主键，形如 `<prompt_id>:v<版本号>` |
| `prompt` | string | 所属 Prompt ID |
| `version` | integer | 版本号 |
| `content` | string | Prompt 内容 |
| `metadata` | object | 自定义元数据，默认为 `{}` |
| `changelog` | string | 版本说明，可为空 |
| `created_at` | string | 创建时间 |
| `created_by` | string\|null | 创建者用户名 |

### PromptTemplate 对象
字段与 Prompt 对象一致，但 `active_version` / `latest_version` 为 PromptTemplateVersion。

### PromptTemplateVersion 对象
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 版本主键，形如 `<template_id>:v<版本号>` |
| `template` | string | 所属模板 ID |
| `version` | integer | 版本号 |
| `body` | string | 模板正文 |
| `metadata` | object | 自定义元数据，默认为 `{}` |
| `placeholders` | string[] | 占位符名称列表 |
| `render_example` | string | 渲染示例，可为空字符串 |
| `changelog` | string | 版本说明，可为空 |
| `created_at` | string | 创建时间 |
| `created_by` | string\|null | 创建者用户名 |

---

## 标签接口

### 获取标签列表
- **方法/路径**：`GET /api/tags/`
- **查询参数**：无
- **响应**
  - 200 OK：`Tag[]`

### 创建标签
- **方法/路径**：`POST /api/tags/`
- **请求体**
  ```json
  {
    "name": "marketing"
  }
  ```
  - `name` (string, 必填)：标签名称
- **响应**
  - 201 Created：返回新建 `Tag` 对象

### 删除标签
- **方法/路径**：`DELETE /api/tags/{slug}/`
  - `slug` (path, string)：标签唯一标识
- **响应**
  - 204 No Content：删除成功

---

## Prompt 接口

### 查询 Prompt 列表
- **方法/路径**：`GET /api/prompts/`
- **查询参数**
  | 名称 | 类型 | 必填 | 说明 |
  | --- | --- | --- | --- |
  | `search` | string | 否 | 在名称、描述中模糊匹配 |
  | `tags__name` | string\|string[] | 否 | 支持多值或逗号分隔，过滤包含指定标签的 Prompt |
  | `is_archived` | string | 否 | `true` / `false`；缺省时仅返回未归档数据 |
- **响应**
  - 200 OK：`Prompt[]`

### 获取单个 Prompt
- **方法/路径**：`GET /api/prompts/{id}/`
  - `id` (path, string)：Prompt 唯一标识
- **响应**
  - 200 OK：`Prompt`
  - 404 Not Found：ID 不存在

### 创建 Prompt
- **方法/路径**：`POST /api/prompts/`
- **请求体**
  ```json
  {
    "name": "Welcome Email",
    "description": "首次注册欢迎邮件",
    "tags": ["email", "welcome"],
    "content": "Hi {{user_name}}, welcome...",
    "metadata": {
      "language": "en-US"
    },
    "changelog": "初始版本"
  }
  ```
  | 字段 | 类型 | 必填 | 说明 |
  | --- | --- | --- | --- |
  | `name` | string | 是 | 标题 |
  | `description` | string | 否 | 描述，允许空字符串 |
  | `tags` | string[] | 否 | 标签列表，重复值将被去重 |
  | `content` | string | 是 | Prompt 正文 |
  | `metadata` | object | 否 | 自定义元数据 |
  | `changelog` | string | 否 | 版本说明 |
  | `is_archived` | boolean | 否 | 是否立即归档，默认 `false` |
- **响应**
  - 201 Created：`Prompt`
  - 400 Bad Request：字段校验失败（例如缺少 `content`）

### 更新 Prompt（覆盖式）
- **方法/路径**：`PUT /api/prompts/{id}/`
- **请求体**：同创建接口，可省略不需要变更的字段
- **响应**
  - 200 OK：更新后的 `Prompt`
  - 404 Not Found：ID 不存在

### 部分更新 Prompt
- **方法/路径**：`PATCH /api/prompts/{id}/`
- **请求体**：包含需修改字段；若提供 `content`，默认沿用当前版本 metadata（除非同时传入新 metadata）
- **响应**
  - 200 OK：更新后的 `Prompt`
  - 404 Not Found：ID 不存在

### 删除 Prompt
- **方法/路径**：`DELETE /api/prompts/{id}/`
- **响应**
  - 204 No Content

---

## Prompt Version 接口

### 查询版本列表
- **方法/路径**：`GET /api/prompt-versions/`
- **查询参数**
  | 名称 | 类型 | 必填 | 说明 |
  | --- | --- | --- | --- |
  | `prompt` | string | 否 | 限定返回某个 Prompt 的所有版本；缺省时返回所有 Prompt 的版本历史 |
- **响应**
  - 200 OK：`PromptVersion[]`

### 获取指定版本
- **方法/路径**：`GET /api/prompt-versions/{prompt_id}:v{version}/`
  - `prompt_id` (path, string)：Prompt ID
  - `version` (path, integer)：版本号
- **响应**
  - 200 OK：`PromptVersion`
  - 404 Not Found：Prompt 或版本不存在

### 创建新版本
- **方法/路径**：`POST /api/prompt-versions/`
- **请求体**
  ```json
  {
    "prompt": "welcome-email",
    "content": "Hi {{user_name}}, welcome v2...",
    "metadata": {},
    "changelog": "优化问候语"
  }
  ```
  | 字段 | 类型 | 必填 | 说明 |
  | --- | --- | --- | --- |
  | `prompt` | string | 是 | 关联的 Prompt ID，必须存在 |
  | `content` | string | 是 | 新版本正文 |
  | `metadata` | object | 否 | 元数据，默认为 `{}` |
  | `changelog` | string | 否 | 版本说明 |
- **响应**
  - 201 Created：`PromptVersion`
  - 400 Bad Request：Prompt 不存在或字段非法

### 从历史版本恢复
- **方法/路径**：`POST /api/prompt-versions/{prompt_id}:v{version}/restore/`
- **请求体**
  ```json
  {
    "changelog": "恢复到 v2 版本"
  }
  ```
  - `changelog` (string, 可选)：恢复记录，不提供时默认写入 `Restored from v<version>`
- **响应**
  - 201 Created：返回新建的 `PromptVersion`（包含新的版本号）
  - 404 Not Found：目标版本不存在

---

## Prompt Template 接口

### 查询模板列表
- **方法/路径**：`GET /api/prompt-templates/`
- **查询参数**：同 Prompt 列表接口
- **响应**
  - 200 OK：`PromptTemplate[]`

### 获取单个模板
- **方法/路径**：`GET /api/prompt-templates/{id}/`
- **响应**
  - 200 OK：`PromptTemplate`
  - 404 Not Found：ID 不存在

### 创建模板
- **方法/路径**：`POST /api/prompt-templates/`
- **请求体**
  ```json
  {
    "name": "Order Confirmation",
    "description": "下单成功通知模版",
    "tags": ["transactional"],
    "body": "Hi {{customer_name}}, your order {{order_id}} ...",
    "metadata": {
      "channel": "email"
    },
    "placeholders": ["customer_name", "order_id"],
    "render_example": "Hi Alice, your order #12345 ...",
    "changelog": "初始版本"
  }
  ```
  | 字段 | 类型 | 必填 | 说明 |
  | --- | --- | --- | --- |
  | `name` | string | 是 | 模板名称 |
  | `description` | string | 否 | 描述 |
  | `tags` | string[] | 否 | 标签列表 |
  | `body` | string | 是 | 模板正文 |
  | `metadata` | object | 否 | 元数据 |
  | `placeholders` | string[] | 否 | 占位符名称列表 |
  | `render_example` | string | 否 | 渲染示例 |
  | `changelog` | string | 否 | 版本说明 |
  | `is_archived` | boolean | 否 | 是否立即归档，默认 `false` |
- **响应**
  - 201 Created：`PromptTemplate`
  - 400 Bad Request：缺少必填字段（例如 `body`）

### 更新模板（覆盖式）
- **方法/路径**：`PUT /api/prompt-templates/{id}/`
- **响应**
  - 200 OK：更新后的 `PromptTemplate`
  - 404 Not Found：ID 不存在

### 部分更新模板
- **方法/路径**：`PATCH /api/prompt-templates/{id}/`
- **说明**：若仅更新 `body` 且未提供 `metadata`、`placeholders`、`render_example`，将沿用当前激活版本的对应值。
- **响应**
  - 200 OK：更新后的 `PromptTemplate`
  - 404 Not Found：ID 不存在

### 删除模板
- **方法/路径**：`DELETE /api/prompt-templates/{id}/`
- **响应**
  - 204 No Content

---

## Prompt Template Version 接口

### 查询版本列表
- **方法/路径**：`GET /api/prompt-template-versions/`
- **查询参数**
  | 名称 | 类型 | 必填 | 说明 |
  | --- | --- | --- | --- |
  | `template` | string | 否 | 限定返回某个模板的版本历史；缺省时返回所有模板的版本 |
- **响应**
  - 200 OK：`PromptTemplateVersion[]`

### 获取指定版本
- **方法/路径**：`GET /api/prompt-template-versions/{template_id}:v{version}/`
- **响应**
  - 200 OK：`PromptTemplateVersion`
  - 404 Not Found：模板或版本不存在

### 创建新版本
- **方法/路径**：`POST /api/prompt-template-versions/`
- **请求体**
  ```json
  {
    "template": "order-confirmation",
    "body": "Hi {{customer_name}}, your order {{order_id}} is confirmed.",
    "metadata": {},
    "placeholders": ["customer_name", "order_id"],
    "render_example": "Hi Alice...",
    "changelog": "加入订单号"
  }
  ```
  | 字段 | 类型 | 必填 | 说明 |
  | --- | --- | --- | --- |
  | `template` | string | 是 | 模板 ID，必须存在 |
  | `body` | string | 是 | 模板正文 |
  | `metadata` | object | 否 | 元数据 |
  | `placeholders` | string[] | 否 | 占位符列表 |
  | `render_example` | string | 否 | 渲染示例 |
  | `changelog` | string | 否 | 版本说明 |
- **响应**
  - 201 Created：`PromptTemplateVersion`
  - 400 Bad Request：模板不存在或字段非法

### 从历史版本恢复
- **方法/路径**：`POST /api/prompt-template-versions/{template_id}:v{version}/restore/`
- **请求体**
  ```json
  {
    "changelog": "恢复到 2024-01-10 版本"
  }
  ```
  - `changelog` (string, 可选)：恢复记录，缺省时自动写入 `Restored from v<版本号>`
- **响应**
  - 201 Created：返回新的 `PromptTemplateVersion`
  - 404 Not Found：目标版本不存在

