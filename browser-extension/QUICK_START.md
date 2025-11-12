# 快速开始指南

欢迎使用 MyPromptManager 浏览器插件！这是一个 5 分钟快速上手指南。

## 🚀 第一步：安装插件

### Chrome / Edge 浏览器

1. 下载或克隆本项目到本地
2. 打开浏览器扩展管理页面：
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. 打开右上角的"开发者模式"开关
4. 点击"加载已解压的扩展程序"
5. 选择项目中的 `browser-extension` 文件夹
6. ✅ 安装完成！你应该能在工具栏看到插件图标

## ⚙️ 第二步：配置 API 地址

1. 确保 MyPromptManager 后端正在运行
   ```bash
   # 在项目根目录
   python manage.py runserver
   ```

2. 点击浏览器工具栏中的插件图标
3. 如果需要，切换到"对话同步"标签页
4. 点击"设置"按钮
5. 输入 API 地址：`http://localhost:8000/v1`
6. 点击"保存设置"

> 💡 提示：如果你的后端运行在其他地址或端口，请相应修改

## 📚 第三步：浏览 Prompt 库

### 方法 1：在任意页面

1. 点击插件图标
2. 切换到"Prompt库"标签页
3. 你会看到所有的 Prompts 和 Templates
4. 使用搜索框或筛选按钮查找内容

### 方法 2：准备一些测试数据

如果库是空的，先创建一些测试内容：

```bash
# 在项目根目录，使用 API 创建测试 Prompt
curl -X POST http://localhost:8000/v1/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "---\ntitle: 代码审查助手\nslug: code-review\ndescription: 帮助审查代码质量和安全性\nlabels: [开发, 代码]\nauthor: system\n---\n\n请帮我审查以下代码，重点关注：\n1. 代码质量和可读性\n2. 潜在的性能问题\n3. 安全漏洞\n4. 最佳实践\n\n代码如下："
  }'

curl -X POST http://localhost:8000/v1/templates \
  -H "Content-Type: application/json" \
  -d '{
    "content": "---\ntitle: 文章大纲生成器\nslug: article-outline\ndescription: 快速生成文章大纲\nlabels: [写作, 创作]\nauthor: system\n---\n\n请为以下主题生成一个详细的文章大纲：\n\n主题：[在此输入主题]\n\n要求：\n- 包含引言、3-5个主要章节、结论\n- 每个章节包含2-3个子主题\n- 适合博客文章格式"
  }'
```

刷新插件，你应该能看到这些内容了！

## 🎯 第四步：使用 Prompt（最精彩的部分！）

### 场景 A：一键填入 AI 对话框

1. **打开任意 AI 平台**
   - ChatGPT: https://chat.openai.com
   - Claude: https://claude.ai
   - DeepSeek: https://chat.deepseek.com
   - Gemini: https://gemini.google.com

2. **选择 Prompt**
   - 点击插件图标
   - 切换到"Prompt库"
   - 搜索"代码审查"
   - 点击卡片

3. **填入对话框**
   - 在弹出的详情中点击"填入对话框"
   - 🎉 内容自动出现在输入框中！
   - 补充你的代码，按 Enter 发送

### 场景 B：复制到其他地方使用

1. 在插件中找到想要的 Template
2. 点击查看详情
3. 点击"复制"按钮
4. 到任何地方粘贴（邮件、文档、笔记等）

## 💾 第五步：保存对话历史（可选）

如果你想保存 AI 对话：

1. 在 AI 平台对话页面
2. 打开插件 → "对话同步"标签页
3. 点击"提取当前对话"
4. 稍等片刻，提取完成
5. 到 MyPromptManager 网页版查看：http://localhost:3000

## 🎓 进阶功能

### 自动同步

在设置中开启"自动同步"后，插件会自动保存你的对话历史，无需手动提取。

### 搜索和筛选

- **实时搜索**：输入关键词立即过滤结果
- **类型筛选**：
  - "全部"：显示所有内容
  - "Prompts"：仅单次使用的提示词
  - "Templates"：仅可重复使用的模板

### 跨平台使用

同一个 Prompt 可以在所有支持的平台使用：
- ChatGPT ✅
- Claude ✅
- DeepSeek ✅
- Gemini ✅

## 🐛 遇到问题？

### 常见问题速查

| 问题 | 解决方法 |
|------|----------|
| 插件无法加载 | 检查是否开启"开发者模式" |
| Prompt库显示"加载失败" | 确认后端运行 + API 地址正确 |
| 填入按钮无反应 | 刷新 AI 平台页面后重试 |
| 搜索无结果 | 检查拼写或使用更通用的关键词 |

### 获取帮助

- 📖 [完整文档](./README.md)
- 💡 [使用示例](./USAGE_EXAMPLES.md)
- 🐛 [报告问题](https://github.com/your-repo/issues)

## 🎉 完成！

恭喜！你已经掌握了 MyPromptManager 浏览器插件的基本使用。

### 下一步

- 创建更多自定义 Prompt 和 Template
- 尝试在不同 AI 平台测试相同的 Prompt
- 保存有价值的对话历史
- 与团队成员共享你的 Prompt 库

Happy Prompting! 🚀
