# MyPromptManager - 本地使用配置

本应用专为**本地使用**设计，已移除所有登录和身份验证功能，可直接访问所有功能。

## 🚀 快速启动

> ⚠️ **首次运行必读**: 如果是首次运行，需要先执行数据库迁移。由于移除了身份验证，我们已经简化了迁移过程，无需创建超级用户。

### 1. 启动后端

```bash
# 从项目根目录
python manage.py migrate  # 首次运行必须执行（已自动修复 User 模型冲突）
python manage.py runserver
```

后端将运行在：http://127.0.0.1:8000

> 📖 如果遇到迁移问题，请查看 [DATABASE_MIGRATION_FIX.md](DATABASE_MIGRATION_FIX.md)

### 2. 启动前端

```bash
# 使用启动脚本（推荐）
./start-frontend.sh

# 或手动启动
cd frontend
npm install  # 首次运行需要
npm run dev
```

前端将运行在：http://localhost:3000

### 3. 访问应用

打开浏览器访问：**http://localhost:3000**

无需登录，直接开始使用！

---

## 🔒 无身份验证配置

### 后端配置

已在 [config/settings.py](config/settings.py) 中配置：

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
```

这意味着：
- ✅ 所有 API 端点无需身份验证即可访问
- ✅ 不需要 Token 或登录凭证
- ✅ 适合本地开发和个人使用

### 前端配置

已在 [frontend/src/lib/api.js](frontend/src/lib/api.js) 中移除：

```javascript
// ❌ 已移除
// - Token 获取和注入
// - 401 错误处理和登录跳转
// - localStorage token 管理

// ✅ 保留
// - Branch 头部注入
// - 基本错误处理
```

UI 变化：
- ❌ 移除了用户菜单（Profile, Logout 等）
- ✅ 保留了设置和帮助按钮
- ✅ 所有功能正常使用

---

## 📝 默认作者信息

由于没有登录功能，Git 提交将使用配置的默认作者：

### 配置 Git 用户信息

```bash
# 在项目目录下设置
cd repo_root
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

这将影响：
- Git 提交的作者信息
- 审计日志中显示的用户
- 发布记录中的创建者

---

## 🛠 本地使用场景

此配置适合以下场景：

### ✅ 适用场景
- 个人使用（单用户）
- 本地开发和测试
- 内网环境使用
- 快速原型验证
- 学习和演示

### ❌ 不适用场景
- 多用户协作（无权限控制）
- 互联网公开访问（无安全保护）
- 生产环境部署（需要身份验证）

---

## 🔧 如果需要启用身份验证

如果未来需要添加身份验证，可以：

### 1. 后端恢复身份验证

编辑 `config/settings.py`：

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### 2. 前端添加登录功能

编辑 `frontend/src/lib/api.js`：

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### 3. 添加登录页面

需要创建：
- Login 页面组件
- 用户管理功能
- Token 获取和刷新逻辑

---

## 🌐 网络访问

### 本机访问
- 前端：http://localhost:3000
- 后端：http://127.0.0.1:8000
- Admin：http://127.0.0.1:8000/admin（可选）

### 局域网访问

如需在局域网内其他设备访问：

#### 1. 后端允许局域网访问

编辑 `config/settings.py`：

```python
ALLOWED_HOSTS = ['*']  # 或指定具体 IP
```

启动时绑定所有接口：

```bash
python manage.py runserver 0.0.0.0:8000
```

#### 2. 前端允许局域网访问

编辑 `frontend/vite.config.js`：

```javascript
server: {
  host: '0.0.0.0',
  port: 3000,
}
```

#### 3. 访问地址

从其他设备访问（将 `YOUR_IP` 替换为实际 IP）：
- 前端：http://YOUR_IP:3000
- 后端：http://YOUR_IP:8000

---

## 🐛 常见问题

### Q: API 返回 403 Forbidden
**A**: 检查 `settings.py` 中 REST_FRAMEWORK 配置是否正确设置为 `AllowAny`

### Q: 前端显示 401 错误
**A**: 确保前端 `api.js` 已移除 token 相关代码

### Q: 如何查看当前作者信息？
**A**: 运行 `cd repo_root && git config user.name` 和 `git config user.email`

### Q: 能否禁用 Django Admin？
**A**: 可以，在 `config/urls.py` 中注释掉 admin 路由：
```python
# path('admin/', admin.site.urls),  # 已禁用
```

---

## 📚 相关文档

- [QUICK_START_FRONTEND.md](QUICK_START_FRONTEND.md) - 前端快速开始
- [FRONTEND_SETUP.md](FRONTEND_SETUP.md) - 前端详细设置
- [README.md](README.md) - 项目总体说明
- [CLAUDE.md](CLAUDE.md) - API 规范

---

## ⚠️ 安全提醒

**重要**: 此配置**仅适用于本地使用**

如果需要在生产环境或公网部署，**必须**：

1. ✅ 启用身份验证和授权
2. ✅ 使用 HTTPS
3. ✅ 配置正确的 CORS 策略
4. ✅ 设置强密码策略
5. ✅ 启用 CSRF 保护
6. ✅ 定期更新依赖包
7. ✅ 配置防火墙规则
8. ✅ 启用日志审计

---

## 🎉 开始使用

现在你可以：

1. 启动后端：`python manage.py runserver`
2. 启动前端：`./start-frontend.sh`
3. 访问应用：http://localhost:3000
4. 开始管理你的 Prompts！

**无需登录，无需配置，开箱即用！** ✨

---

**最后更新**: 2025-11-06
**版本**: 1.0.0 (本地无认证版)
