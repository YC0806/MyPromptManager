# MyPromptManager - AI History Sync 浏览器插件

这是一个浏览器插件，用于从主流 AI 提供商（ChatGPT、DeepSeek、Claude、Gemini）的网页前端自动提取对话历史，并同步到 MyPromptManager 系统中。

## 功能特性

### 对话历史同步

- ✅ **多平台支持**：支持 ChatGPT、DeepSeek、Claude、Gemini
- ✅ **自动提取**：自动检测并提取当前页面的对话历史
- ✅ **智能同步**：自动同步到 MyPromptManager 后端
- ✅ **去重处理**：相同对话 ID 的历史记录会自动更新而不是重复创建
- ✅ **离线存储**：先保存到本地，再同步到服务器

### Prompt & Template 库（NEW）

- ✅ **浏览管理**：在插件中直接浏览和搜索你的 Prompt 和 Template 库
- ✅ **快速搜索**：实时搜索标题和描述内容
- ✅ **类型筛选**：可按 Prompt 或 Template 类型筛选
- ✅ **一键复制**：快速复制内容到剪贴板
- ✅ **一键填入**：直接将内容填入当前 AI 对话框，支持所有平台
- ✅ **可配置**：可自定义 API 地址、自动同步开关等

## 安装方法

### Chrome/Edge 浏览器

1. 克隆或下载本项目到本地
2. 打开浏览器，进入扩展程序管理页面：
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. 打开右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `browser-extension` 目录
6. 插件安装完成！

### Firefox 浏览器

Firefox 版本需要将 manifest.json 修改为 manifest v2 格式。暂不支持，计划后续版本添加。

## 使用方法

### 1. 配置插件

首次使用需要配置 API 地址：

1. 点击浏览器工具栏中的插件图标
2. 切换到"对话同步"标签页
3. 点击"设置"按钮
4. 输入 MyPromptManager API 地址（默认：`http://localhost:8000/v1`）
5. 根据需要开启/关闭"自动同步"
6. 点击"保存设置"

### 2. 提取对话历史

#### 方法一：手动提取

1. 访问任何支持的 AI 提供商网站并打开一个对话
2. 点击浏览器工具栏中的插件图标
3. 在"对话同步"标签页中，点击"提取当前对话"按钮
4. 等待提取完成，会显示成功提示

#### 方法二：自动提取

如果开启了"自动同步"，插件会在页面加载后自动提取对话历史（延迟 3 秒）。

### 3. 使用 Prompt & Template 库（NEW）

#### 浏览和搜索

1. 点击浏览器工具栏中的插件图标
2. 切换到"Prompt库"标签页
3. 浏览你的 Prompt 和 Template 列表
4. 使用搜索框快速查找内容
5. 使用筛选按钮切换显示全部/仅 Prompt/仅 Template

#### 复制内容

1. 在列表中点击任意 Prompt 或 Template 卡片
2. 查看完整内容
3. 点击"复制"按钮将内容复制到剪贴板

#### 一键填入对话框

1. 访问任何支持的 AI 提供商网站（ChatGPT、DeepSeek、Claude、Gemini）
2. 打开插件，切换到"Prompt库"标签页
3. 点击任意 Prompt 或 Template 卡片
4. 点击"填入对话框"按钮
5. 内容会自动填入当前页面的输入框，无需手动复制粘贴

### 4. 查看同步状态

点击插件图标，在"对话同步"标签页可以查看：
- 当前检测到的 AI 提供商
- 自动同步状态
- 已保存的对话数量

### 5. 在网页中查看

提取的对话历史会自动同步到 MyPromptManager 系统：

1. 打开 MyPromptManager 网页版（默认：`http://localhost:3000`）
2. 在左侧导航栏点击 "AI Histories"
3. 查看、搜索、过滤你的对话历史
4. 点击任意对话可查看详细内容

## 支持的 AI 提供商

| 提供商 | 网址 | 状态 |
|--------|------|------|
| ChatGPT | https://chat.openai.com<br>https://chatgpt.com | ✅ 支持 |
| DeepSeek | https://chat.deepseek.com | ✅ 支持 |
| Claude | https://claude.ai | ✅ 支持 |
| Gemini | https://gemini.google.com | ✅ 支持 |

## 提取的数据格式

每条对话历史包含以下信息：

```json
{
  "provider": "ChatGPT",
  "conversation_id": "abc123...",
  "title": "对话标题",
  "messages": [
    {
      "role": "user",
      "content": "用户消息内容",
      "timestamp": null,
      "index": 0
    },
    {
      "role": "assistant",
      "content": "AI 回复内容",
      "timestamp": null,
      "index": 1
    }
  ],
  "metadata": {
    "url": "https://...",
    "extractedAt": "2024-01-01T00:00:00.000Z",
    "messageCount": 10
  }
}
```

