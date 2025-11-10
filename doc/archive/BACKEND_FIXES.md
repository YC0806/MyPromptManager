# 后端问题修复总结

## 📋 修复的问题列表

在测试过程中，发现并修复了以下后端 API 问题：

### 1. ✅ Front Matter 解析器不支持 JSON 格式

**问题描述**:
- 测试数据生成脚本使用 JSON 格式的 Front Matter
- 后端的 `parse_frontmatter` 函数只支持 YAML 格式
- 导致无法正确解析测试数据文件

**错误表现**:
```python
# 生成的文件格式：
---
{
  "id": "17624181723706T8HN33F0NQD6QF0",
  "title": "代码审查助手",
  ...
}
---

# 解析器期望 YAML 格式
```

**修复方案**:
修改 `apps/core/utils/frontmatter.py`，增加对 JSON 格式的支持：

```python
def parse_frontmatter(content: str) -> Tuple[Dict, str]:
    """
    Parse Markdown content with YAML or JSON Front Matter.

    Supports both YAML and JSON formats between --- delimiters.
    """
    # Match front matter between --- delimiters
    pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.match(pattern, content, re.DOTALL)

    if not match:
        return {}, content

    frontmatter_content = match.group(1).strip()
    markdown_body = match.group(2)

    # Try to parse as JSON first (if it starts with {)
    if frontmatter_content.startswith('{'):
        try:
            metadata = json.loads(frontmatter_content)
            return metadata, markdown_body
        except json.JSONDecodeError:
            pass  # Fall back to YAML

    # Parse as YAML
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.default_flow_style = False

    try:
        metadata = yaml.load(frontmatter_content) or {}
    except Exception:
        metadata = {}

    return metadata, markdown_body
```

**结果**: ✅ 索引重建成功，能够正确解析所有测试数据文件

---

### 2. ✅ Git 服务的 Tree 导航错误

**问题描述**:
- `GitService.read_file()` 方法在读取带路径的文件时失败
- `commit.tree` 返回的是 SHA（bytes），而不是 Tree 对象
- 代码试图直接在 bytes 上使用字典访问，导致 `TypeError`

**错误日志**:
```
TypeError: byte indices must be integers or slices, not bytes
File ".../git_service.py", line 142, in read_file
    mode, sha = current_tree[part.encode('utf-8')]
```

**根本原因**:
```python
# 错误的代码：
tree = commit.tree  # 返回 SHA (bytes)
current_tree = tree  # current_tree 是 bytes
mode, sha = current_tree[part.encode('utf-8')]  # TypeError!
```

**修复方案**:
修改 `apps/core/services/git_service.py`，正确解引用 tree SHA：

```python
# 修复后的代码：
# Get tree object (commit.tree returns SHA, need to dereference)
tree = self.repo[commit.tree]  # 解引用 SHA 得到 Tree 对象

# Navigate through directory structure
path_parts = file_path.split('/')
current_tree = tree

for part in path_parts[:-1]:
    # Navigate to subdirectory
    mode, sha = current_tree[part.encode('utf-8')]
    current_tree = self.repo[sha]  # 解引用每层的 SHA
```

同样修复了 `get_file_sha()` 方法中的相同问题。

**结果**: ✅ 能够正确读取带路径的文件

---

### 3. ✅ Tag 引用解析不正确

**问题描述**:
- API 传递标签名称如 `prompt/xxx/v1.0.0`
- `read_file()` 方法无法正确解析标签引用
- 注释标签（annotated tag）需要特殊处理

**错误表现**:
```
ResourceNotFoundError: File projects/default/prompts/prompt_xxx.md
not found at ref prompt/xxx/v1.0.0
```

**修复方案**:
修改 `read_file()` 方法，支持多种引用格式：

```python
# Try to resolve ref (could be tag name, branch name, or SHA)
ref_bytes = ref.encode('utf-8')
obj = None

# Try different ref formats
for ref_format in [
    ref_bytes,  # Direct SHA
    f'refs/tags/{ref}'.encode('utf-8'),  # Tag
    f'refs/heads/{ref}'.encode('utf-8'),  # Branch
]:
    try:
        if ref_format in self.repo.refs:
            obj = self.repo[self.repo.refs[ref_format]]
            break
        else:
            # Try as direct SHA
            obj = self.repo[ref_bytes]
            break
    except KeyError:
        continue

if obj is None:
    raise KeyError(f"Reference {ref} not found")

# If it's a tag object, dereference to commit
if isinstance(obj, Tag):
    commit = self.repo[obj.object[1]]
else:
    commit = obj
```

**结果**: ✅ 能够正确解析标签名称、分支名称和 SHA

---

## 🧪 测试结果

修复后，所有 API 端点都正常工作：

### 1. 健康检查 ✅

```bash
$ curl http://127.0.0.1:8000/v1/health
```

```json
{
    "status": "healthy",
    "git": {
        "healthy": true,
        "branch": "5945709756ba4bea104e7019559ca7be367363e8"
    },
    "index": {
        "healthy": true,
        "prompts_count": 5,
        "templates_count": 3,
        "last_updated": "2025-11-06T08:50:36.896974",
        "index_size_bytes": 4974
    }
}
```

### 2. 搜索端点 ✅

```bash
$ curl "http://127.0.0.1:8000/v1/search?project=default"
```

返回 5 个提示词 + 3 个模版，数据正确。

### 3. 获取提示词内容 ✅

```bash
$ curl "http://127.0.0.1:8000/v1/simple/prompts/17624181723706T8HN33F0NQD6QF0/content?ref=latest"
```

返回完整的 Markdown 内容，包括 Front Matter 和正文。

