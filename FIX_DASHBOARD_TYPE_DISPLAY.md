# 修复 Dashboard Recent Activity 类型显示

## 问题描述

Dashboard 页面的 Recent Activity 部分，所有项目（prompts、templates、chats）都显示为 "prompt" 类型，图标和类型标签不正确。

## 根本原因

搜索 API (`/v1/search`) 返回的索引数据中缺少 `type` 字段。索引服务在创建索引条目时，没有包含 `type` 字段。

## 修复方案

### 1. 修改索引服务 - `add_or_update` 方法

**文件**: [apps/core/services/index_service.py](apps/core/services/index_service.py)

**修改位置**: 第 165-178 行

**修改内容**: 在创建索引条目时添加 `type` 字段

```python
# Create index entry
entry = {
    'id': prompt_id,
    'type': item_type,  # ✅ 添加 type 字段
    'title': fields['title'],
    'description': fields['description'],
    'slug': fields['slug'],
    'labels': fields['labels'],
    'author': fields['author'],
    'created_at': fields['created_at'],
    'updated_at': datetime.utcnow().isoformat(),
    'file_path': file_path,
    'sha': sha,
}
```

### 2. 修改索引服务 - `rebuild` 方法

**文件**: [apps/core/services/index_service.py](apps/core/services/index_service.py)

**修改位置**:
- Prompts 部分：第 283-295 行
- Templates 部分：第 315-327 行
- Chats 部分：第 346-358 行

**修改内容**: 在三个位置分别添加相应的 `type` 字段

#### Prompts (第 285 行)
```python
entry = {
    'id': fields['id'],
    'type': 'prompt',  # ✅ 添加
    'title': fields['title'],
    ...
}
```

#### Templates (第 317 行)
```python
entry = {
    'id': fields['id'],
    'type': 'template',  # ✅ 添加
    'title': fields['title'],
    ...
}
```

#### Chats (第 348 行)
```python
entry = {
    'id': chat.get('id'),
    'type': 'chat',  # ✅ 添加
    'title': chat.get('title', ''),
    ...
}
```

## 验证步骤

### 1. 重建索引

```bash
curl -X POST http://localhost:8000/v1/index/rebuild -H "Content-Type: application/json"
```

**期望输出**:
```json
{
  "status": "completed",
  "stats": {
    "prompts_added": 5,
    "templates_added": 4,
    "chats_added": 14,
    "errors": []
  }
}
```

### 2. 验证搜索 API 返回 type 字段

```bash
curl -s "http://localhost:8000/v1/search?limit=8" | python3 -c "import sys, json; data = json.load(sys.stdin); [print(f\"{item.get('type', 'NO_TYPE'):10} - {item['title']}\") for item in data['items']]"
```

**期望输出**:
```
template   - Template Scenario 20251109085908
template   - Template Scenario 20251109090155
chat       - Chat Regression 20251109090155 (Updated)
prompt     - Prompt Regression 20251109090155
chat       - Chat Regression 20251109085908 (Updated)
prompt     - Prompt Regression 20251109085908
```

### 3. 访问 Dashboard

访问 http://localhost:5173/ 查看 Recent Activity 部分：

- ✅ Prompt 类型显示 FileText 图标（青色背景）
- ✅ Template 类型显示 Package 图标（紫色背景）
- ✅ Chat 类型显示 MessageSquare 图标（蓝色背景）
- ✅ 每个项目的类型标签显示正确

## 影响范围

### 受影响的 API

- **GET /v1/search** - 现在返回包含 `type` 字段的数据

### 受影响的前端页面

- **Dashboard** - Recent Activity 正确显示类型图标和标签

### 索引数据结构

索引文件 (`repo_root/.promptmeta/index.json`) 中的每个条目现在包含 `type` 字段：

```json
{
  "prompts": [
    {
      "id": "01K9KXE...",
      "type": "prompt",
      "title": "...",
      ...
    }
  ],
  "templates": [
    {
      "id": "01K9KXE...",
      "type": "template",
      "title": "...",
      ...
    }
  ],
  "chats": [
    {
      "id": "01K9KXE...",
      "type": "chat",
      "title": "...",
      ...
    }
  ]
}
```

## 相关代码

### Dashboard 中的类型判断逻辑

**文件**: [frontend/src/pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx)

```javascript
// 从搜索结果构建 Recent Activity
const recentActivity = (recentItems.items || []).map(item => ({
  id: item.id,
  type: item.type || 'prompt',  // ✅ 现在 item.type 正确返回
  title: item.title,
  slug: item.slug,
  time: new Date(item.updated_at || item.created_at),
}))

// 根据类型显示不同图标
const getIcon = (type) => {
  switch(type) {
    case 'template': return <Package className="w-5 h-5 text-purple-600" />
    case 'chat': return <MessageSquare className="w-5 h-5 text-blue-600" />
    default: return <FileText className="w-5 h-5 text-teal-600" />
  }
}

// 根据类型显示不同背景色
const getIconBg = (type) => {
  switch(type) {
    case 'template': return 'bg-purple-100'
    case 'chat': return 'bg-blue-100'
    default: return 'bg-teal-100'
  }
}
```

## 总结

✅ **问题已修复**

1. 索引服务的 `add_or_update` 方法现在包含 `type` 字段
2. 索引服务的 `rebuild` 方法在三个位置添加了 `type` 字段
3. 搜索 API 返回的数据现在正确包含 `type` 字段
4. Dashboard 的 Recent Activity 正确显示不同类型的图标和标签

**修改文件**: 1 个（`apps/core/services/index_service.py`）
**修改位置**: 4 处（1 个 `add_or_update` + 3 个 `rebuild` 部分）
**测试状态**: ✅ 通过

现在 Dashboard 可以正确区分和显示 prompts、templates 和 chats 了！
