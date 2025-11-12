# MyPromptManager

MyPromptManager 是一个基于 Markdown + YAML Front Matter 的 prompts / templates / chats 本地管理器。核心理念是**完全使用文件系统做版本管理**，再通过统一的 `/v1` REST API 对外暴露全部能力，前端使用 React 18 + Vite 作为控制台。

## 系统概览
- **后端**：Django + Django REST Framework，所有端点集中在 `apps/api/views.py` 中，URL 挂载在 `/v1`（见 `apps/api/urls.py`）。
- **文件存储**：`apps/core/services/file_storage_service.py` 负责读写 `repo_root/` 下的 Markdown 版本文件、HEAD 指针、版本号生成、聊天 JSON 等。
- **索引**：`apps/core/services/index_service.py` 维护 `.promptmeta/index.json`，提供搜索、状态查询、重建等操作。
- **前端**：`frontend/` 内的 React 应用消费统一 API，提供 Dashboard、Prompts/Templates/Chats、版本历史、索引页面。

## 功能亮点
1. **文件系统版本控制**：每个 prompt/template 都有独立目录、`HEAD`、不可变版本文件，版本元数据保存在 `prompt.yaml` / `template.yaml`。
2. **统一 API**：Prompts / Templates / Chats 均支持 CRUD、版本级别操作；还提供 Search、Index Status/Rebuild、Health Check。
3. **Chats 去重**：`POST /v1/chats` 支持 `provider + conversation_id` 自动去重，方便浏览器扩展同步对话。
4. **索引一致性**：所有写操作都会调用 `IndexService.add_or_update`，也可以通过 `/v1/index/rebuild` 从文件重新扫描。
5. **前端就绪**：内置 React 18 + Vite + Tailwind + shadcn/ui 的控制台，与 API 保持一致。

## 目录结构
```
MyPromptManager/
├── apps/
│   ├── api/                      # 统一 REST API（views + urls）
│   └── core/
│       ├── services/             # FileStorageService / IndexService
│       └── utils/frontmatter.py  # Front Matter 解析与序列化
├── config/                       # Django settings / urls
├── frontend/                     # React 控制台
├── repo_root/                    # 首次运行时自动创建的数据根目录
│   ├── prompts/
│   ├── templates/
│   ├── chats/
│   └── .promptmeta/index.json
├── scripts/                      # API 模拟器等脚本
├── schemas/                      # JSON Schema（提示 front matter）
├── manage.py
└── README.md
```

## 快速开始
### 依赖
- Python 3.10+
- Node.js 18+ 与 npm 9+
- （可选）pipx 或 venv

### 启动后端（Django + DRF）
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # http://127.0.0.1:8000
```
> 首次启动会在项目根目录创建 `repo_root/`，并在其中初始化 prompts/templates/chats 目录与 `.promptmeta`。

### 启动前端（React + Vite）
```bash
./start-frontend.sh          # 自动装依赖 + 探活后端 + 启动 Vite dev server
# 或手动
cd frontend
npm install
npm run dev                  # http://localhost:3000
```
前后端同时运行后，浏览器访问 http://localhost:3000 即可体验完整 UI。

### 常用脚本
```bash
python scripts/api_request_simulator.py --base-url http://127.0.0.1:8000 \
  --operations create update --types prompts templates
```
脚本会读取 `scripts/api_test_data.json`，批量验证统一 API 的写入/索引流程。

## 数据与版本模型
### Markdown + Front Matter
prompt/template 的主体是 Markdown，元数据使用 YAML/JSON Front Matter。`Metadata`（`apps/core/domain/metadata.py`）描述 id/title/type/labels/description/author/timestamps 以及 `versions`（`VersionSummary`）。

### 存储布局
```
repo_root/
├── prompts/
│   └── prompt_{slug}-{ULID}/
│       ├── prompt.yaml               # 完整 Metadata
│       ├── HEAD                      # 指向 versions/pv-*_*.md
│       └── versions/
│           └── pv-{id}_{version_id}.md  # Front Matter(版本号/作者/时间)+content
├── templates/
│   └── template_{slug}-{ULID}/
│       ├── template.yaml
│       ├── HEAD
│       └── versions/tv-{id}_{version_id}.md
└── chats/
    └── chat_{title-slug}-{ULID}.json     # 单文件存储完整对话
