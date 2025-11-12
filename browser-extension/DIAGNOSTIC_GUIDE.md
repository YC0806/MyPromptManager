# 浏览器插件诊断指南

## 问题：页面被遮挡

如果插件界面仍然被遮挡，请按以下步骤逐一排查。

## 🔍 诊断步骤

### 步骤 1：完全重新加载插件

```
1. 打开 chrome://extensions/
2. 找到 "MyPromptManager - AI History Sync"
3. 点击"移除"按钮（完全删除）
4. 再次点击"加载已解压的扩展程序"
5. 选择 browser-extension 文件夹
```

**为什么：** 有时候简单的刷新不会清除缓存的CSS/JS

### 步骤 2：检查浏览器控制台

**打开插件的开发者工具：**

```
方法1：
1. 右键点击插件图标
2. 选择"检查弹出内容"或"审查弹出式窗口"

方法2：
1. 打开插件弹出窗口
2. 在弹出窗口内右键点击
3. 选择"检查"或"审查元素"
```

**查看控制台（Console标签页）：**
- [ ] 是否有红色错误信息？
- [ ] 是否有 JavaScript 错误？
- [ ] 记录所有错误信息

**查看元素（Elements标签页）：**

1. **查找模态框元素**
   - 按 Ctrl+F (或 Cmd+F) 搜索 `itemDetailModal`
   - 检查该元素的 class 属性
   - 应该是：`<div id="itemDetailModal" class="modal hidden">`
   - 如果没有 `hidden` 类，说明 JS 有问题

2. **检查模态框的样式**
   - 在 Elements 标签页中选中 `#itemDetailModal`
   - 查看右侧 Styles 面板
   - 检查 `display` 属性
   - 应该是：`display: none !important;` （灰色删除线表示被覆盖）

3. **检查是否有其他遮挡元素**
   - 在页面上右键点击空白/遮挡区域
   - 选择"检查"
   - 查看被选中的是什么元素

### 步骤 3：手动验证 HTML 结构

在浏览器开发者工具的 Elements 标签页中，验证以下结构：

```html
<body>
  <div class="header">...</div>

  <div class="content">
    <div class="tab-nav">
      <button class="tab-button active" data-tab="sync">对话同步</button>
      <button class="tab-button" data-tab="library">Prompt库</button>
    </div>

    <div id="syncTab" class="tab-content active">
      <!-- 这里应该有内容 -->
    </div>

    <div id="libraryTab" class="tab-content hidden">
      <!-- 这里应该有内容 -->
    </div>
  </div>

  <!-- 模态框应该在这里，在 content 外面 -->
  <div id="itemDetailModal" class="modal hidden">
    ...
  </div>
</body>
```

**检查点：**
- [ ] `#syncTab` 有 `active` 类
- [ ] `#libraryTab` 有 `hidden` 类
- [ ] `#itemDetailModal` 有 `hidden` 类
- [ ] `#itemDetailModal` 在 `.content` 外面

### 步骤 4：手动测试 CSS

在浏览器控制台（Console标签页）中运行以下命令：

```javascript
// 1. 检查模态框是否存在
console.log('Modal exists:', document.getElementById('itemDetailModal') !== null);

// 2. 检查模态框的 class
console.log('Modal classes:', document.getElementById('itemDetailModal').className);

// 3. 检查模态框的 display 样式
console.log('Modal display:', window.getComputedStyle(document.getElementById('itemDetailModal')).display);

// 4. 检查是否有其他元素遮挡
console.log('Elements at center:', document.elementsFromPoint(180, 300));

// 5. 检查 tab 是否正确
console.log('Active tab:', document.querySelector('.tab-content.active').id);
console.log('Hidden tabs:', Array.from(document.querySelectorAll('.tab-content.hidden')).map(el => el.id));
```

**预期结果：**
```
Modal exists: true
Modal classes: "modal hidden"
Modal display: "none"
Elements at center: [应该是正常的内容元素，不是 modal]
Active tab: "syncTab"
Hidden tabs: ["libraryTab"]
```

### 步骤 5：检查可能的遮挡原因

**可能原因 1：模态框没有 hidden 类**

在 Console 中运行：
```javascript
// 强制添加 hidden 类
document.getElementById('itemDetailModal').classList.add('hidden');
```

**可能原因 2：其他元素的 z-index 太高**

