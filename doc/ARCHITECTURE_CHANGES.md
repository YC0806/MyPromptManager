# 架构重构说明

## 概述

本次重构将项目从基于Git的存储系统迁移到基于文件系统的版本控制，并统一了API架构，移除了之前的simple/detail双规制API。

## 主要变更

### 1. 存储机制变更

#### 之前（Git-based）
- 使用Dulwich库操作Git仓库
- 版本控制依赖Git的commit和tag
- 分支管理（main、UI分支等）
- Git blob SHA作为版本标识

#### 现在（File-based）
- 使用文件系统存储版本
- 版本文件不可变（只追加、不修改）
- HEAD指针指向当前版本
- 基于时间戳的版本ID

### 2. 文件结构

```
repo_root/
├── prompts/
│   └── prompt_{slug}-{ID}/
│       ├── versions/
│       │   ├── pv_{slug}-{ID}_2025-11-04T10-12Z_U1HK7.md
│       │   └── pv_{slug}-{ID}_2025-11-12T08-21Z_9ADP2.md
│       ├── HEAD                    # 文本指针: versions/pv_xxx.md
│       └── prompt.yaml            # 元数据
├── templates/
│   └── template_{slug}-{ID}/
│       ├── versions/
│       │   ├── tv_{slug}-{ID}_2025-11-04T10-12Z_U1HK7.md
│       │   └── tv_{slug}-{ID}_2025-11-12T08-21Z_9ADP2.md
│       ├── HEAD
│       └── template.yaml
└── chats/
    ├── chat_{title-slug}-{ID}.json
    └── chat_{title-slug}-{ID}.json
```

### 3. API架构变更

#### 之前（双规制）
- `/v1/simple/` - 面向非技术用户的简化API
- `/v1/detail/` - 面向技术用户的完整Git操作API
- `/v1/` - 通用API（搜索、索引等）

#### 现在（统一API）
- `/v1/prompts` - Prompt CRUD操作
- `/v1/templates` - Template CRUD操作
- `/v1/chats` - Chat CRUD操作
- `/v1/search` - 搜索
- `/v1/index/*` - 索引管理
- `/v1/health` - 健康检查

### 4. 核心服务变更

#### 新增服务
- `FileStorageService` - 文件系统版本控制服务
  - 创建/读取/更新/删除items
  - 版本管理（创建版本、列出版本、读取特定版本）
  - HEAD指针管理

#### 移除服务
- `GitService` - 已不再使用（保留代码作为参考）
- `VersionService` - 语义化版本管理（简化为时间戳版本）

#### 保留服务
- `IndexService` - 更新为支持FileStorageService
- `FrontmatterUtils` - 保持不变

## API端点对照

### Prompts API

| 操作 | 旧API | 新API |
|------|-------|-------|
| 列出所有 | N/A | `GET /v1/prompts` |
| 创建 | `POST /v1/simple/prompts/{id}/save` | `POST /v1/prompts` |
| 获取 | `GET /v1/simple/prompts/{id}/content` | `GET /v1/prompts/{id}` |
| 更新 | `PUT /v1/detail/prompts/{id}/raw` | `PUT /v1/prompts/{id}` |
| 删除 | `DELETE /v1/detail/prompts/{id}/raw` | `DELETE /v1/prompts/{id}` |
| 列出版本 | `GET /v1/simple/prompts/{id}/timeline` | `GET /v1/prompts/{id}/versions` |
| 获取特定版本 | `GET /v1/simple/prompts/{id}/content?ref={version}` | `GET /v1/prompts/{id}/versions/{version_id}` |

### Templates API

| 操作 | 旧API | 新API |
|------|-------|-------|
| 列出所有 | N/A | `GET /v1/templates` |
| 创建 | `POST /v1/simple/templates/{id}/save` | `POST /v1/templates` |
| 获取 | `GET /v1/simple/templates/{id}/content` | `GET /v1/templates/{id}` |
| 更新 | `PUT /v1/detail/templates/{id}/raw` | `PUT /v1/templates/{id}` |
| 删除 | `DELETE /v1/detail/templates/{id}/raw` | `DELETE /v1/templates/{id}` |
| 列出版本 | `GET /v1/simple/templates/{id}/timeline` | `GET /v1/templates/{id}/versions` |
| 获取特定版本 | `GET /v1/simple/templates/{id}/content?ref={version}` | `GET /v1/templates/{id}/versions/{version_id}` |

### Chats API

| 操作 | 旧API | 新API |
|------|-------|-------|
| 列出所有 | N/A | `GET /v1/chats` |
| 创建 | `POST /v1/simple/chats/{id}/save` | `POST /v1/chats` |
| 获取 | `GET /v1/simple/chats/{id}/content` | `GET /v1/chats/{id}` |
| 更新 | `PUT /v1/detail/chats/{id}/raw` | `PUT /v1/chats/{id}` |
| 删除 | `DELETE /v1/detail/chats/{id}/raw` | `DELETE /v1/chats/{id}` |

## 数据迁移

如果需要从旧的Git-based存储迁移到新的File-based存储，可以：

1. 从Git仓库读取所有的prompts/templates/chats
2. 使用FileStorageService创建新的items
3. 重建索引

## 前端变更

### API客户端
- 新建 `frontend/src/lib/api.js` 提供统一的API调用接口
- 移除对Git相关操作的依赖（分支切换、提交等）
- 简化版本管理UI（使用时间戳而非语义化版本）

### 状态管理
- 移除Git分支相关状态
- 简化版本控制状态

## 配置变更

### settings.py
- `INSTALLED_APPS` 中移除 `api_simple`, `api_detail`, `api_common`
- 添加 `apps.api`（统一API）
- `GIT_REPO_ROOT` 重命名含义，现作为文件存储根目录
- 移除 `GIT_DEFAULT_BRANCH` 和 `VERSION_TAG_PREFIX`

## 优势

### 1. 简化
- 不再依赖Git，降低复杂度
- 统一API，减少维护成本
- 更直观的文件组织结构

### 2. 性能
- 文件系统操作比Git操作更快
- 减少锁竞争
- 更好的并发性能

### 3. 可维护性
- 代码结构更清晰
- 更容易理解和调试
- 减少了第三方依赖（Dulwich）

## 兼容性注意事项

1. **API不兼容** - 新API与旧API完全不兼容，需要更新所有客户端代码
2. **数据格式不变** - Prompt/Template的Markdown格式和Chat的JSON格式保持不变
3. **版本格式变化** - 从语义化版本（v1.0.0）改为时间戳版本（2025-11-04T10-12Z_U1HK7）

## 测试

运行API测试模拟器：

```bash
python scripts/api_request_simulator.py --base-url http://localhost:8000
```

## 回滚计划

如果需要回滚到旧架构：
1. 恢复settings.py中的INSTALLED_APPS配置
2. 恢复urls.py中的URL配置
3. 切换回使用GitService
4. 注意数据可能需要手动迁移回Git格式
