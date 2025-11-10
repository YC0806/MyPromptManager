# MyPromptManager

基于 Markdown + YAML Front Matter 的提示词/模版/对话管理工具，使用本地文件系统进行版本控制，并通过统一的 REST API 暴露所有能力。

> 🎯 **当前版本亮点**：本地优先、无需认证、文件系统版本管理、统一 `/v1` API、React 控制台。

## 核心特性

- **文件系统版本控制**：`apps/core/services/file_storage_service.py` 负责在 `repo_root/` 下管理版本目录、HEAD 指针和不可变版本文件。
- **统一 API**：`apps/api/` 合并了 Simple/Detail/Common 端点，提供 prompts/templates/chats CRUD、版本历史、搜索、索引与健康检查。
- **本地使用无需登录**：`REST_FRAMEWORK` 配置为 AllowAny，开发环境开箱即用。
- **现代化前端**：React 18 + Vite + Tailwind + shadcn/ui，内置 Simple / Advanced 模式、Dashboard、Prompts/Templates/Chats 列表、版本历史、索引状态等页面。
- **快速索引与搜索**：`IndexService` 管理 `.promptmeta/index.json`，支持标签/作者/slug 过滤和文件锁并发控制。
- **自动化脚本**：`start-frontend.sh`、`scripts/api_request_simulator.py` 等工具帮助自检与演示。

## 快速开始

### 运行环境
- Python 3.10+
- Node.js 18+ / npm 9+
- 可选：`pipx` 或虚拟环境

### 后端（Django + DRF）
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # 默认监听 http://127.0.0.1:8000
```

### 前端（React + Vite）
```bash
./start-frontend.sh        # 自动安装依赖、探活后端并运行 vite dev server
# 或手动
cd frontend
npm install
npm run dev                # 前端默认 http://localhost:3000
```

前后端启动后，浏览器访问 http://localhost:3000 即可体验完整应用（无需登录）。

### 常用脚本
```bash
python scripts/api_request_simulator.py --base-url http://127.0.0.1:8000 \
  --operations create update --types prompts templates
```
^ 读取 `scripts/api_test_data.json`，批量验证统一 API 的创建/更新/删除流程。

## 项目结构概览
```
MyPromptManager/
├── apps/
│   ├── api/                      # 统一 REST API（prompts/templates/chats/index/search/health）
│   └── core/
│       ├── services/
│       │   ├── file_storage_service.py
│       │   └── index_service.py
│       └── utils/frontmatter.py
├── config/                       # Django 配置（settings/urls）
├── frontend/                     # React 应用（Sidebar、Topbar、Dashboard、列表、详情、索引等页面）
├── repo_root/                    # 本地数据目录（首次运行会自动创建）
│   ├── prompts/
│   ├── templates/
│   └── chats/
├── schemas/                      # JSON Schema（可供 IDE 校验 Front Matter）
├── scripts/api_request_simulator.py
├── manage.py
└── README.md
```
> 旧的 `apps/api_simple|api_detail|api_common` 仍保留在仓库中，供迁移参考，但 `config/urls.py` 只加载新的 `apps.api` 路由。

## 文件存储与版本模型

### Markdown + Front Matter
所有 prompts/templates 仍以 Markdown + YAML/JSON Front Matter 存储，最小示例如下：

```markdown
---
id: 01HQXYZ123ABC456DEF789
title: Personalized Support Reply
description: Auto-generate support replies based on context
type: prompt
slug: support-reply
labels: [support, email]
author: jane.doe
created_at: 2024-11-05T08:00:00Z
updated_at: 2024-11-05T08:00:00Z
---

# Reply Template
...
```

### 目录布局
```
repo_root/
├── prompts/
│   └── prompt_{slug}-{ULID}/
│       ├── prompt.yaml         # 最新元数据（供索引与前端展示）
│       ├── HEAD                # 指向当前版本（例如 versions/pv_slug-id_2025-01-01T08-00Z_A1B2C.md）
│       └── versions/
│           └── pv_{slug}-{ULID}_{timestamp}_{suffix}.md
├── templates/
│   └── template_{slug}-{ULID}/
│       ├── template.yaml
│       ├── HEAD
│       └── versions/tv_{slug}-{ULID}_{timestamp}_{suffix}.md
└── chats/
    └── chat_{title-slug}-{ULID}.json
