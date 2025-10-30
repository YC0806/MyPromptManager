# MyPromptManager

## 架构规划

- **项目结构**：保持标准 Django 项目骨架，核心逻辑位于 `prompts`（Markdown 存储与索引）与 `api`（REST API）两个模块。
- **主存储方案**：所有提示词与模板版本以 `.md` 文件保存，文件首部使用 YAML Front Matter 承载名称、标签、版本号、元数据、创建人、placeholders 等信息。
- **统一索引**：`storage/index.json` 记录所有提示词/模板的概要信息（ID、slug、标签、版本列表、活动版本、时间戳），API 列表/检索直接读取索引。
- **服务层 (`prompts/services.py`)**：围绕 `MarkdownStore` 封装创建、更新、版本追加、回滚、标签维护等操作，隐藏具体文件读写与索引更新细节。
- **视图 (`api/views.py`)**：基于 DRF `ViewSet` 实现，提供提示词与模板的 CRUD、版本创建/回滚以及简单的查询过滤（`search`、`tags__name`、`is_archived`）。
- **序列化 (`api/serializers.py`)**：使用纯 `Serializer`，对接服务层返回的 dataclass 结构；在请求上下文中提取用户信息以写入元数据。
- **标签体系**：索引文件内维护全局标签列表；新增提示词或手动创建标签时自动去重并生成 slug，支持通过 API 删除未使用的标签。
- **测试策略**：`prompts/tests` 针对 Markdown 读写、版本递增、回滚逻辑进行单元测试；`api/tests` 在临时目录中模拟完整 REST 调用流程。

## 存储结构

- `storage/index.json`：索引文件，含 `prompts`、`templates`、`tags` 三级结构。
- `storage/prompts/<slug>/v00X.md`：提示词版本文件，Front Matter 保存提示词元数据与版本信息，正文为具体内容。
- `storage/templates/<slug>/v00X.md`：模板版本文件，Front Matter 除基础字段外还包含 `placeholders` 和 `render_example`。

## 快速开始

### 后端启动

1. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
2. 首次运行仍需初始化 Django 内置表（用户认证等）：
   ```bash
   python MyPromptManager/manage.py migrate
   ```
3. 启动开发服务器：
   ```bash
   python MyPromptManager/manage.py runserver
   ```
4. （可选）创建管理员账号以使用 Django 自带认证体系：
   ```bash
   python MyPromptManager/manage.py createsuperuser
   ```
5. 运行测试（会自动使用临时存储目录）：
   ```bash
   python MyPromptManager/manage.py test
   ```

默认情况下，数据会写入 `storage/` 目录；如需自定义路径，可通过环境变量 `PROMPT_STORAGE_ROOT` 指定。

### 前端启动

1. 进入前端目录并安装依赖：
   ```bash
   cd frontend
   npm install
   ```
2. 启动开发服务器：
   ```bash
   npm run dev
   ```
3. 访问 `http://localhost:5173` 查看应用

前端使用 React + TypeScript + Vite 构建，提供现代化的用户界面。

## 前端特性

### 现代简约设计风格

前端界面经过精心设计，采用现代简约风格：

- **渐变背景**：使用柔和的渐变色彩营造视觉深度
- **流畅动画**：页面元素带有淡入、滑入等动画效果，提供流畅的用户体验
- **精美阴影**：卡片和按钮使用多层次阴影，增强立体感
- **交互反馈**：按钮和卡片的 hover 效果，提供即时的视觉反馈
- **图标系统**：使用 emoji 图标为各个功能区域增添视觉识别度
- **响应式设计**：适配不同屏幕尺寸，在移动设备上也能良好显示

### 主要组件

- **侧边栏导航**：带有渐变色条的现代侧边栏，每个导航项都有图标
- **统计卡片**：在 Prompts、Templates 和 Tags 页面展示数据概览
- **搜索过滤**：增强的搜索和标签过滤功能
- **表格展示**：优化的数据表格，hover 效果和渐变表头
- **加载状态**：优雅的加载动画和空状态提示

### 颜色方案

- 主色调：蓝色渐变（#3b82f6 到 #2563eb）
- 辅助色：紫色（#8b5cf6）、灰色系列
- 背景：浅灰渐变（#f5f7fa 到 #e9ecef）
- 强调色：红色渐变用于删除等危险操作

## API 概览

所有接口挂载在 `/api/` 前缀下，写操作默认需要登录用户（Session 或 Basic Auth）。

- `GET /api/prompts/`：提示词列表，支持 `search`、`tags__name`（逗号分隔或重复参数）、`is_archived`。
- `POST /api/prompts/`：创建提示词并生成首个版本（`content` 必填，支持附带 `metadata` 与 `tags`）。
- `PATCH /api/prompts/{id}/`：更新基础信息；若提供 `content` 则追加一个新版本。
- `DELETE /api/prompts/{id}/`：从索引中删除该提示词及其 Markdown 文件。
- `POST /api/prompt-versions/`：为现有提示词追加版本。
- `POST /api/prompt-versions/{prompt_id}:v{n}/restore/`：以历史版本为模板生成新版本。
- `GET /api/prompt-templates/` / `POST /api/prompt-templates/`：模板的列表与创建，支持传入 `placeholders` 与 `render_example`。
- `POST /api/prompt-template-versions/{template_id}:v{n}/restore/`：模板版本回滚。
- `GET /api/tags/` / `POST /api/tags/` / `DELETE /api/tags/{slug}/`：标签列表、创建与删除。

版本接口返回的 `id` 形如 `{prompt_id}:v{number}`，可直接用于 `restore` 操作。筛选、分页参数沿用 Django REST Framework 的默认语义。
