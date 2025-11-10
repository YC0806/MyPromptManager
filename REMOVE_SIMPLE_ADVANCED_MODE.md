# 删除 Simple/Advanced 模式切换

本文档总结了从前端界面中删除 simple/advanced 模式切换的所有修改。

## ✅ 完成的修改

### 1. Topbar 组件 ([frontend/src/components/layout/Topbar.jsx](frontend/src/components/layout/Topbar.jsx))

**删除内容：**
- 删除 `mode`, `setMode`, `currentBranch`, `setCurrentBranch` 状态
- 删除 `handleModeToggle` 函数
- 删除模式切换开关 UI（Simple/Advanced Toggle）
- 删除分支选择器（Branch Selector）
- 删除相关的导入：`GitBranch`, `Switch`, `Label`, `Select` 组件

**结果：**
- Topbar 只保留搜索框、Channel 切换、通知和设置按钮
- 界面更简洁，用户不再需要选择模式

### 2. Sidebar 组件 ([frontend/src/components/layout/Sidebar.jsx](frontend/src/components/layout/Sidebar.jsx))

**删除内容：**
- 删除 `mode` 状态的使用
- 删除 Advanced 部分的条件渲染（`if (section.advanced && mode === 'simple') return null`）
- 删除底部的模式显示（"Mode: Simple/Advanced"）
- 删除 `navSections` 中 `advanced: true` 标记

**结果：**
- 所有导航项都始终显示，包括 Advanced 部分
- 底部显示 "MyPromptManager" 而不是模式信息

### 3. PromptDetail 页面 ([frontend/src/pages/PromptDetail.jsx](frontend/src/pages/PromptDetail.jsx))

**删除内容：**
- 删除 `mode` 状态和 `useStore` 导入
- 删除 `SimpleMode` 和 `AdvancedMode` 组件
- 统一使用 `EditorContent` 组件

**结果：**
- 所有用户都使用相同的编辑界面
- 编辑器包含内容编辑区和元数据面板

### 4. TemplateDetail 页面 ([frontend/src/pages/TemplateDetail.jsx](frontend/src/pages/TemplateDetail.jsx))

**删除内容：**
- 删除 `mode` 状态和 `useStore` 导入
- 删除 `SimpleMode` 和 `AdvancedMode` 组件
- 统一使用 `EditorContent` 组件

**结果：**
- 与 PromptDetail 相同，使用统一的编辑界面
- 包含模板特有的变量提取功能

### 5. ChatDetail 页面 ([frontend/src/pages/ChatDetail.jsx](frontend/src/pages/ChatDetail.jsx))

**删除内容：**
- 删除 `mode` 状态和 `useStore` 导入
- 删除 "Advanced Mode Only" 条件渲染
- Export Chat 功能始终可用
- Advanced Options（JSON 编辑和分析）始终可见

**结果：**
- 所有功能对所有用户开放
- Chat 详情页面更加完整

### 6. 列表页面

#### PromptsList ([frontend/src/pages/PromptsList.jsx](frontend/src/pages/PromptsList.jsx))
- 删除 `mode` 状态
- 删除 "Bulk Actions (Advanced Mode Only)" 按钮

#### TemplatesList ([frontend/src/pages/TemplatesList.jsx](frontend/src/pages/TemplatesList.jsx))
- 删除 `mode` 状态
- 删除 "Bulk Actions (Advanced Mode Only)" 按钮

#### ChatsList ([frontend/src/pages/ChatsList.jsx](frontend/src/pages/ChatsList.jsx))
- 删除 `mode` 状态
- 删除 "Bulk Actions (Advanced Mode Only)" 按钮

**结果：**
- 列表界面更简洁
- 移除了尚未实现的 Bulk Actions 功能

### 7. 全局状态管理 ([frontend/src/store/useStore.js](frontend/src/store/useStore.js))

**删除内容：**
- 删除 `mode` 状态（'simple' or 'advanced'）
- 删除 `setMode` 函数
- 删除 `currentBranch` 状态
- 删除 `setCurrentBranch` 函数
- 从 localStorage 中移除 mode 相关的持久化

**结果：**
- 状态管理更简洁
- 只保留必要的全局状态

## 📊 修改统计

| 文件类型 | 修改文件数 | 删除行数（估算） |
|---------|-----------|----------------|
| 组件 | 2 | ~80 行 |
| 页面 | 6 | ~200 行 |
| 状态管理 | 1 | ~15 行 |
| **总计** | **9** | **~295 行** |

## 🎯 影响范围

### 用户体验改进
1. **更简单的界面**：用户不再需要在 Simple 和 Advanced 模式之间切换
2. **功能统一**：所有功能对所有用户开放
3. **减少困惑**：新用户不会疑惑应该使用哪个模式

### 代码质量提升
1. **减少条件判断**：移除了大量的 `mode === 'simple'` 判断
2. **组件简化**：PromptDetail 和 TemplateDetail 不再需要两套 UI
3. **状态管理简化**：全局状态减少，更易维护

### 保留的功能
1. ✅ Channel 切换（Prod/Beta）仍然保留
2. ✅ View Mode 切换（Table/Cards）仍然保留
3. ✅ 所有编辑功能完整保留
4. ✅ Advanced Options（在 ChatDetail 中）对所有用户开放

## 🔍 验证方法

### 代码验证
```bash
# 检查是否还有 mode 相关的引用
grep -r "mode === 'simple'\|mode === 'advanced'\|setMode" frontend/src --include="*.jsx" --include="*.js"

# 应该没有输出（或只有 viewMode 相关的引用）
```

### 功能验证
1. 启动前端：`cd frontend && npm run dev`
2. 检查以下页面：
   - ✅ Dashboard - 应正常显示
   - ✅ Topbar - 没有 Simple/Advanced 切换按钮
   - ✅ Sidebar - 所有导航项都显示，底部显示 "MyPromptManager"
   - ✅ Prompts 列表 - 正常显示，没有 Bulk Actions
   - ✅ Prompt 详情 - 统一的编辑界面
   - ✅ Templates 列表 - 正常显示
   - ✅ Template 详情 - 统一的编辑界面
   - ✅ Chats 列表 - 正常显示
   - ✅ Chat 详情 - Export 和 Advanced Options 都可见

## 📝 相关文档

- [统一 API 架构完成文档](UNIFIED_API_COMPLETE.md)
- [前端更新总结](FRONTEND_UPDATES.md)
- [API 参考](doc/API_REFERENCE.md)

## 🎉 总结

成功移除了 Simple/Advanced 模式切换，使前端界面更加统一和简洁：

1. ✅ 删除了 Topbar 中的模式切换开关
2. ✅ 删除了 Sidebar 中的模式显示和条件渲染
3. ✅ 统一了所有详情页面的编辑界面
4. ✅ 移除了列表页面中的模式条件
5. ✅ 清理了全局状态管理
6. ✅ 所有功能对所有用户开放

前端现在完全基于统一的 API 架构，没有 simple/advanced 的概念！
