# MyPromptManager 文档

本目录包含 MyPromptManager 项目的技术文档。

## 📚 当前文档

### [API_REFERENCE.md](API_REFERENCE.md) ⭐
**完整的 REST API 参考文档** - 所有后端 API 端点的详细说明

**主要内容:**
- 所有 API 端点的完整列表（Prompts、Templates、Chats、Search、Index、Health）
- 每个端点的请求参数和响应格式
- JSON 数据模型和字段说明
- 错误响应格式
- Python、JavaScript、cURL 使用示例

**适用场景:** API 集成开发、前端对接、测试脚本编写

### [ARCHITECTURE_CHANGES.md](ARCHITECTURE_CHANGES.md)
**架构重构说明** - 记录了从 Git-based 到 File-based 版本控制系统的重要架构变更

**主要内容:**
- 存储机制从 Git 迁移到文件系统的设计
- 文件结构和版本模型说明
- API 架构从双规制(simple/detail)统一到单一 `/v1` API
- 核心服务变更(FileStorageService vs GitService)
- API 端点对照表

**适用场景:** 了解项目架构演进历史、理解当前文件系统版本控制设计

---

## 📦 归档文档

[archive/](archive/) 目录包含历史文档,这些文档描述的是已废弃的架构或已完成的迁移工作:

### 旧 API 架构文档
- `API_ENDPOINTS.md` - 旧的 simple/detail API 端点说明
- `API_MIGRATION_GUIDE.md` - Prompt/Template 区分迁移指南
- `API_CHANGES_SUMMARY.md` - API 变更总结
- `FRONTEND_MIGRATION.md` - 前端 API 迁移指南

### 历史修复和设置文档
- `BACKEND_FIXES.md` - 后端问题修复总结
- `DATABASE_MIGRATION_FIX.md` - 数据库迁移修复
- `NO_AUTH_CHANGES.md` - 移除身份验证功能变更
- `FINAL_SETUP_SUMMARY.md` - 最终设置总结
- `LOCAL_SETUP.md` - 本地设置指南
- `FRONTEND_SETUP.md` - 前端设置指南
- `FRONTEND_README.md` - 前端 README

### 测试和快速启动文档
- `IMPLEMENTATION_COMPLETE.md` - 实现完成总结
- `QUICK_START.md` - 快速启动指南(已过时)
- `QUICK_START_FRONTEND.md` - 前端快速启动
- `QUICK_TEST.md` - 快速测试指南
- `TEST_DATA_README.md` - 测试数据说明
- `TEST_DATA_SUMMARY.md` - 测试数据总结
- `TEST_PROJECTS_README.md` - 测试项目说明

### 设计和需求文档
- `TEMPLATE_DETAIL_DESIGN.md` - Template 详情页设计
- `PROJECT_SUMMARY.md` - 项目完成总结(Git-based架构)
- `CLAUDE.md` - 原始项目需求(Git-based架构)
- `USAGE_EXAMPLES.md` - API 使用示例(旧架构)

---

## 🚀 快速开始

项目的最新使用指南请参考根目录的 [../README.md](../README.md)

### 核心特性
- 基于文件系统的版本控制
- 统一的 `/v1` REST API
- React 18 前端界面
- 无需身份验证的本地使用模式

### 快速启动
```bash
# 后端
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 前端
./start-frontend.sh
# 或
cd frontend && npm install && npm run dev
```

---

## 📖 相关文档

- **项目 README**: [../README.md](../README.md) - 项目概述、功能特性、快速开始
- **API 文档**: 查看 [apps/api/views.py](../apps/api/views.py) 的文档字符串
- **前端组件**: 查看 [frontend/src/](../frontend/src/) 目录下的组件代码注释

---

最后更新: 2025-11-09
