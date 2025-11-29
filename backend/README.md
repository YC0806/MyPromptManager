# MyPromptManager 后端

Django + DRF 实现的 Prompt/Template/Chat 管理后端，使用本地文件作为存储并提供简单的版本管理。默认 API 前缀为 `http://localhost:8000/v1/`。

## 主要特性
- Prompt 与 Template 的文件化版本管理，元数据（YAML）与正文（Markdown + front matter）分离。
- Template 支持变量描述（类型、默认值等），便于渲染或校验。
- Chat 记录支持按 `provider + conversation_id` 去重更新，自动计算对话轮次（按 user 消息计数）。
- 内置 `index.json` 索引与 `/v1/search` 查询，提供 `/v1/index/status`、`/v1/index/rebuild` 管理接口。
- 默认无鉴权，便于本地开发与集成。

## 快速开始
1) 准备环境（建议 Python 3.10+）  
```bash
python -m venv .venv
source .venv/bin/activate  # Windows 使用 .venv\Scripts\activate
pip install -r requirements.txt
```
2) 配置环境变量（复制 `.env.example` 后按需修改）：
   - `DJANGO_SECRET_KEY`：开发可随意，生产需替换。
   - `DJANGO_DEBUG` / `DJANGO_ALLOWED_HOSTS`：调试与访问控制。
   - `STORAGE_ROOT`（或 `GIT_REPO_ROOT`）：文件存储根目录，默认 `<项目根>/repo_root`。
3) 初始化数据库（仅审计日志使用，prompt/template/chat 不入库）：  
```bash
python manage.py migrate
```
4) 启动服务：  
```bash
python manage.py runserver 0.0.0.0:8000
```
5) 打开 `http://localhost:8000/v1/`（详见下方 API 参考）。

## 数据与存储结构
- 存储根（`STORAGE_ROOT` 或 `GIT_REPO_ROOT`）下的布局：
  - `prompts/prompt-<prompt_id>/prompt.yaml`：完整元数据；`versions/pv-<prompt_id>_<version_id>.md`：正文 + 最小化 front matter；`HEAD` 指向当前版本。
  - `templates/template-<template_id>/template.yaml` 与 `versions/tv-<template_id>_<version_id>.md`：结构同上，front matter 还包含 `variables`。
  - `chats/chat_<title-slug>-<chat_id>.json`：单文件存储聊天记录。
- 索引文件路径：`<STORAGE_ROOT>/.promptmeta/index.json`，包含 prompts/templates/chats 的摘要，维护 `last_updated`、`last_error` 等元信息，锁文件位于同目录 `index.lock`。

## 索引与搜索
- 搜索：`GET /v1/search`，支持 `type`、`labels`、`author`、`slug`、`limit`、`cursor`，结果来自 index 缓存。
- 索引状态：`GET /v1/index/status` 返回各类型数量、索引大小、更新时间、上次错误等。
- 索引重建：`POST /v1/index/rebuild` 从存储全量扫描重建索引（返回统计与错误列表）。

## API 文档
- 详见同目录下的 [`API_REFERENCE.md`](./API_REFERENCE.md)，内容与 `apps/api/views.py` 保持同步并以实际响应为准。
- 浏览器插件侧的调用示例可参考 `browser-extension/API_INTEGRATION.md`（其中包含的 `/v1/health` 等端点目前未在后端实现，按需取用）。

## 自检与辅助脚本
- 若需对接或回归测试，可启用服务器后运行 `python tests/api/run_api_tests.py --base-url http://localhost:8000/v1`；请先根据真实接口调整 `tests/api/api_test_cases.json`，其中默认包含部分尚未实现的端点。 
- 也可使用 Postman/curl 直接根据 API 参考手动验证。



# TODO
- 前端内容提交失败后会丢失，而非暂时保留
- 搜索栏输入内容后，当焦点不在搜索框和搜索结果框后，收起搜索结果框
- Metadata和Content加载顺序是否会对内容显示有影响？