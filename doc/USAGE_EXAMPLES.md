# API 使用示例

本文档提供 MyPromptManager API 的详细使用示例。

## 认证

所有 API 请求都需要 Token 认证（除了 `/v1/health`）：

```bash
# 获取 Token（使用 Django Admin 创建或使用 DRF Token）
curl -X POST http://localhost:8000/api-token-auth/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'

# 使用 Token
export TOKEN="your-token-here"
```

## Simple API 示例

### 1. 保存草稿

```bash
curl -X POST http://localhost:8000/v1/simple/prompts/01HQXYZ123ABC456DEF789/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "---\nid: 01HQXYZ123ABC456DEF789\ntitle: Code Review Assistant\ntype: prompt\nproject: default\nlabels:\n  - code-review\n  - ai\nauthor: john.doe\n---\n\n# Code Review Prompt\n\nPlease review the following code...",
    "message": "Initial draft",
    "idempotency_key": "unique-key-123"
  }'
```

响应：
```json
{
  "type": "draft",
  "sha": "abc123def456",
  "saved_at": "2024-01-01T12:00:00Z",
  "suggested_next_version": "v0.1.0",
  "ui_branch": "ui/john.doe/01HQXYZ123ABC456DEF789/unique-key"
}
```

### 2. 发布版本

```bash
curl -X POST http://localhost:8000/v1/simple/prompts/01HQXYZ123ABC456DEF789/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "base_sha": "abc123def456",
    "channel": "prod",
    "version": "auto",
    "notes": "Initial release of code review assistant"
  }'
```

响应：
```json
{
  "type": "release",
  "version": "v1.0.0",
  "channel": "prod",
  "released_at": "2024-01-01T12:30:00Z",
  "sha": "xyz789abc123",
  "notes": "Initial release of code review assistant",
  "tag_name": "prompt/01HQXYZ123ABC456DEF789/v1.0.0"
}
```

### 3. 查看时间线

```bash
# 仅查看发布版本
curl http://localhost:8000/v1/simple/prompts/01HQXYZ123ABC456DEF789/timeline?view=releases \
  -H "Authorization: Bearer $TOKEN"

# 查看所有历史（包括草稿）
curl http://localhost:8000/v1/simple/prompts/01HQXYZ123ABC456DEF789/timeline?view=all \
  -H "Authorization: Bearer $TOKEN"
```

### 4. 获取内容

```bash
# 获取最新发布版本
curl http://localhost:8000/v1/simple/prompts/01HQXYZ123ABC456DEF789/content?ref=latest \
  -H "Authorization: Bearer $TOKEN"

# 获取特定版本
curl http://localhost:8000/v1/simple/prompts/01HQXYZ123ABC456DEF789/content?ref=v1.0.0 \
  -H "Authorization: Bearer $TOKEN"
```

### 5. 比较版本

```bash
curl "http://localhost:8000/v1/simple/prompts/01HQXYZ123ABC456DEF789/compare?from=v1.0.0&to=v1.1.0" \
  -H "Authorization: Bearer $TOKEN"
```

### 6. 回滚版本

```bash
curl -X POST http://localhost:8000/v1/simple/prompts/01HQXYZ123ABC456DEF789/rollback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_version": "v1.0.0",
    "channel": "prod",
    "strategy": "revert_and_publish",
    "notes": "Rollback due to issues with v1.1.0"
  }'
```

## Detail API 示例

### 1. 查看完整历史

```bash
curl http://localhost:8000/v1/detail/prompts/01HQXYZ123ABC456DEF789/history?limit=100 \
  -H "Authorization: Bearer $TOKEN"
```

### 2. 获取详细差异

```bash
curl "http://localhost:8000/v1/detail/prompts/01HQXYZ123ABC456DEF789/diff?from=abc123&to=def456" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. 读取原始 Markdown

```bash
curl http://localhost:8000/v1/detail/prompts/01HQXYZ123ABC456DEF789/raw?ref=main \
  -H "Authorization: Bearer $TOKEN"
