基于 Markdown + YAML Front Matter + JSON 索引 的提示词管理工具，基本功能是存储提示词/提示词模版并对提示词/提示词模版进行版本控制

项目的用户交互基于“双车道”（Detail/技术版 & Simple/简化版）。底层仍是单一事实层（Markdown+YAML Front Matter+Git 标签+index.json），两条车道共用同一数据，只是**操作入口与暴露术语**不同。

------

# 项目说明（概要）

## 架构与事实层

- **事实来源**：`*.md`（正文+Front Matter）与 `chat_*.json`；`index.json` 仅作检索缓存，可重建。
- **发布语义**：以**注释标签**（annotated tag）标注发布：
   `prompt/<PROMPT_ID>/vX.Y.Z`（可含 `-rc.N`），标签 message 存 JSON：`{channel, notes, released_at, checksum,...}`。
- **分支策略**：
  - Detail 车道可用 `main`/`feature/*`/`release/*` 等。
  - Simple 车道默认只面向一个“工作分支”（默认 `main`），草稿写入**隐藏 UI 分支**：`ui/<user>/<prompt_id>/<session>`，发布时服务端合并进工作分支后打标签。
- **并发与一致性**：
  - 写操作使用 `ETag/If-Match`（资源级乐观并发）。
  - `index.json` 用文件锁与原子替换；支持 `rebuild/repair` 同步端点。
- **权限与审计**：
  - Simple 无分支/标签直接权限；所有发布由受控账号（如 `release-bot`）执行。
  - 全量操作都有 Git 提交/标签与审计日志。
- **兼容约束（两车道共享契约）**：
  1. ULID 作为唯一 ID，与文件名绑定。
  2. 标签命名空间固定：`prompt/<id>/v*`。
  3. 提交消息建议包含 `<id>` 便于检索。
  4. 标签不可变；回滚=新建更高版本（通常 +patch）。

------

# 通用协议（两车道通用）

- **Base URL**：`/v1`
- **认证**：`Authorization: Bearer <token>`
- **分支选择**：`X-Git-Branch: main`（Simple 默认为 main；Detail 可自选）
- **并发控制**：
  - 读返回 `ETag: <resource_sha>`、`X-Head-SHA: <head_sha>`
  - 写带 `If-Match: <resource_sha>`（或 `If-Match-Head: <head_sha>`）
- **分页**：`limit` + `cursor`
- **错误**：RFC7807 `application/problem+json`（409=并发冲突、422=语义错误、423=索引锁）

------

# API 列表

> 采用**命名空间分流**：非技术用户走 `/v1/simple/...`；技术用户走 `/v1/detail/...`。两套端点操作同一仓库/索引。

## A. Simple（简化版，低门槛）

### 1) 时间线与查看

- `GET /v1/simple/prompts/{id}/timeline?view=releases|all&limit=&cursor=`
  - 默认 `view=releases`（只展示发布），`all` 展开草稿（按会话折叠）。
- `GET /v1/simple/prompts/{id}/content?ref=latest|v1.2.0|<sha>`
  - 返回指定版本的 Markdown（含 Front Matter）。

### 2) 草稿保存（隐藏分支）

- `POST /v1/simple/prompts/{id}/save`

  - Body：

    ```json
    {
      "content": "<markdown_with_front_matter>",
      "message": "可选注释",
      "idempotency_key": "uuid"
    }
    ```

  - 返回：`{ type:"draft", sha, saved_at, suggested_next_version }`

### 3) 发布版本（一键）

- `POST /v1/simple/prompts/{id}/publish`

  - Body：

    ```json
    {
      "base_sha": "<sha>",          // 一般用最新草稿 sha
      "channel": "prod|beta",
      "version": "auto|v1.2.0",
      "notes": "发布说明",
      "idempotency_key": "uuid"
    }
    ```

  - 行为：服务端在工作分支合入 `base_sha`，创建注释标签 `prompt/<id>/vX.Y.Z`。

  - 返回：`{ type:"release", version, channel, released_at, sha, notes }`

### 4) 对比与回滚

- `GET  /v1/simple/prompts/{id}/compare?from=<ver|sha>&to=<ver|sha|latest>`

  - 返回结构化字段差异（Front Matter）+ 文本 diff 统计。