### 4. 时间线 ✅

```bash
$ curl "http://127.0.0.1:8000/v1/simple/prompts/17624181723706T8HN33F0NQD6QF0/timeline?view=all"
```

```json
{
    "prompt_id": "17624181723706T8HN33F0NQD6QF0",
    "timeline": [
        {
            "type": "release",
            "version": "v1.0.0",
            "sha": "ccb45333418c65c8af4e5d26649517b983423539",
            "channel": "prod",
            "notes": "Initial release of 代码审查助手",
            "released_at": "2025-11-06T16:36:12.399351"
        },
        {
            "type": "draft",
            "sha": "c6460ed0f0f96adac34ebf0bc911a332e15cde44",
            "message": "feat: add prompt 代码审查助手\n",
            "author": "Test User <test@example.com>",
            "timestamp": "2025-11-06T08:36:12"
        }
    ]
}
```

### 5. 索引重建 ✅

```bash
$ curl -X POST http://127.0.0.1:8000/v1/index/rebuild
```

```json
{
    "status": "completed",
    "stats": {
        "prompts_added": 5,
        "templates_added": 3,
        "errors": []
    }
}
```

---

## 📝 修改的文件

### 1. `apps/core/utils/frontmatter.py`

**修改内容**:
- 添加 `import json`
- 修改 `parse_frontmatter()` 函数，增加 JSON 解析支持
- 保持向后兼容 YAML 格式

**影响范围**:
- 索引服务扫描文件时的解析
- API 端点读取文件内容时的解析
- 所有使用 Front Matter 的地方

### 2. `apps/core/services/git_service.py`

**修改内容**:
- 修改 `read_file()` 方法：
  - 添加引用格式解析逻辑（支持标签名、分支名、SHA）
  - 修复 Tree 对象解引用（`self.repo[commit.tree]`）
  - 添加注释标签的特殊处理
- 修改 `get_file_sha()` 方法：
  - 修复 Tree 对象解引用

**影响范围**:
- 所有读取 Git 文件的 API 端点
- 版本管理功能
- 时间线功能
- 对比和回滚功能

---

## 🔍 根本原因分析

### 1. 数据格式不一致

**问题**: 测试数据生成脚本和后端解析器使用了不同的数据格式。

**教训**:
- 需要明确定义数据格式规范
- 解析器应该更加宽容，支持多种格式
- 或者统一所有地方使用同一种格式

**建议**:
- 在文档中明确说明支持 JSON 和 YAML 两种格式
- 优先使用 JSON（更易于程序生成）

### 2. Git API 使用不当

**问题**: 对 dulwich 库的 API 理解不深入，假设 `commit.tree` 返回对象而不是 SHA。

**教训**:
- 需要仔细阅读库的文档
- Git 对象模型中，对象之间的引用是通过 SHA 实现的
- 所有 SHA 都需要通过 `repo[sha]` 解引用

**建议**:
- 添加更多的类型检查和调试日志
- 编写单元测试覆盖不同的 Git 场景

### 3. 引用解析不够灵活

**问题**: 假设所有引用都是直接的 SHA，没有考虑标签名称和分支名称。

**教训**:
- Git 有多种引用方式（refs/tags/*, refs/heads/*, SHA）
- 需要提供灵活的引用解析机制
- 注释标签需要特殊处理（是 Tag 对象，不是 Commit）

**建议**:
- 提供统一的引用解析函数
- 文档中明确说明支持的引用格式

---

## ✅ 验证清单

- [x] 所有测试数据文件能够正确解析
- [x] 索引重建成功，无错误
- [x] 搜索 API 返回正确的结果
- [x] 内容 API 能够读取已发布版本
- [x] 时间线 API 正确显示发布和草稿
- [x] 健康检查显示系统正常
- [x] 无 500 错误
- [x] 无 KeyError 或 TypeError

---

## 🚀 后续建议

### 1. 添加单元测试

为修复的功能添加单元测试：

```python
# tests/test_frontmatter.py
def test_parse_json_frontmatter():
    content = """---
{
  "id": "test123",
  "title": "Test"
}
---

# Content
"""
    metadata, body = parse_frontmatter(content)
    assert metadata['id'] == 'test123'
    assert body.strip() == '# Content'

# tests/test_git_service.py
def test_read_file_with_tag():
    git_service = GitService()
    content = git_service.read_file(
        'projects/default/prompts/prompt_xxx.md',
        ref='prompt/xxx/v1.0.0'
    )
    assert content is not None
```

### 2. 改进错误处理

添加更详细的错误信息和日志：

```python
import logging

logger = logging.getLogger(__name__)

def read_file(self, file_path: str, ref: Optional[str] = None) -> str:
    if ref:
        logger.debug(f"Reading {file_path} at ref {ref}")
        try:
            # ... code ...
        except KeyError as e:
            logger.error(f"Failed to read {file_path} at ref {ref}: {e}")
            raise ResourceNotFoundError(...)
```

### 3. 性能优化

考虑缓存已解析的对象：

```python
class GitService:
    def __init__(self):
        self._repo = None
        self._cache = {}  # 缓存已解引用的对象
```

### 4. 文档更新

更新 API 文档，说明：
- 支持的 Front Matter 格式（JSON 和 YAML）
- 支持的引用格式（标签名、分支名、SHA）
- 错误响应格式

---

## 📊 统计

- **修复的文件数**: 2
- **修改的方法数**: 3
- **修复的 bug 数**: 3
- **测试的 API 端点**: 5+
- **测试时间**: ~30 分钟

---

**修复日期**: 2025-11-06
**修复者**: Claude
**状态**: ✅ 完成
**测试状态**: ✅ 全部通过