## 隐私说明

- ✅ **本地优先**：所有对话先保存到浏览器本地存储
- ✅ **可控同步**：可以选择手动同步或自动同步
- ✅ **自托管**：数据同步到你自己的 MyPromptManager 服务器
- ✅ **无外部服务**：不会将数据发送到任何第三方服务器
- ✅ **开源透明**：所有代码开源，可自行审查

## 故障排除

### 插件无法加载

- 确保已开启"开发者模式"
- 检查 manifest.json 文件是否存在
- 查看浏览器控制台是否有错误信息

### 无法提取对话

- 确认当前页面是支持的 AI 提供商
- 确认页面上有对话内容
- 打开浏览器控制台查看错误信息
- AI 提供商可能更新了页面结构，需要更新插件

### 同步失败

- 检查 API 地址是否正确
- 确认 MyPromptManager 后端服务正在运行
- 检查网络连接
- 查看浏览器控制台的错误信息

## 技术实现

- **Manifest V3**：使用最新的浏览器扩展 API
- **Content Scripts**：针对每个 AI 提供商的定制化提取和填充逻辑
- **Background Service Worker**：处理数据同步和存储
- **Chrome Storage API**：本地数据持久化
- **REST API**：与 MyPromptManager 后端通信
- **动态 DOM 操作**：智能识别和填充各平台的输入框
- **双向通信**：Popup、Content Script、Background 三者协同工作

## 开发说明

### 文件结构

```
browser-extension/
├── manifest.json                    # 插件配置文件
├── background.js                    # 后台服务脚本
├── popup.html                      # 弹出窗口 HTML（双标签页界面）
├── popup.js                        # 弹出窗口脚本（包含库浏览功能）
├── content-scripts/                # 内容脚本目录
│   ├── chatgpt.js                 # ChatGPT 提取器 + 填充器
│   ├── deepseek.js                # DeepSeek 提取器 + 填充器
│   ├── claude.js                  # Claude 提取器 + 填充器
│   ├── gemini.js                  # Gemini 提取器 + 填充器
│   └── fill-input-utils.js        # 通用填充工具函数
├── icons/                          # 图标目录
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── test_api.sh                     # API 测试脚本
└── README.md                       # 本文档
```

### 添加新的 AI 提供商

1. 在 `content-scripts/` 目录创建新的提取器脚本
2. 在 `manifest.json` 中添加对应的 content_script 配置
3. 实现对话提取逻辑：
   - 获取对话 ID
   - 获取对话标题
   - 提取消息列表（用户和助手的对话）
4. 在 `popup.js` 的 `detectProvider()` 函数中添加检测逻辑

### 测试 API 集成

使用提供的测试脚本验证插件与后端 API 的集成：

```bash
cd browser-extension
./test_api.sh
```

测试脚本会自动验证：
- 健康检查端点
- 创建 AI 历史记录
- 获取 AI 历史列表
- 更新 AI 历史记录
- 去重处理（相同 conversation_id 自动更新）
- 按提供商过滤

### 调试

1. 在浏览器中打开插件管理页面
2. 找到本插件，点击"检查视图"或"背景页"
3. 打开对应页面，按 F12 打开开发者工具
4. 查看 Console 标签页的日志输出

## 更新日志

### v1.1.0 (2025-11)
- 🎉 **新功能：Prompt & Template 库浏览**
  - ✅ 双标签页界面设计（对话同步 + Prompt库）
  - ✅ 浏览和搜索 Prompt 和 Template
  - ✅ 实时搜索和类型筛选
  - ✅ 一键复制到剪贴板
  - ✅ 一键填入 AI 对话框（支持所有平台）
- 🔧 **增强功能**
  - ✅ Content Scripts 新增输入框填充功能
  - ✅ 智能识别各平台输入框（textarea 和 contenteditable）
  - ✅ 自动触发输入事件确保识别
  - ✅ 优化 UI/UX 设计，更现代化的界面

### v1.0.0 (2024)
- ✅ 初始版本发布
- ✅ 支持 ChatGPT、DeepSeek、Claude、Gemini
- ✅ 自动/手动对话提取
- ✅ 本地存储和后端同步
- ✅ 配置管理

## 许可证

本项目遵循 MIT 许可证。详见 LICENSE 文件。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请在项目 GitHub 页面提交 Issue。