```
Chats 没有版本目录，更新时直接覆盖 JSON。

### 索引文件
- 位置：`repo_root/.promptmeta/index.json`，锁文件 `index.lock`。
- 结构：`prompts/templates/chats` 数组 + `last_updated`。
- 写操作调用 `IndexService.add_or_update`；`/v1/index/rebuild` 会扫描文件系统重新生成索引。

## REST API 总览
所有端点都在 `/v1` 前缀下，可匿名访问（`REST_FRAMEWORK` 默认 AllowAny & JSON）。详细输入输出文档请见 [`doc/API_REFERENCE.md`](doc/API_REFERENCE.md)。

| 功能 | 方法 | 路径 | 说明 |
|------|------|------|------|
| Prompts 列表/创建 | GET/POST | `/v1/prompts` | 标签过滤、创建 Markdown 内容 |
| Prompt 详情 | GET/PUT/DELETE | `/v1/prompts/{id}` | 读取 Metadata、创建新版本、彻底删除 |
| Prompt 版本 | GET | `/v1/prompts/{id}/versions` | 列出全部版本号 |
| Prompt 版本详情 | GET/DELETE | `/v1/prompts/{id}/versions/{version_id}` | 读取或删除指定版本 |
| Templates 列表/创建 | GET/POST | `/v1/templates` | 与 prompts 相同字段 |
| Template 详情 | GET/PUT/DELETE | `/v1/templates/{id}` | 支持 variables（见 API 文档） |
| Template 版本 | GET | `/v1/templates/{id}/versions` | 列出版本摘要 |
| Template 版本详情 | GET/DELETE | `/v1/templates/{id}/versions/{version_id}` | 获取/删除指定版本 |
| Chats 列表/创建 | GET/POST | `/v1/chats` | 支持 provider + conversation_id 去重 |
| Chat 详情 | GET/PUT/DELETE | `/v1/chats/{id}` | 获取、更新或删除某个对话 |
| 搜索 | GET | `/v1/search` | type/labels/slug/author/limit/cursor |
| 索引状态 | GET | `/v1/index/status` | 返回计数、last_updated、文件大小 |
| 重建索引 | POST | `/v1/index/rebuild` | 全量扫描 repo_root |
| 健康检查 | GET | `/v1/health` | 检查存储 + 索引健康度 |

## 前端特性概览
- Sidebar：Dashboard / Prompts / Templates / Chats / Releases / Timeline / Repo / Index。
- Topbar：全局搜索、项目切换、Simple ↔ Advanced、帮助等。
- 页面：列表 + 详情、版本历史、Index 状态、Timeline、Releases。
- UI：Tailwind + shadcn/ui 组件，内置亮暗色支持。

## 开发与测试
- 运行后端测试：`python manage.py test`
- 前端构建 / 检查：`cd frontend && npm run build && npm run lint`
- API 回归：`python scripts/api_request_simulator.py`

## 配置与环境变量
```
DJANGO_SECRET_KEY=dev-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
STORAGE_ROOT=/absolute/path/to/repo_root   # 可选，默认 <project>/repo_root
```
- 索引相关：`INDEX_PATH` 与 `INDEX_LOCK_PATH` 从 `STORAGE_ROOT` 派生。
- CORS：默认 `CORS_ALLOW_ALL_ORIGINS=True` 便于本地联调。

## 安全提示
仓库默认面向本地单人使用，**未启用**认证/授权，所有 API 均可匿名访问，数据存储在本地目录 + SQLite。若要对外提供服务，请自行增加认证、启用 HTTPS、迁移到受控的持久化存储。

## 许可
MIT License。
