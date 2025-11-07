# Template详情页面设计说明

## 概述
为Template数据类型创建了独立的列表和详情页面，解决了之前Template复用Prompt页面的问题。

## 主要变更

### 1. 新建文件

#### [TemplatesList.jsx](frontend/src/pages/TemplatesList.jsx)
- 专门用于显示Template列表的页面
- 仅通过API查询 `type=template` 的数据
- 界面特点：
  - 使用紫色主题色（与Prompt的teal色区分）
  - 卡片左侧有紫色边框标识
  - 使用 `FileCode` 图标代表模板文件
  - 点击项目跳转到 `/templates/:id`

#### [TemplateDetail.jsx](frontend/src/pages/TemplateDetail.jsx)
- 专门用于Template的详情和编辑页面
- 与Prompt详情页的主要区别：

**视觉差异：**
- 使用紫色主题色（按钮、图标等）
- 顶部标题旁显示 `FileCode` 图标
- 添加了 "Template" 标签徽章

**功能差异：**
- **变量检测功能**：自动识别模板中的变量（格式：`{{variable_name}}`）
- **变量统计**：编辑器底部显示检测到的变量数量
- **变量预览卡片**：在编辑器下方显示所有检测到的变量
- **变量配置面板**：右侧边栏提供变量描述和默认值的输入区域
- **模板专属提示**：编辑器占位符提示使用变量语法

**API调用：**
- 所有API调用使用 `itemType='template'`
- 调用路径为 `/v1/simple/templates/:id/*`

### 2. 修改文件

#### [App.jsx](frontend/src/App.jsx:34-35)
- 添加Template路由：
  - `/templates` → `TemplatesList` 组件
  - `/templates/:id` → `TemplateDetail` 组件
- 移除了之前 `/templates` 使用 `PromptsList` 的临时方案

#### [PromptsList.jsx](frontend/src/pages/PromptsList.jsx)
- 简化过滤器，移除类型选择器（不再需要区分Prompt/Template）
- API查询固定为 `type='prompt'`
- 跳转路径简化为 `/prompts/:id`（移除type查询参数）

#### [PromptDetail.jsx](frontend/src/pages/PromptDetail.jsx)
- 简化metadata结构，移除type字段
- API调用固定使用 `itemType='prompt'`
- 移除URL查询参数type的处理逻辑
- Modal组件调用固定传入 `itemType="prompt"`

## Template详情页面特色功能

### 变量管理系统

Template页面实现了智能变量管理：

1. **自动检测**：通过正则表达式扫描内容中的 `{{variable_name}}` 格式
2. **实时预览**：编辑时自动更新变量列表
3. **变量配置**：为每个变量提供：
   - 描述说明输入框
   - 默认值输入框
   - 变量名以紫色高亮显示

示例模板内容：
```
Hello {{name}},

Welcome to {{company}}! Your account ID is {{account_id}}.
```

检测到的变量：`{{name}}`, `{{company}}`, `{{account_id}}`

### 视觉设计

#### 配色方案
- **Prompt页面**：Teal/青色系 (#14B8A6)
- **Template页面**：Purple/紫色系 (#A855F7)

#### 图标使用
- **Prompt**：`FileText` - 文本文件
- **Template**：`FileCode` - 代码/模板文件

## 数据流

```
用户点击Templates菜单
  ↓
TemplatesList组件加载
  ↓
API: GET /v1/search?type=template
  ↓
展示Template列表
  ↓
用户点击某个Template
  ↓
跳转到 /templates/:id
  ↓
TemplateDetail组件加载
  ↓
API: GET /v1/simple/templates/:id/content
  ↓
展示Template内容和变量
  ↓
用户编辑保存
  ↓
API: POST /v1/simple/templates/:id/save
```

## API端点使用

### Template列表
- **端点**：`GET /v1/search?type=template`
- **响应**：包含template_id的结果列表

### Template详情
- **获取内容**：`GET /v1/simple/templates/:id/content`
- **保存草稿**：`POST /v1/simple/templates/:id/save`
- **发布版本**：`POST /v1/simple/templates/:id/publish`
- **回滚版本**：`POST /v1/simple/templates/:id/rollback`

## 后续可扩展功能

1. **变量验证**：验证模板中的变量是否都已定义
2. **变量类型**：为变量指定类型（string, number, boolean等）
3. **变量预览**：实时预览填充变量后的效果
4. **变量导入/导出**：支持从JSON导入变量定义
5. **变量库**：创建可复用的变量集合
6. **模板测试**：使用示例数据测试模板渲染

## 测试清单

- [x] 前端构建无错误
- [ ] Template列表页面正常显示
- [ ] 点击Template项跳转到正确的详情页
- [ ] 详情页正确加载Template数据
- [ ] 变量检测功能正常工作
- [ ] 保存、发布、回滚功能正常
- [ ] 面包屑导航正确
- [ ] 响应式布局在不同屏幕尺寸下正常

## 注意事项

1. **类型一致性**：确保前后端的type字段值保持一致（'template' vs 'templates'）
2. **ID字段**：后端响应使用 `template_id`，前端需要正确映射到 `id` 字段
3. **变量语法**：当前使用 `{{variable}}` 格式，未来可能扩展支持其他格式
4. **兼容性**：保持与现有Prompt功能的API结构一致性