- `POST /v1/simple/prompts/{id}/rollback`

  - Body：

    ```json
    {
      "to_version": "v1.1.0",
      "channel": "prod",
      "strategy": "revert_and_publish",  // 默认
      "version": "auto",
      "notes": "回滚原因"
    }
    ```

  - 行为：生成 revert 提交并立即发布新版本（通常 +patch）。

------

## B. Detail（技术版，完整 Git 视图）

### 1) 历史/差异/原文

- `GET  /v1/detail/prompts/{id}/history?limit=&cursor=&follow_renames=true`
- `GET  /v1/detail/prompts/{id}/diff?from=<sha|ver>&to=<sha|ver>`
- `GET  /v1/detail/prompts/{id}/raw?ref=<sha|ver|branch>`（`text/markdown`）
- `PUT  /v1/detail/prompts/{id}/raw`（`text/markdown`，需 `If-Match`）

### 2) 版本与标签（细粒度发布）

- `GET  /v1/detail/prompts/{id}/releases`（列出 `prompt/<id>/v*` 标签）

- `POST /v1/detail/prompts/{id}/releases`

  ```json
  {
    "base_sha": "<sha>",
    "version": "v1.2.0",
    "channel": "prod|beta",
    "notes": "发布说明",
    "payload": { "extra": "可扩展JSON" }
  }
  ```

- `DELETE /v1/detail/prompts/{id}/releases/{version}`（可禁用，若需保证标签不可变）

### 3) Git 操作（受限）

- `GET  /v1/detail/git/branches`
- `POST /v1/detail/git/checkout`      → `{ "branch":"feature/x", "create":false }`
- `POST /v1/detail/git/cherry-pick`   → `{ "sha":"...", "paths":["projects/.../prompt_*.md"] }`
- `POST /v1/detail/git/revert`        → `{ "sha":"...", "message":"..." }`
- `POST /v1/detail/git/tag`           → `{ "name":"prompt/<id>/v1.2.0", "sha":"...", "annotated":true, "message":"{...json...}" }`

### 4) 批量与迁移

- `POST /v1/detail/bulk/{project}/{kind}`（批量 upsert，单锁、单索引更新）
- `POST /v1/detail/admin/migrate-to-md`（旧库导出）
- `POST /v1/detail/admin/replay-history`（按时间重放为 Git 提交）

------

## C. 共享/管理端点（两车道都能用）

- `GET  /v1/search?project=&type=&labels=&slug=&author=&updated_from=&limit=&cursor=`
   （只读 `index.json`，不扫仓库）
- `GET  /v1/index/status`
- `POST /v1/index/repair`（快速修复缓存；同步执行）
- `POST /v1/index/rebuild`（全量重建；同步执行）
- `GET  /v1/schemas/frontmatter`
- `GET  /v1/schemas/index`
- `POST /v1/validate/frontmatter`  → `{content}` → `{valid, errors[]}`
- `GET  /v1/health` / `GET /v1/audit/logs?from=...`

------

# 关键行为约定（保证兼容与易用）

1. **自动版本建议（Simple 发布）**
   - 仅微调文案 → `+patch`；新增段落或标签 → `+minor`；协议/角色变更 → `+major`。可被用户覆盖。
2. **隐藏 UI 分支**
   - Simple 的 `save` 写入 `ui/<user>/<id>/<session>`；发布时由服务端进行 `fast-forward` 或受控 `no-ff merge` 合入工作分支。
3. **时间线折叠**
   - 同作者+同路径+30 分钟窗口合并为“一次编辑会话”；默认视图仅展示发布。
4. **回滚策略**
   - 默认 `revert_and_publish`：可追溯、不会篡改历史；标签不重写。
5. **索引一致性**
   - `publish/rollback` 成功后，服务端同步触发 `index/repair`（或按配置 `rebuild`），保证发布版本立刻可检索。

------

# 目录与依赖（简版）

```
repo_root/
  .git/
  .promptmeta/
    index.json
    index.lock
    schema/
      index.schema.json
      frontmatter.schema.json
  projects/
    default/
      prompts/
        prompt_<ulid>.md
      templates/
        template_<ulid>.md
      chats/
        chat_<ulid>.json
```

- 依赖建议：`dulwich`(Git)、`filelock`、`ruamel.yaml`（稳定键序）、`jsonschema`/`fastjsonschema`、`ulid-py`、`pathlib` 安全拼路径。

------

# 错误模型（范例）

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "If-Match does not match current resource sha",
  "resource_sha": "def",
  "head_sha": "abc"
}
```