```
- `FileStorageService` 负责确保目录存在、写入 Front Matter + 内容、维护 HEAD 指针、生成 `YYYY-MM-DDTHH-MMZ_suffix` 形式的 `version_id`。
- Chats 为 JSON 文件，不做多版本管理，直接覆盖。

### 索引文件
- 索引路径：`repo_root/.promptmeta/index.json`，锁文件：`index.lock`。
- `IndexService` 通过 `filelock` 序列化写入，保存 prompts/templates/chats 的摘要信息（标题、标签、作者、文件路径等）。
- `/v1/index/rebuild` 会扫描 `repo_root` 重新生成索引，适合手动修改文件或修复损坏索引时使用。

## API 总览（`/v1` 前缀）
所有端点均定义在 `apps/api/views.py`，默认允许匿名访问，错误响应遵循 RFC7807。

| 资源 | 列表 / 创建 | 详情 (GET/PUT/DELETE) | 版本列表 | 版本详情 |
|------|-------------|-----------------------|----------|----------|
| Prompts | `GET/POST /v1/prompts` | `/v1/prompts/{id}` | `/v1/prompts/{id}/versions` | `/v1/prompts/{id}/versions/{version_id}` |
| Templates | `GET/POST /v1/templates` | `/v1/templates/{id}` | `/v1/templates/{id}/versions` | `/v1/templates/{id}/versions/{version_id}` |
| Chats | `GET/POST /v1/chats` | `/v1/chats/{id}` | – | – |
| 搜索 | `GET /v1/search?type=prompt&labels=...` | | | |
| 索引 | `GET /v1/index/status` / `POST /v1/index/rebuild` | | | |
| 健康检查 | `GET /v1/health` | | | |

### 典型请求
```bash
# 创建 Prompt（content 内含 Front Matter）
cat <<'EOF' | curl -X POST http://127.0.0.1:8000/v1/prompts \
  -H 'Content-Type: application/json' -d @-
{
  "content": "---\n{\n  \"title\": \"Release Checklist\",\n  \"type\": \"prompt\",\n  \"labels\": [\"release\"],\n  \"author\": \"local\"\n}\n---\n\n# Steps\n- [ ] Review code\n- [ ] Run tests\n"
}
EOF

# 列出版本
prompt_id="01HQXYZ123ABC456DEF789"
curl http://127.0.0.1:8000/v1/prompts/$prompt_id/versions

# 获取指定版本
curl http://127.0.0.1:8000/v1/prompts/$prompt_id/versions/2025-01-02T10-00Z_AB12C

# 搜索模板
curl "http://127.0.0.1:8000/v1/search?type=template&limit=5"

# 查看索引状态
curl http://127.0.0.1:8000/v1/index/status
```

## React 控制台
- **Sidebar**：分组导航（Dashboard / Prompts / Templates / Chats / Releases / Timeline / Repo / Index）。
- **Topbar**：项目选择、Simple ↔ Advanced 切换、全局搜索、帮助/设置按钮。
- **页面**：Dashboard、Prompts/Templates 列表 + 详情、Chats、Timeline、Releases、Repo Advanced、Index Status。
- **交互**：表格/卡片视图切换、标签过滤、版本时间线、复制按钮、响应式布局。
- **状态管理**：`frontend/src/store/useStore.js` 负责模式、筛选、Sidebar 折叠等 UI 状态。

## 索引维护与调试
- `GET /v1/index/status`：返回 prompts/templates/chats 计数、最后更新时间、索引文件大小。
- `POST /v1/index/rebuild`：全量重建（当手动移动文件或索引损坏时触发）。
- `scripts/api_request_simulator.py`：配合 `scripts/api_test_data.json` 进行端到端验证。
- 审计：`apps/core/models.py` 中的 `AuditLog` 记录 API 行为，可协助排查。

## 测试与质量
- `python manage.py test`：运行 Django/DRF 测试（可按需新增用例）。
- `npm run build` / `npm run lint`：前端构建与静态检查。
- `python scripts/api_request_simulator.py ...`：模拟真实请求流，确保统一 API 与索引刷新正常。

## 环境变量
```bash
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
STORAGE_ROOT=/absolute/path/to/repo_root   # 可选；默认使用项目根下的 repo_root/
# 兼容旧配置：若未设置 STORAGE_ROOT，会退回 GIT_REPO_ROOT
```
- 默认开启 `CORS_ALLOW_ALL_ORIGINS=True`，方便本地前端访问。
- 若要部署生产，请重新启用认证、限制 CORS、配置 HTTPS。

## 安全提示
此仓库默认面向 **本地单人使用**：
- 未启用身份验证或权限控制。
- 所有 API 均可匿名访问。
- 数据存储在本地文件夹 + SQLite，请注意备份与磁盘权限。

若需要公网/多用户场景，请恢复 TokenAuth、配置 HTTPS、使用受控的数据库与存储。

## 许可证
MIT License。

## 贡献方式
欢迎提交 Issue / PR：
1. 遵循 Tailwind + shadcn/ui 设计与色板。
2. 为复杂逻辑补充注释与测试。
3. 在提交前运行 `python manage.py test` 与 `npm run build`。
