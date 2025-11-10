# 前端更新总结

本文档总结了为适配后端 API 修复而对前端进行的所有更新。

## 修改的文件

### 1. API 客户端 ([src/lib/api.js](frontend/src/lib/api.js))

**修改内容：**
- 更新 `searchAPI.search()` 的返回类型注释：`results` → `items`
- 修复 labels 参数处理，支持字符串和数组两种格式

**修改原因：**
- 后端搜索 API (`/v1/search`) 的响应字段从 `results` 改为 `items`
- 测试用例中 labels 可能是字符串或数组

```javascript
// Before
@returns {Promise<{results: Array, count: number, next_cursor: string}>}

// After
@returns {Promise<{items: Array, count: number, next_cursor: string}>}
```

### 2. Dashboard 页面 ([src/pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx))

**修改内容：**
- 导入 `api` 模块用于真实数据获取
- 重写 `loadDashboardData()` 函数，使用 `Promise.all()` 并行获取数据
- 更新统计卡片：`totalPrompts`, `totalTemplates`, `totalChats`
- 从搜索 API 的 `items` 字段构建最近活动列表
- 添加加载状态和空状态处理
- 根据类型显示不同图标（FileText/Package/MessageSquare）
- 点击活动项跳转到对应详情页

**影响：**
- Dashboard 显示真实 API 数据，不再使用模拟数据
- 正确显示 prompts、templates、chats 的总数
- 最近活动显示所有类型的项目，带有类型标识

### 3. Prompts 列表页面 ([src/pages/PromptsList.jsx](frontend/src/pages/PromptsList.jsx))

**修改内容：**
- 第 55 行：`response.results` → `response.items`

**影响：**
- 正确显示从搜索 API 返回的 prompts 列表

### 4. Templates 列表页面 ([src/pages/TemplatesList.jsx](frontend/src/pages/TemplatesList.jsx))

**修改内容：**
- 第 55 行：`response.results` → `response.items`

**影响：**
- 正确显示从搜索 API 返回的 templates 列表

### 5. Chats 列表页面 ([src/pages/ChatsList.jsx](frontend/src/pages/ChatsList.jsx))

**修改内容：**
- 第 48 行：`response.results` → `response.items`

**影响：**
- 正确显示从搜索 API 返回的 chats 列表

## 后端 API 变更对照

### 搜索 API 响应格式变更

| 字段 | 旧格式 | 新格式 |
|------|--------|--------|
| 结果列表 | `results` | `items` |
| 数量 | `count` | `count` (不变) |
| 游标 | `next_cursor` | `next_cursor` (不变) |
| 排序 | 未排序 | **按 `updated_at` 降序（最新优先）** |

### HTTP 状态码变更

| 错误类型 | 旧状态码 | 新状态码 |
|----------|----------|----------|
| 缺少 content 字段 | 422 | **400** |
| frontmatter 验证失败 | 422 | 422 (不变) |

## 测试

### 自动化测试
运行后端测试以验证 API 正常工作：
```bash
python3 tests/api/run_api_tests.py
```

**预期结果：** 所有 12 个测试通过

### 前端集成测试
打开浏览器访问集成测试页面：
```
http://localhost:5173/test-api-integration.html
```

**测试项目：**
1. ✓ Health Check - 验证 API 服务健康
2. ✓ List Prompts - 验证 prompts 列表 API
3. ✓ Search API - **验证搜索返回 `items` 字段**
4. ✓ Create Prompt - 验证创建功能
5. ✓ Error Handling - **验证 400 vs 422 状态码**

## 兼容性说明

### 不需要修改的部分

1. **prompts/templates/chats 列表 API**
   - `/v1/prompts` 继续返回 `prompts` 字段
   - `/v1/templates` 继续返回 `templates` 字段
   - `/v1/chats` 继续返回 `chats` 字段
   - 这些 API 没有变更

2. **详情 API**
   - `/v1/prompts/{id}` 响应格式不变
   - `/v1/templates/{id}` 响应格式不变
   - `/v1/chats/{id}` 响应格式不变

3. **版本 API**
   - `/v1/prompts/{id}/versions` 响应格式不变
   - `/v1/templates/{id}/versions` 响应格式不变

4. **索引 API**
   - `/v1/index/status` 响应格式不变
   - `/v1/index/rebuild` 响应格式不变

## 验证清单

- [x] API 客户端类型注释更新
- [x] Dashboard 使用真实 API 数据
- [x] PromptsList 使用 `items` 字段
- [x] TemplatesList 使用 `items` 字段
- [x] ChatsList 使用 `items` 字段
- [x] 错误处理兼容新状态码
- [x] 后端测试全部通过
- [x] 创建前端集成测试页面

## 迁移建议

如果你在其他地方使用了搜索 API，请确保：

1. 将 `response.results` 改为 `response.items`
2. 错误处理能够正确识别 400 和 422 状态码
3. labels 参数支持字符串和数组格式

## 相关文档

- [后端测试脚本](tests/api/run_api_tests.py)
- [API 参考](doc/API_REFERENCE.md)
- [后端修复总结](doc/README.md)
