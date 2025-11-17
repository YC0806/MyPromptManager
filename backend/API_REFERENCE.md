# API 参考（基于后端代码）

- 基础路径：`http://localhost:8000/v1`
- 编码与格式：请求与响应均为 `application/json`；默认无鉴权。
- 时间字段：均为 ISO-8601（UTC）字符串。
- 错误响应（RFC7807 风格，由 `apps.core.exceptions` 提供）：
  ```json
  {
    "type": "about:blank",
    "title": "BadRequestError",
    "status": 400,
    "detail": "content is required"
  }
  ```

## Prompts

### GET /prompts
- 查询参数：
  - `labels`：可重复，按 AND 过滤（例如 `?labels=a&labels=b`）。
  - `limit`：返回数量上限，默认 100。
- 响应：
  ```json
  {
    "prompts": [
      {
        "id": "01HF6X...W8W",
        "title": "Greeting",
        "type": "prompt",
        "labels": ["demo"],
        "updated_at": "2024-05-06T10:15:00Z",
        "author": "You"
      }
    ],
    "count": 1,
    "total": 1
  }
  ```

### POST /prompts
- 用途：创建新的 Prompt，初始版本号由后端写入 `"inital"`。
- 请求体字段：
  - `title` *(必填, string)*
  - `content` *(必填, string)*：正文（可含 front matter，但后端仅把内容写入版本文件）。
  - `labels` *(可选, string[] 默认 `[]`)* 
  - `description` *(可选, string, 默认 `""`)*
  - 其他字段会被忽略；`author` 在后端强制写入 `"You"`。
- 成功响应：`201 Created`
  ```json
  { "id": "01HF6X...W8W", "version_id": "abc12" }
  ```

### GET /prompts/{prompt_id}
- 返回该 Prompt 的元数据（不含正文），来自 `prompt.yaml`：
  ```json
  {
    "id": "01HF6X...W8W",
    "title": "Greeting",
    "type": "prompt",
    "labels": ["demo"],
    "description": "示例",
    "updated_at": "2024-05-06T10:15:00Z",
    "created_at": "2024-05-06T10:15:00Z",
    "author": "You",
    "versions": [
      { "id": "abc12", "version_number": "inital", "created_at": "2024-05-06T10:15:00Z" }
    ]
  }
  ```

### PUT /prompts/{prompt_id}
- 用途：创建一个新版本（不会覆盖旧版本）。
- 请求体字段：
  - `content` *(必填, string)*
  - `version_number` *(必填, string 或 int)*：写入到版本 front matter。
- 成功响应：`200 OK`
  ```json
  { "id": "01HF6X...W8W", "version_id": "def34" }
  ```

### DELETE /prompts/{prompt_id}
- 用途：删除该 Prompt 及其所有版本。成功返回 `204 No Content`。

### GET /prompts/{prompt_id}/versions
- 返回该 Prompt 的全部版本摘要，来源于元数据：
  ```json
  {
    "prompt_id": "01HF6X...W8W",
    "versions": [
      { "id": "abc12", "version_number": "inital", "created_at": "2024-05-06T10:15:00Z" },
      { "id": "def34", "version_number": "2", "created_at": "2024-05-07T09:00:00Z" }
    ],
    "count": 2
  }
  ```

### GET /prompts/{prompt_id}/versions/{version_id}
- 返回指定版本的 front matter 与正文：
  ```json
  {
    "prompt_id": "01HF6X...W8W",
    "frontmatter": {
      "id": "def34",
      "version_number": "2",
      "created_at": "2024-05-07T09:00:00Z",
      "author": "You"
    },
    "content": "# Prompt v2 内容"
  }
  ```

### DELETE /prompts/{prompt_id}/versions/{version_id}
- 删除指定版本，成功返回 `204 No Content`。若删除的是 HEAD，后端会将 HEAD 指向最新版本或移除。

## Templates

### GET /templates
- 查询参数与行为同 `/prompts`（支持 `labels` 与 `limit`）。
- 响应字段同 Prompt 列表，`type` 固定为 `"template"`。

### POST /templates
- 用途：创建新的 Template。
- 请求体字段：
  - `title` *(必填, string)*
  - `content` *(必填, string)*
  - `labels` *(可选, string[] 默认 `[]`)*
  - `description` *(可选, string, 默认 `""`)*
  - `variables` *(可选, object[])*：每项格式
    ```json
    { "name": "sender", "type": "str", "description": "发件人", "default_value": "Support Team" }
    ```
    - `type` 允许：`str` / `int` / `float` / `bool`（其他值将回退为 `str`）。
  - 其他字段会被忽略；`author` 后端写入 `"You"`。