在 Console 中运行：
```javascript
// 检查所有元素的 z-index
Array.from(document.querySelectorAll('*'))
  .filter(el => window.getComputedStyle(el).zIndex !== 'auto')
  .map(el => ({
    element: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className : ''),
    zIndex: window.getComputedStyle(el).zIndex
  }))
  .sort((a, b) => parseInt(b.zIndex) - parseInt(a.zIndex));
```

**可能原因 3：背景遮罩问题**

检查是否有半透明的黑色遮罩：
```javascript
// 查找所有半透明背景元素
Array.from(document.querySelectorAll('*'))
  .filter(el => {
    const bg = window.getComputedStyle(el).background;
    return bg.includes('rgba') && bg.includes('0.5');
  })
  .map(el => el.id || el.className);
```

### 步骤 6：临时禁用模态框

如果模态框确实是问题，临时禁用它：

在 Console 中运行：
```javascript
// 完全移除模态框
document.getElementById('itemDetailModal').remove();
```

如果移除后界面正常，说明确实是模态框的问题。

### 步骤 7：检查 tab-content 样式

在 Elements 标签页中，检查 `.tab-content` 的样式：

```javascript
// 检查所有 tab-content 的 display
document.querySelectorAll('.tab-content').forEach(tab => {
  console.log(tab.id, {
    classes: tab.className,
    display: window.getComputedStyle(tab).display,
    visible: window.getComputedStyle(tab).display !== 'none'
  });
});
```

**预期结果：**
```
syncTab { classes: "tab-content active", display: "block", visible: true }
libraryTab { classes: "tab-content hidden", display: "none", visible: false }
```

## 🔧 常见问题和解决方案

### 问题 1：模态框显示但应该隐藏

**症状：** 看到半透明黑色遮罩

**解决方案：**
```javascript
// 在 Console 中执行
document.getElementById('itemDetailModal').classList.add('hidden');
```

如果这解决了问题，说明是 JavaScript 初始化问题。

### 问题 2：设置区域遮挡内容

**症状：** 看到 API 地址输入框和开关

**检查：**
```javascript
// 检查设置区域
console.log('Settings visible:',
  window.getComputedStyle(document.getElementById('settingsSection')).display !== 'none'
);
```

**解决方案：**
```javascript
// 强制隐藏设置
document.getElementById('settingsSection').classList.add('hidden');
```

### 问题 3：两个标签页同时显示

**检查：**
```javascript
// 检查同时显示的 tab
Array.from(document.querySelectorAll('.tab-content'))
  .filter(tab => window.getComputedStyle(tab).display !== 'none')
  .map(tab => tab.id);
```

**预期：** 只应该返回 `["syncTab"]`

**解决方案：**
```javascript
// 隐藏 libraryTab
document.getElementById('libraryTab').classList.add('hidden');
```

### 问题 4：CSS 优先级问题

如果 `.hidden` 不生效，检查 CSS 优先级：

```javascript
// 检查 hidden 类的样式
console.log('Hidden class styles:',
  window.getComputedStyle(document.querySelector('.hidden'))
);
```

**临时解决：**
在 Elements 标签页中，找到 `<style>` 标签，确认有：
```css
.hidden {
  display: none !important;
}
```

## 📊 诊断结果报告

请复制以下模板，填写你的诊断结果：

```
### 诊断日期：__________
### 浏览器：__________
### 插件版本：v1.1.0

### 控制台错误：
- [ ] 无错误
- [ ] 有错误（请列出）：


### 模态框状态：
- Modal exists:
- Modal classes:
- Modal display:

### Tab 状态：
- Active tab:
- Hidden tabs:

### 遮挡元素：
- 遮挡的元素 ID/类名：


### 尝试的解决方案：
- [ ] 完全重新加载插件
- [ ] 强制添加 hidden 类
- [ ] 移除模态框
- [ ] 其他：


### 问题是否解决：
- [ ] 是
- [ ] 否（请描述当前状态）：

```

## 🚨 如果以上都不行

### 最后的手段：回滚到简化版本

我可以创建一个简化版本，暂时移除模态框功能，只保留基本的浏览和复制功能。

### 请提供以下信息：

1. 浏览器控制台的完整错误信息（截图）
2. Elements 标签页中 `#itemDetailModal` 的完整 HTML（右键 → Copy → Copy element）
3. 运行诊断脚本的结果
4. 遮挡区域的截图（右键检查时高亮的元素）

---

**创建日期：** 2025-11-11
**最后更新：** 2025-11-11
