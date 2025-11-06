# 快速开始指南 🚀

## 一键启动（推荐）

```bash
./start-dev.sh
```

这个脚本会自动：
- ✅ 创建虚拟环境（如果不存在）
- ✅ 安装依赖
- ✅ 初始化数据库
- ✅ 启动后端服务（端口 8000）
- ✅ 启动前端服务（端口 3000 或 3001）

## 手动启动

### 第一次使用

#### 1. 后端设置

```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 初始化数据库
python manage.py migrate

# 创建管理员账号
python manage.py createsuperuser
```

#### 2. 前端设置

```bash
cd frontend
npm install
cd ..
```

### 日常启动

在两个终端窗口中分别运行：

**终端 1 - 后端**
```bash
source venv/bin/activate
python manage.py runserver
```

**终端 2 - 前端**
```bash
cd frontend
npm run dev
```

## 访问应用

- 🌐 **前端界面**: http://localhost:3000
- 🔌 **后端 API**: http://127.0.0.1:8000
- 👤 **管理后台**: http://127.0.0.1:8000/admin

## 常见问题

### 1. 端口被占用

**前端端口冲突**：Vite 会自动尝试下一个可用端口（3001, 3002...）

**后端端口冲突**：
```bash
# 指定其他端口
python manage.py runserver 8001
```

### 2. 依赖问题

**后端依赖错误**：
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

**前端依赖错误**：
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 3. 数据库问题

**重置数据库**：
```bash
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### 4. Git 仓库问题

**初始化 Git 仓库**：
```bash
mkdir -p repo_root
cd repo_root
git init
cd ..
```

## 开发工作流

### 1. 创建提示词

通过前端界面或 API：

```bash
curl -X POST http://localhost:8000/v1/simple/prompts/01EXAMPLE123/save \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "---\nid: 01EXAMPLE123\ntitle: Test Prompt\ntype: prompt\n---\n\nContent here",
    "message": "Initial version"
  }'
```

### 2. 发布版本

```bash
curl -X POST http://localhost:8000/v1/simple/prompts/01EXAMPLE123/publish \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "base_sha": "abc123",
    "channel": "prod",
    "version": "auto",
    "notes": "First release"
  }'
```

### 3. 搜索提示词

```bash
curl http://localhost:8000/v1/search?type=prompt&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 获取 Token

### 方法 1: 通过管理后台

1. 访问 http://127.0.0.1:8000/admin
2. 登录管理员账号
3. 进入 "Authentication and Authorization" → "Tokens"
4. 为你的用户创建 Token

### 方法 2: 通过 Django Shell

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

user = User.objects.get(username='your_username')
token = Token.objects.create(user=user)
print(f"Your token: {token.key}")
```

## 环境变量配置

创建 `.env` 文件（可选）：

```env
# Django
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Git
GIT_REPO_ROOT=/path/to/repo_root
GIT_DEFAULT_BRANCH=main
```

## 生产部署

查看详细部署指南：[DEPLOYMENT.md](DEPLOYMENT.md)

简要步骤：
1. 设置环境变量
2. 配置 PostgreSQL（可选）
3. 配置 Gunicorn + Nginx
4. 构建前端静态文件
5. 配置 SSL 证书

## 测试 API

健康检查（无需认证）：
```bash
curl http://localhost:8000/v1/health
```

应该返回：
```json
{
  "status": "healthy",
  "git": {
    "healthy": true,
    "branch": "main"
  },
  "index": {
    "healthy": true,
    "prompts_count": 0,
    "templates_count": 0
  }
}
```

## 更多资源

- 📖 [完整文档](README.md)
- 💡 [API 使用示例](USAGE_EXAMPLES.md)
- 🚀 [部署指南](DEPLOYMENT.md)
- 📊 [项目总结](PROJECT_SUMMARY.md)

## 需要帮助？

- 查看日志：
  - 后端：终端输出或 `backend.log`
  - 前端：浏览器开发者工具

- 常用命令：
  ```bash
  # 查看 Django 版本
  python -m django --version

  # 查看安装的包
  pip list

  # 运行测试
  python manage.py test

  # 创建超级用户
  python manage.py createsuperuser
  ```

祝开发愉快！ 🎉