- 成功响应：`201 Created`
  ```json
  { "id": "01HF6Y...3AB", "version_id": "t1234" }
  ```

### GET /templates/{template_id}
- 返回模板元数据（不含正文），结构同 Prompt 元数据。

### PUT /templates/{template_id}
- 用途：创建新版本。
- 请求体字段：
  - `content` *(必填, string)*
  - `version_number` *(必填, string 或 int)*
  - `variables` *(可选, object[])*：同 POST。
- 成功响应：`200 OK`
  ```json
  { "id": "01HF6Y...3AB", "version_id": "t5678" }
  ```

### DELETE /templates/{template_id}
- 删除模板及其版本。成功返回 `204 No Content`。

### GET /templates/{template_id}/versions
- 返回模板所有版本摘要：
  ```json
  {
    "template_id": "01HF6Y...3AB",
    "versions": [
      { "id": "t1234", "version_number": "inital", "created_at": "2024-05-06T10:20:00Z" }
    ],
    "count": 1
  }
  ```

### GET /templates/{template_id}/versions/{version_id}
- 返回指定版本正文与 front matter（包含变量声明）：
  ```json
  {
    "template_id": "01HF6Y...3AB",
    "frontmatter": {
      "id": "t1234",
      "version_number": "inital",
      "created_at": "2024-05-06T10:20:00Z",
      "author": "You",
      "variables": [
        { "name": "sender", "type": "str", "description": "发件人", "default_value": "Support Team" }
      ]
    },
    "content": "# 模板正文"
  }
  ```

### DELETE /templates/{template_id}/versions/{version_id}
- 删除指定版本，成功返回 `204 No Content`。

## Chats

### GET /chats
- 查询参数：
  - `provider` *(可选)*：按 provider 等值过滤（大小写不敏感）。
  - `limit` *(可选, 默认 100)*
- 响应：按 `updated_at` 倒序，缺失 `turn_count` 时会按 `role == "user"` 的消息数补充。
  ```json
  {
    "chats": [
      {
        "id": "01HK...XYZ",
        "provider": "ChatGPT",
        "conversation_id": "conv-123",
        "title": "对话标题",
        "messages": [{ "role": "user", "content": "hi" }],
        "tags": ["demo"],
        "created_at": "2024-05-06T11:00:00Z",
        "updated_at": "2024-05-06T11:10:00Z",
        "turn_count": 1
      }
    ],
    "count": 1,
    "total": 1
  }
  ```

### POST /chats
- 用途：创建新的聊天记录；若 `provider + conversation_id` 已存在则改为更新。
- 请求体字段：
  - `title` *(必填, string)*
  - `provider` / `conversation_id` *(可选，但两者同时存在时启用去重更新)*
  - `description`, `tags` *(string[])*, `messages` *(object[] 默认 `[]`)* 及任意自定义字段。
  - `created_at` *(可选)*：缺省时由后端补当前时间；`updated_at` 总是由后端刷新为当前时间。
- 成功响应：
  - 新建：`201 Created`
    ```json
    { "id": "01HK...XYZ", "created_at": "2024-05-06T11:00:00Z", "message": "Chat created" }
    ```
  - 去重更新：`200 OK`
    ```json
    { "id": "01HK...XYZ", "updated_at": "2024-05-06T11:10:00Z", "message": "Chat updated" }
    ```
- 失败示例：缺少 `title` 会触发 `422 ValidationError`。

### GET /chats/{chat_id}
- 返回完整聊天对象；若缺失 `turn_count`，会在返回时计算并补充。

### PUT /chats/{chat_id}
- 用途：整体更新聊天对象（文件将被覆盖），`updated_at` 由后端改写为当前时间。
- 请求体：任意聊天结构；务必包含需要保留的字段（如 `messages`、`tags` 等）。
- 成功响应：`200 OK`
  ```json
  { "id": "01HK...XYZ", "updated_at": "2024-05-06T11:12:00Z" }
  ```

### DELETE /chats/{chat_id}
- 删除聊天记录，成功返回 `204 No Content`。

## Search

### GET /search
- 查询参数：`type`（prompt/template/chat）、`labels`（可重复）、`author`、`limit`（默认 50）、`cursor`。
- 当前实现：未完成搜索逻辑，始终返回空列表 `[]`，可视为占位接口。