```

### 4. 更新原始 Markdown（需要 ETag）

```bash
# 首先获取当前 ETag
ETAG=$(curl -I http://localhost:8000/v1/detail/prompts/01HQXYZ123ABC456DEF789/raw \
  -H "Authorization: Bearer $TOKEN" | grep -i etag | cut -d' ' -f2)

# 然后更新
curl -X PUT http://localhost:8000/v1/detail/prompts/01HQXYZ123ABC456DEF789/raw?message=Update%20content \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: text/markdown" \
  -H "If-Match: $ETAG" \
  --data-binary @updated_prompt.md
```

### 5. 列出所有发布

```bash
curl http://localhost:8000/v1/detail/prompts/01HQXYZ123ABC456DEF789/releases \
  -H "Authorization: Bearer $TOKEN"
```

### 6. 创建发布

```bash
curl -X POST http://localhost:8000/v1/detail/prompts/01HQXYZ123ABC456DEF789/releases \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "base_sha": "abc123def456",
    "version": "v1.2.0",
    "channel": "beta",
    "notes": "Beta release with new features",
    "payload": {
      "tested_by": "qa-team",
      "approved_by": "tech-lead"
    }
  }'
```

### 7. Git 操作

```bash
# 列出分支
curl http://localhost:8000/v1/detail/git/branches \
  -H "Authorization: Bearer $TOKEN"

# 切换分支
curl -X POST http://localhost:8000/v1/detail/git/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "feature/new-prompts",
    "create": true
  }'

# 创建标签
curl -X POST http://localhost:8000/v1/detail/git/tag \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "prompt/01HQXYZ123ABC456DEF789/v1.0.0",
    "sha": "abc123def456",
    "annotated": true,
    "message": "{\"version\":\"v1.0.0\",\"channel\":\"prod\"}"
  }'
```

## Common API 示例

### 1. 搜索提示词

```bash
# 基本搜索
curl http://localhost:8000/v1/search?limit=20 \
  -H "Authorization: Bearer $TOKEN"

# 按类型筛选
curl http://localhost:8000/v1/search?type=prompt \
  -H "Authorization: Bearer $TOKEN"

# 按标签筛选
curl "http://localhost:8000/v1/search?labels=ai&labels=code-review" \
  -H "Authorization: Bearer $TOKEN"

# 按项目筛选
curl http://localhost:8000/v1/search?project=default \
  -H "Authorization: Bearer $TOKEN"

# 分页
curl "http://localhost:8000/v1/search?limit=10&cursor=01HQXYZ123ABC456DEF789" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. 索引管理

```bash
# 查看索引状态
curl http://localhost:8000/v1/index/status \
  -H "Authorization: Bearer $TOKEN"

# 修复索引
curl -X POST http://localhost:8000/v1/index/repair \
  -H "Authorization: Bearer $TOKEN"

# 重建索引
curl -X POST http://localhost:8000/v1/index/rebuild \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Schema 和验证

```bash
# 获取 Front Matter Schema
curl http://localhost:8000/v1/schemas/frontmatter \
  -H "Authorization: Bearer $TOKEN"

# 获取 Index Schema
curl http://localhost:8000/v1/schemas/index \
  -H "Authorization: Bearer $TOKEN"

# 验证 Front Matter
curl -X POST http://localhost:8000/v1/validate/frontmatter \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "---\nid: 01HQXYZ123ABC456DEF789\ntitle: Test\ntype: prompt\n---\n\nContent here"
  }'
```

### 4. 健康检查

```bash
# 不需要认证
curl http://localhost:8000/v1/health
```

## 完整工作流示例

### 场景：创建、发布、更新和回滚一个提示词

```bash
# 1. 创建新提示词草稿
PROMPT_ID="01HQXYZ123ABC456DEF789"

curl -X POST http://localhost:8000/v1/simple/prompts/$PROMPT_ID/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "content": "---\nid: 01HQXYZ123ABC456DEF789\ntitle: SQL Query Generator\ndescription: Generate SQL queries from natural language\ntype: prompt\nproject: default\nslug: sql-query-generator\nlabels:\n  - sql\n  - database\nauthor: john.doe\n---\n\n# SQL Query Generator\n\nGenerate a SQL query based on the following natural language description:\n\n{{user_description}}",
  "message": "Initial version",
  "idempotency_key": "init-001"
}
EOF

