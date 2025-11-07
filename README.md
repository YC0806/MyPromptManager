# MyPromptManager

基于 Markdown + YAML Front Matter + JSON 索引 + Git 版本控制的提示词管理工具。

> 🎯 **本地版本**：专为本地使用设计，无需登录和身份验证，开箱即用！

## 核心特性

- **双车道设计**：Simple API（低门槛）和 Detail API（技术版）
- **Git 原生版本控制**：使用 Git 标签进行语义化版本管理
- **索引缓存**：快速搜索和查询，支持并发控制
- **草稿系统**：使用隐藏 UI 分支进行草稿保存
- **发布管理**：支持多渠道发布（prod/beta）和回滚
- **无需身份验证**：本地使用，直接访问所有功能

## 快速开始

### 后端设置

#### 1. 安装依赖

```bash
pip install -r requirements.txt
```

#### 2. 初始化数据库

```bash
python manage.py migrate
```

#### 3. 运行开发服务器

```bash
python manage.py runserver
```

后端服务将在 http://127.0.0.1:8000 启动。

### 前端设置

#### 1. 进入前端目录并安装依赖

```bash
cd frontend
npm install
```

#### 2. 运行开发服务器

```bash
npm run dev
```

前端应用将在 http://localhost:3000 启动。

### Git 数据目录与索引

项目使用独立的 Git 仓库存放所有 Markdown 内容。默认路径是 `repo_root/`（可通过 `GIT_REPO_ROOT` 环境变量覆盖），其布局如下：

- `.git/`：dulwich 初始化的 Git 数据目录
- `.promptmeta/index.json`：索引缓存，由 `IndexService` + filelock 维护
- `prompts/`：提示词 Markdown
- `templates/`：模版 Markdown

可通过以下方式管理索引：

- `GET /v1/index/status`：查看索引文件元数据与统计
- `POST /v1/index/rebuild`：扫描 Git 仓库并重建索引
- `POST /v1/index/repair`：针对损坏索引的快速修复

### 管理提示词 / 模版数据

1. **直接编辑仓库**：在 `repo_root/prompts/*.md` 或 `repo_root/templates/*.md` 中维护带 Front Matter 的 Markdown，并推送到 Git。
2. **通过 API 操作**：Simple API 负责草稿保存与发布，Detail API 提供原始读写、Diff、Tag 等全量能力。
3. **刷新索引**：新增/重命名文件后，调用 `POST /v1/index/rebuild` 或 `POST /v1/index/repair` 以让搜索结果同步。
4. **版本追踪**：`VersionService` 使用 `prompt/<id>/vX.Y.Z` 形式的 Git 标签来记录发布元数据（channel、notes 等）。

> 💡 仓库仍保留 `generate_test_data.py`，运行前请先阅读脚本并确认其输出路径与当前 `repo_root` 结构一致。

### API 自检

`test_api_endpoints.py` 使用 Django `RequestFactory` 对 Simple/Detail/Common API 做冒烟测试，确保 prompt/template 路由均可解析：

```bash
python test_api_endpoints.py
```

如需手动探活，可执行：

```bash
curl http://127.0.0.1:8000/v1/health
curl "http://127.0.0.1:8000/v1/search?type=prompt"
```

更多排查记录参见 [doc/BACKEND_FIXES.md](doc/BACKEND_FIXES.md)。

### 完整开发环境

**方式 1：使用启动脚本（推荐）**

```bash
# 终端 1 - 后端
python manage.py runserver

# 终端 2 - 前端
./start-frontend.sh
```

**方式 2：手动启动**

```bash
# 终端 1 - 后端
python manage.py runserver

# 终端 2 - 前端
cd frontend && npm run dev
```

访问 http://localhost:3000 即可使用完整应用，**无需登录**！

> 📖 详细安装与排错步骤请查看 [doc/LOCAL_SETUP.md](doc/LOCAL_SETUP.md)

## API 端点

### Simple API（简化版 - `/v1/simple/`）

面向非技术用户，所有端点同时支持 `prompts/{id}` 与 `templates/{id}` 路径：

- `GET .../timeline`：查看发布时间线（支持 release / draft 视图）
- `GET .../content`：按版本或最新发布读取内容与 Front Matter
- `POST .../save`：保存草稿（UI 分支）
- `POST .../publish`：发布版本并创建标签
- `GET .../compare`：比较两个版本的内容与元数据
- `POST .../rollback`：基于指定版本回滚并重新发布

### Detail API（技术版 - `/v1/detail/`）

为技术用户提供完整 Git 能力，同样兼容 prompt/template：

