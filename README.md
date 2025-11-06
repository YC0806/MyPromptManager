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

### 测试数据生成（可选）

如果需要一些测试数据来快速体验功能：

```bash
# 生成测试数据（5 个提示词 + 3 个模版 + 2 个对话历史）
python generate_test_data.py

# 验证测试数据
./verify_test_data.sh

# 查看测试数据演示
./demo_test_data.sh
```

测试数据包括：
- ✅ 5 个提示词（代码审查助手、API 文档生成器、SQL 查询优化器等）
- ✅ 3 个模版（代码生成模版、测试用例模版、数据分析模版）
- ✅ 2 个对话历史（代码重构讨论、API 设计讨论）
- ✅ 3 个已发布版本（v1.0.0）

详见：[TEST_DATA_README.md](TEST_DATA_README.md)

### 后端 API 测试

验证后端 API 是否正常工作：

```bash
# 运行自动化测试
./test_backend_apis.sh

# 或手动测试单个端点
curl http://127.0.0.1:8000/v1/health
curl http://127.0.0.1:8000/v1/search?project=default
```

所有后端问题已修复，详见：[BACKEND_FIXES.md](BACKEND_FIXES.md)

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

> 📖 详细说明请查看 [LOCAL_SETUP.md](LOCAL_SETUP.md)

## API 端点

### Simple API（简化版 - `/v1/simple/`）

适合非技术用户，提供简化的操作界面：

- `GET /v1/simple/prompts/{id}/timeline` - 查看时间线
- `GET /v1/simple/prompts/{id}/content` - 获取内容
- `POST /v1/simple/prompts/{id}/save` - 保存草稿
- `POST /v1/simple/prompts/{id}/publish` - 发布版本
- `GET /v1/simple/prompts/{id}/compare` - 比较版本
- `POST /v1/simple/prompts/{id}/rollback` - 回滚版本

### Detail API（技术版 - `/v1/detail/`）

适合技术用户，提供完整的 Git 访问：

- `GET /v1/detail/prompts/{id}/history` - 完整提交历史
- `GET /v1/detail/prompts/{id}/diff` - 详细差异对比
- `GET /v1/detail/prompts/{id}/raw` - 读取原始 Markdown
- `PUT /v1/detail/prompts/{id}/raw` - 更新原始 Markdown
- `GET /v1/detail/prompts/{id}/releases` - 列出所有发布
- `POST /v1/detail/prompts/{id}/releases` - 创建发布
- `GET /v1/detail/git/branches` - 列出分支
- `POST /v1/detail/git/checkout` - 切换分支
- `POST /v1/detail/git/tag` - 创建标签

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

## 架构说明

### 目录结构

```
MyPromptManager/
├── config/                 # Django 配置
├── apps/
│   ├── core/              # 核心服务层
│   │   ├── services/      # Git、索引、版本管理服务
│   │   └── utils/         # 工具函数
│   ├── api_simple/        # Simple API
│   ├── api_detail/        # Detail API
│   └── api_common/        # 共享 API
├── frontend/              # React 前端应用
│   ├── src/
│   │   ├── components/   # React 组件
│   │   ├── pages/        # 页面组件
│   │   ├── lib/          # 工具库和 API 客户端
│   │   └── App.jsx       # 主应用组件
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── repo_root/             # Git 仓库（存储提示词数据）
│   ├── .git/             # Git 仓库
│   ├── .promptmeta/      # 索引和元数据
│   └── projects/         # 项目数据
│       └── default/
│           ├── prompts/  # 提示词文件
│           ├── templates/# 模版文件
│           └── chats/    # 对话历史
├── schemas/               # JSON Schema 定义
├── requirements.txt       # Python 依赖
├── manage.py             # Django 管理脚本
├── generate_test_data.py  # 测试数据生成脚本 ⭐
├── verify_test_data.sh    # 测试数据验证脚本 ⭐
├── demo_test_data.sh      # 测试数据演示脚本 ⭐
├── README.md             # 项目文档
└── TEST_DATA_README.md    # 测试数据说明 ⭐
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
project: default
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
python manage.py test
```

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