# 2. 发布 v1.0.0
BASE_SHA="<从上一步响应中获取的 sha>"

curl -X POST http://localhost:8000/v1/simple/prompts/$PROMPT_ID/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "base_sha": "'$BASE_SHA'",
    "channel": "prod",
    "version": "auto",
    "notes": "Initial release"
  }'

# 3. 更新并发布 v1.1.0
curl -X POST http://localhost:8000/v1/simple/prompts/$PROMPT_ID/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "content": "---\nid: 01HQXYZ123ABC456DEF789\ntitle: SQL Query Generator\ndescription: Generate optimized SQL queries from natural language\ntype: prompt\nproject: default\nslug: sql-query-generator\nlabels:\n  - sql\n  - database\n  - optimized\nauthor: john.doe\n---\n\n# SQL Query Generator\n\nGenerate an optimized SQL query based on the following natural language description:\n\n{{user_description}}\n\nConsider:\n- Performance optimization\n- Proper indexing\n- Query execution plan",
  "message": "Added optimization guidelines",
  "idempotency_key": "update-001"
}
EOF

# 发布 v1.1.0
NEW_BASE_SHA="<从上一步响应中获取的 sha>"

curl -X POST http://localhost:8000/v1/simple/prompts/$PROMPT_ID/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "base_sha": "'$NEW_BASE_SHA'",
    "channel": "prod",
    "version": "auto",
    "notes": "Added optimization guidelines"
  }'

# 4. 如果有问题，回滚到 v1.0.0
curl -X POST http://localhost:8000/v1/simple/prompts/$PROMPT_ID/rollback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_version": "v1.0.0",
    "channel": "prod",
    "notes": "Rollback due to issues with optimization guidelines"
  }'

# 5. 查看完整时间线
curl http://localhost:8000/v1/simple/prompts/$PROMPT_ID/timeline?view=releases \
  -H "Authorization: Bearer $TOKEN"
```

## Python SDK 示例

```python
import requests

class PromptManagerClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def save_draft(self, prompt_id, content, message="", idempotency_key=None):
        """保存草稿"""
        url = f"{self.base_url}/v1/simple/prompts/{prompt_id}/save"
        data = {
            "content": content,
            "message": message,
            "idempotency_key": idempotency_key
        }
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

    def publish(self, prompt_id, base_sha, channel="prod", version="auto", notes=""):
        """发布版本"""
        url = f"{self.base_url}/v1/simple/prompts/{prompt_id}/publish"
        data = {
            "base_sha": base_sha,
            "channel": channel,
            "version": version,
            "notes": notes
        }
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

    def get_content(self, prompt_id, ref="latest"):
        """获取内容"""
        url = f"{self.base_url}/v1/simple/prompts/{prompt_id}/content"
        params = {"ref": ref}
        response = requests.get(url, params=params, headers=self.headers)
        return response.json()

    def search(self, **kwargs):
        """搜索提示词"""
        url = f"{self.base_url}/v1/search"
        response = requests.get(url, params=kwargs, headers=self.headers)
        return response.json()

# 使用示例
client = PromptManagerClient("http://localhost:8000", "your-token-here")

# 保存草稿
result = client.save_draft(
    "01HQXYZ123ABC456DEF789",
    content="---\nid: 01HQXYZ123ABC456DEF789\n...\n---\n\nContent",
    message="Initial draft"
)

# 发布
publish_result = client.publish(
    "01HQXYZ123ABC456DEF789",
    base_sha=result['sha'],
    notes="Initial release"
)

# 搜索
prompts = client.search(type="prompt", labels=["ai", "code-review"])
```

## 错误处理

所有错误响应遵循 RFC7807 格式：

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "If-Match does not match current resource sha",
  "resource_sha": "def456",
  "head_sha": "abc123"
}
```

常见状态码：
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 无权限
- `404` - 资源不存在
- `409` - 并发冲突
- `422` - 验证失败
- `423` - 索引锁定
- `500` - 服务器错误
