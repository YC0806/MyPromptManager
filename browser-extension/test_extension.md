# 浏览器插件测试指南

## 问题修复

已修复以下问题：

1. **模态框位置错误** ✅
   - 问题：模态框在 libraryTab 内部，导致定位和显示问题
   - 解决：将模态框移到全局位置（body 直接子元素）

2. **loadConfig 函数缺少返回值** ✅
   - 问题：loadConfig() 没有返回配置对象
   - 解决：添加 return 语句，并在失败时返回默认配置

## 测试步骤

### 1. 重新加载插件

```
1. 打开 Chrome/Edge 浏览器
2. 进入扩展管理页面：chrome://extensions/
3. 找到 MyPromptManager 插件
4. 点击"重新加载"按钮 (刷新图标)
```

### 2. 测试基本界面

```
1. 点击浏览器工具栏中的插件图标
2. 检查是否能看到两个标签页：
   - "对话同步"
   - "Prompt库"
3. 检查界面是否正常显示，没有空白遮挡
```

### 3. 测试对话同步标签

```
1. 确保在"对话同步"标签页
2. 检查显示内容：
   - 同步状态区域
   - 当前提供商
   - 自动同步状态
   - 已保存对话数量
3. 检查按钮：
   - 提取当前对话
   - 同步所有对话
   - 设置
```

### 4. 测试 Prompt 库标签

```
1. 点击"Prompt库"标签
2. 应该看到：
   - 搜索框
   - 筛选按钮（全部、Prompts、Templates）
   - 加载提示或 Prompt 列表
3. 如果后端未运行，会显示错误信息
```

### 5. 测试后端连接

**前提：确保后端正在运行**

```bash
# 在项目根目录
python manage.py runserver
```

**测试步骤：**

```
1. 打开插件 → Prompt库标签
2. 等待加载
3. 如果有数据：
   - 应该看到 Prompt/Template 卡片列表
   - 每个卡片显示标题、类型标签、更新时间
4. 如果没有数据：
   - 显示"没有找到内容"
```

### 6. 测试搜索功能

```
1. 在搜索框输入关键词
2. 列表应该实时过滤
3. 清空搜索框，列表恢复
```

### 7. 测试筛选功能

```
1. 点击"Prompts"按钮
   - 只显示 Prompt 类型
   - 按钮高亮显示
2. 点击"Templates"按钮
   - 只显示 Template 类型
   - 按钮高亮显示
3. 点击"全部"按钮
   - 显示所有内容
   - 按钮高亮显示
```

### 8. 测试详情模态框

```
1. 点击任意 Prompt/Template 卡片
2. 应该弹出详情模态框
3. 检查显示内容：
   - 标题
   - 类型标签
   - 更新时间
   - 完整内容
4. 检查按钮：
   - 填入对话框
   - 复制
   - 关闭按钮 (×)
5. 点击关闭按钮或外部区域，模态框关闭
```

### 9. 测试复制功能

```
1. 打开任意 Prompt 详情
2. 点击"复制"按钮
3. 检查：
   - 按钮变绿显示"已复制！"
   - 2秒后恢复原状
4. 打开任意文本编辑器粘贴
5. 验证内容是否正确复制
```

### 10. 测试填入功能

**在 ChatGPT：**

```
1. 访问 https://chat.openai.com 或 https://chatgpt.com
2. 打开插件 → Prompt库
3. 选择任意 Prompt
4. 点击"填入对话框"
5. 检查：
   - 按钮变绿显示"已填入！"
   - 内容出现在 ChatGPT 输入框
   - 模态框自动关闭
```

**在其他平台：**

重复上述步骤测试：
- Claude (https://claude.ai)
- DeepSeek (https://chat.deepseek.com)
- Gemini (https://gemini.google.com)

## 常见问题排查

### 问题 1：点击 Prompt库标签显示"加载失败"

**原因：**
- 后端未运行
- API 地址配置错误
- 网络问题

**解决：**
```bash
# 1. 确保后端运行
python manage.py runserver

# 2. 检查 API 地址
# 打开插件 → 对话同步 → 设置
# 确认 API 地址是：http://localhost:8000/v1
```

### 问题 2：没有显示任何 Prompt

**原因：**
- 数据库中没有数据

**解决：**
```bash
# 创建测试数据
curl -X POST http://localhost:8000/v1/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "---\ntitle: 测试 Prompt\nslug: test-prompt\ndescription: 这是一个测试\nlabels: [测试]\nauthor: system\n---\n\n这是测试内容"
  }'
```

### 问题 3：填入功能不工作

**原因：**
- Content script 未加载
- 找不到输入框

**解决：**
```
1. 刷新 AI 平台页面
2. 打开浏览器控制台 (F12)
3. 查看 Console 是否有错误
4. 查找 "MyPromptManager: [平台名] content script loaded" 消息
```

### 问题 4：模态框显示异常

**已修复**：模态框已移到全局位置

### 问题 5：CORS 错误

**原因：**
- 后端未配置 CORS

**解决：**
确保 Django settings.py 中有：
```python
INSTALLED_APPS = [
    'corsheaders',
    ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True
```

## 调试技巧

### 查看插件日志

```
1. 右键点击插件图标
2. 选择"检查弹出内容"或"审查元素"
3. 打开 Console 标签页
4. 查看错误和日志消息
```

### 查看 Content Script 日志

```
1. 在 AI 平台页面按 F12
2. 打开 Console 标签页
3. 查找以 "MyPromptManager:" 开头的消息
```

### 查看 Background Script 日志

```
1. 打开 chrome://extensions/
2. 找到插件，点击"Service Worker"或"背景页"
3. 查看 Console 输出
```

## 成功标准

所有以下测试都应该通过：

- ✅ 插件弹出窗口正常显示
- ✅ 两个标签页可以切换
- ✅ Prompt 库能加载数据
- ✅ 搜索和筛选功能工作
- ✅ 详情模态框正常显示和关闭
- ✅ 复制功能工作
- ✅ 填入功能在所有 4 个平台工作
- ✅ 没有控制台错误
- ✅ 界面美观，没有布局问题

## 下一步

测试通过后：
1. 使用插件创建和使用 Prompt
2. 在不同 AI 平台测试填入功能
3. 保存有价值的对话历史
4. 提供反馈和建议