- `GET .../history`：查看文件提交历史
- `GET .../diff`：比较任意两个引用（SHA/分支/标签）
- `GET .../raw` / `PUT .../raw`：读取或写入原始 Markdown（带 ETag 校验）
- `GET .../releases` / `POST .../releases`：列出或创建版本标签
- `GET /v1/detail/git/branches`：列出分支
- `POST /v1/detail/git/checkout`：切换/创建分支
- `POST /v1/detail/git/tag`：创建轻量或注释标签

### Common API（共享端点 - `/v1/`）

两个车道都可以使用：

- `GET /v1/search` - 搜索提示词/模板
- `GET /v1/index/status` - 索引状态
- `POST /v1/index/repair` - 修复索引
- `POST /v1/index/rebuild` - 重建索引
- `GET /v1/schemas/frontmatter` - Front Matter Schema
- `GET /v1/schemas/index` - Index Schema
- `POST /v1/validate/frontmatter` - 验证 Front Matter
- `GET /v1/health` - 健康检查

> 更详细的请求/响应示例见 [doc/API_ENDPOINTS.md](doc/API_ENDPOINTS.md)。

## 架构说明

### 目录结构

```
MyPromptManager/
├── apps/
│   ├── api_common/        # 共享 API（搜索、索引、Schema）
│   ├── api_detail/        # 技术版 API
│   ├── api_simple/        # 简化版 API
│   └── core/              # Git / Index / Version 服务
├── config/                # Django 配置
├── doc/                   # 深入文档与迁移笔记
├── frontend/              # React + Vite 前端
│   ├── src/
│   └── package.json
├── repo_root/             # 默认 Git 仓库（可通过 GIT_REPO_ROOT 覆盖）
│   ├── .git/
│   ├── .promptmeta/
│   │   └── index.json
│   ├── prompts/
│   └── templates/
├── schemas/               # JSON Schema 定义
├── start-frontend.sh      # 前端启动脚本
├── test_api_endpoints.py  # API 冒烟测试
├── generate_test_data.py  # （可选）示例数据脚本
├── manage.py              # Django 管理脚本
├── requirements.txt       # Python 依赖
└── README.md
```

### 技术栈

#### 后端
- **框架**: Django 4.2 + Django REST Framework
- **Git 库**: dulwich (纯 Python Git 实现)
- **并发控制**: filelock + ETag
- **数据格式**: YAML (ruamel.yaml) + JSON

#### 前端
- **框架**: React 18 + Vite
- **样式**: Tailwind CSS
- **路由**: React Router
- **HTTP 客户端**: Axios
- **图标**: Lucide React

### 数据模型

#### Markdown 文件格式

```markdown
---
id: 01HQXYZ123ABC456DEF789
title: My Awesome Prompt
description: A helpful prompt for...
type: prompt
slug: my-awesome-prompt
labels:
  - ai
  - coding
author: john.doe
created_at: 2024-01-01T00:00:00Z
updated_at: 2024-01-01T00:00:00Z
---

# Prompt Content

Your prompt content goes here...
```

可根据需要在 Front Matter 中扩展自定义字段（如 project、locale 等），索引服务会保留未知字段。

#### Git 标签命名

- 格式：`prompt/<ULID>/vX.Y.Z`
- 示例：`prompt/01HQXYZ123ABC456DEF789/v1.0.0`
- 标签消息包含 JSON 元数据

#### 分支策略

- `main` - 主分支（默认工作分支）
- `ui/<user>/<prompt_id>/<session>` - UI 草稿分支（隐藏）
- `feature/*` - 功能分支（Detail 用户可用）

## 环境变量

在生产环境中，建议配置以下环境变量：

```bash
# Django 配置
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-domain.com

# Git 仓库配置
GIT_REPO_ROOT=/path/to/repo
GIT_DEFAULT_BRANCH=main
```

## 开发指南

### 添加新功能

1. 在 `apps/core/services/` 添加服务层逻辑
2. 在对应的 API 模块添加视图
3. 更新 URL 路由
4. 编写测试

### 运行测试

```bash
python test_api_endpoints.py  # 快速验证路由与视图 wiring
python manage.py test         # 运行 Django 测试用例
```

`test_api_endpoints.py` 使用 `RequestFactory` 检查 prompt / template 分支是否都能被各个视图接受，可在实现新端点后先跑一遍冒烟测试。

### 代码规范

- 使用 Black 格式化代码
- 遵循 PEP 8 规范
- 添加类型提示

## 安全注意事项

- 生产环境必须配置 `DJANGO_SECRET_KEY`
- 使用 HTTPS
- 启用 CSRF 保护
- 实施适当的权限控制
- 定期备份 Git 仓库

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
