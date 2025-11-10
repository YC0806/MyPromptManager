# 数据库迁移修复说明

## 问题描述

在移除身份验证功能后，运行 `python manage.py migrate` 时出现错误：

```
SystemCheckError: System check identified some issues:

ERRORS:
auth.User.groups: (fields.E304) Reverse accessor 'Group.user_set' for 'auth.User.groups' clashes with reverse accessor for 'core.User.groups'.
auth_user: (models.E028) db_table 'auth_user' is used by multiple models: auth.User, core.User.
```

## 根本原因

项目中定义了自定义的 `User` 模型（继承自 `AbstractUser`），与 Django 内置的 `auth.User` 模型产生冲突。由于我们已经移除了身份验证功能，这个自定义模型不再需要。

## 解决方案

### 1. 移除自定义 User 模型

修改 `apps/core/models.py`：

**之前**:
```python
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    release_permission = models.BooleanField(default=False)

    class Meta:
        db_table = 'auth_user'

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    # ...
```

**之后**:
```python
from django.db import models

class AuditLog(models.Model):
    username = models.CharField(max_length=150, null=True, blank=True)
    # ... (移除了 ForeignKey 到 User)
```

### 2. 更新 AuditLog 模型

- ❌ 移除了 `user` ForeignKey 字段
- ✅ 添加了 `username` CharField（用于记录 Git 用户名）
- ✅ 所有字段设置为可选（`null=True, blank=True`）

### 3. 重新创建迁移

```bash
# 删除旧的迁移文件
rm -rf apps/core/migrations/0001_initial.py

# 创建新的迁移
python manage.py makemigrations

# 删除旧数据库（本地开发环境）
rm -f db.sqlite3

# 运行迁移
python manage.py migrate
```

## 结果

迁移成功执行，所有表已创建：

```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, core, sessions
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  Applying admin.0001_initial... OK
  ...
  Applying core.0001_initial... OK
  Applying sessions.0001_initial... OK
```

## 数据库表结构

### audit_logs 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| timestamp | DATETIME | 操作时间 |
| username | VARCHAR(150) | Git 用户名（可选） |
| action | VARCHAR(100) | 操作类型 |
| resource_type | VARCHAR(50) | 资源类型 |
| resource_id | VARCHAR(100) | 资源 ID |
| details | JSON | 详细信息 |
| ip_address | VARCHAR(39) | IP 地址（可选） |

## 审计日志使用方式

由于没有用户认证，审计日志将记录：

1. **操作时间**: 自动记录
2. **用户名**: 从 Git 配置获取（可选）
3. **操作类型**: 如 `create_prompt`, `publish_release`, `rollback`
4. **资源信息**: 类型和 ID
5. **详细信息**: JSON 格式的额外数据

### 示例代码

```python
from apps.core.models import AuditLog
import subprocess

# 获取 Git 用户名
try:
    git_username = subprocess.check_output(
        ['git', 'config', 'user.name'],
        cwd=settings.GIT_REPO_ROOT
    ).decode().strip()
except:
    git_username = 'local-user'

# 创建审计日志
AuditLog.objects.create(
    username=git_username,
    action='publish_release',
    resource_type='prompt',
    resource_id='01HQXYZ123ABC456DEF789',
    details={
        'version': 'v1.0.0',
        'channel': 'prod',
        'notes': 'Initial release'
    }
)
```

## 验证步骤

### 1. 检查数据库

```bash
# 启动 Django shell
python manage.py shell

# 验证模型
from apps.core.models import AuditLog
AuditLog.objects.all()
```

### 2. 创建测试记录

```python
AuditLog.objects.create(
    username='test-user',
    action='test_action',
    resource_type='prompt',
    resource_id='test-123',
    details={'test': 'data'}
)
```

### 3. 查询记录

```python
logs = AuditLog.objects.all()
for log in logs:
    print(log)
```

## 迁移清单

- [x] 移除自定义 User 模型
- [x] 更新 AuditLog 模型（使用 username 字段）
- [x] 删除旧迁移文件
- [x] 创建新迁移
- [x] 删除旧数据库
- [x] 运行迁移
- [x] 验证表结构
- [x] 更新文档

## 注意事项

### 对于开发环境

- ✅ 可以直接删除 `db.sqlite3` 重新迁移
- ✅ 不会丢失重要数据（Prompts 存储在 Git）
- ✅ 审计日志会重新开始

### 对于生产环境（如果部署）

如果已经在生产环境部署并有数据：

1. **备份数据库**:
   ```bash
   cp db.sqlite3 db.sqlite3.backup
   ```

2. **导出审计日志**（可选）:
   ```bash
   python manage.py dumpdata core.AuditLog > audit_logs.json
   ```

3. **执行数据迁移**:
   - 创建数据迁移脚本
   - 将 `user_id` 转换为 `username`
   - 应用新迁移

4. **导入审计日志**（可选）:
   ```bash
   python manage.py loaddata audit_logs.json
   ```

## 相关文件

- `apps/core/models.py` - 数据模型定义
- `apps/core/migrations/0001_initial.py` - 迁移文件
- `config/settings.py` - Django 配置
- `LOCAL_SETUP.md` - 本地使用指南
- `NO_AUTH_CHANGES.md` - 身份验证移除说明

## 下一步

现在你可以正常使用应用了：

```bash
# 启动后端
python manage.py runserver

# 启动前端（另一个终端）
./start-frontend.sh

# 访问应用
# http://localhost:3000
```

所有功能正常，无需身份验证！

---

**修复时间**: 2025-11-06
**状态**: ✅ 已解决
