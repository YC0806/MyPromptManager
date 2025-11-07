#!/usr/bin/env python
"""
测试数据生成脚本
生成提示词、模版和对话历史等测试数据
"""
import os
import json
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
import random

# ULID 生成（简化版，使用时间戳+随机数）
def generate_ulid():
    """生成类似 ULID 的唯一 ID"""
    import time
    timestamp = int(time.time() * 1000)
    random_part = ''.join(random.choices('0123456789ABCDEFGHJKMNPQRSTVWXYZ', k=16))
    return f"{timestamp:013d}{random_part}"

# 配置
REPO_ROOT = Path(__file__).parent / 'repo_root'
PROMPTS_DIR = REPO_ROOT / 'prompts'
TEMPLATES_DIR = REPO_ROOT / 'templates'
CHATS_DIR = REPO_ROOT / 'chats'
PROMPTMETA_DIR = REPO_ROOT / '.promptmeta'
INDEX_FILE = PROMPTMETA_DIR / 'index.json'

# Git 配置
GIT_USER_NAME = "Test User"
GIT_USER_EMAIL = "test@example.com"

# 测试数据：提示词
SAMPLE_PROMPTS = [
    {
        "title": "代码审查助手",
        "slug": "code-review-assistant",
        "description": "帮助开发者进行代码审查，提供改进建议",
        "type": "prompt",
        "labels": ["开发", "代码审查", "最佳实践"],
        "content": """# 代码审查助手

你是一个专业的代码审查专家。请帮我审查以下代码，并提供详细的改进建议。

## 审查重点

1. **代码质量**：检查代码的可读性、可维护性
2. **性能优化**：识别潜在的性能瓶颈
3. **安全问题**：发现可能的安全漏洞
4. **最佳实践**：确保遵循编程语言的最佳实践
5. **错误处理**：检查异常处理是否完善

## 输出格式

- 使用清晰的标题分类问题
- 对每个问题提供具体的代码位置
- 给出改进建议和示例代码
- 标注问题的严重程度（高/中/低）

请开始审查：

{{CODE}}
"""
    },
    {
        "title": "API 文档生成器",
        "slug": "api-doc-generator",
        "description": "根据代码自动生成 API 文档",
        "type": "prompt",
        "labels": ["文档", "API", "自动化"],
        "content": """# API 文档生成器

请根据以下代码生成完整的 API 文档。

## 文档要求

1. **概述**：API 的用途和功能说明
2. **端点列表**：所有可用的 API 端点
3. **请求格式**：
   - HTTP 方法
   - URL 路径
   - 查询参数
   - 请求体结构（JSON schema）
4. **响应格式**：
   - 状态码说明
   - 响应体结构
   - 错误响应示例
5. **示例**：
   - cURL 命令
   - Python 请求示例
   - JavaScript fetch 示例

## 代码

{{CODE}}

请生成完整的 API 文档。
"""
    },
    {
        "title": "SQL 查询优化器",
        "slug": "sql-query-optimizer",
        "description": "分析和优化 SQL 查询性能",
        "type": "prompt",
        "labels": ["数据库", "SQL", "性能优化"],
        "content": """# SQL 查询优化器

我需要优化以下 SQL 查询的性能。

## 当前查询

{{QUERY}}

## 数据库信息

- 数据库类型：{{DB_TYPE}}
- 表结构：{{TABLE_SCHEMA}}
- 数据量：{{DATA_SIZE}}
- 现有索引：{{INDEXES}}

## 请提供

1. **性能分析**：
   - 查询执行计划分析
   - 识别性能瓶颈
   - 估算查询时间

2. **优化建议**：
   - 索引建议
   - 查询重写
   - 表结构优化

3. **优化后的查询**：
   - 完整的 SQL 语句
   - 预期性能提升
   - 注意事项

请开始分析和优化。
"""
    },
    {
        "title": "技术文章写作助手",
        "slug": "tech-blog-writer",
        "description": "帮助撰写技术博客文章",
        "type": "prompt",
        "labels": ["写作", "技术博客", "教程"],
        "content": """# 技术文章写作助手

请帮我撰写一篇关于 {{TOPIC}} 的技术文章。

## 文章要求

1. **目标读者**：{{AUDIENCE}}
2. **文章长度**：{{LENGTH}} 字
3. **技术深度**：{{DEPTH}}（入门/中级/高级）

## 文章结构

1. **引言**：
   - 问题背景
   - 为什么重要
   - 文章概览

2. **核心内容**：
   - 概念解释
   - 技术细节
   - 代码示例
   - 最佳实践

3. **实战案例**：
   - 真实场景
   - 完整代码
   - 运行结果

4. **总结**：
   - 关键要点
   - 进阶方向
   - 参考资源

## 写作风格

- 清晰易懂，避免过度术语
- 使用具体例子
- 代码示例要完整可运行
- 适当使用图表和代码高亮
"""
    },
    {
        "title": "Bug 调试助手",
        "slug": "bug-debugger",
        "description": "帮助定位和修复代码 bug",
        "type": "prompt",
        "labels": ["调试", "故障排查", "开发"],
        "content": """# Bug 调试助手

我遇到了一个 bug，需要帮助调试和修复。

## Bug 信息

**错误描述**：{{ERROR_DESCRIPTION}}

**错误信息**：
```
{{ERROR_MESSAGE}}
```

**相关代码**：
```{{LANGUAGE}}
{{CODE}}
```

**环境信息**：
- 操作系统：{{OS}}
- 编程语言版本：{{LANGUAGE_VERSION}}
- 依赖版本：{{DEPENDENCIES}}

## 复现步骤

{{REPRODUCTION_STEPS}}

## 请提供

1. **问题分析**：
   - 错误原因
   - 问题根源
   - 影响范围

2. **解决方案**：
   - 修复步骤
   - 修改后的代码
   - 测试建议

3. **预防措施**：
   - 如何避免类似问题
   - 最佳实践建议
"""
    },
]

# 测试数据：模版
SAMPLE_TEMPLATES = [
    {
        "title": "代码生成模版",
        "slug": "code-generator-template",
        "description": "通用代码生成模版，支持多种编程语言",
        "type": "template",
        "labels": ["代码生成", "模版", "多语言"],
        "variables": ["LANGUAGE", "FEATURE", "FRAMEWORK"],
        "content": """# {{FEATURE}} 代码生成

请使用 {{LANGUAGE}} 和 {{FRAMEWORK}} 框架生成 {{FEATURE}} 的完整实现代码。

## 要求

1. **代码结构**：
   - 清晰的文件组织
   - 符合框架最佳实践
   - 包含必要的注释

2. **功能完整性**：
   - 核心功能实现
   - 错误处理
   - 输入验证
   - 日志记录

3. **代码质量**：
   - 遵循编码规范
   - 类型安全
   - 单元测试

4. **文档**：
   - 使用说明
   - API 文档
   - 配置示例

请生成完整的代码。
"""
    },
    {
        "title": "测试用例模版",
        "slug": "test-case-template",
        "description": "测试用例生成模版",
        "type": "template",
        "labels": ["测试", "QA", "模版"],
        "variables": ["FEATURE", "TEST_TYPE", "FRAMEWORK"],
        "content": """# {{FEATURE}} 测试用例

请为 {{FEATURE}} 生成 {{TEST_TYPE}} 测试用例，使用 {{FRAMEWORK}} 测试框架。

## 测试覆盖

1. **正常场景**：
   - 基本功能验证
   - 边界条件测试
   - 性能测试

2. **异常场景**：
   - 错误输入处理
   - 异常情况处理
   - 资源不足场景

3. **集成测试**：
   - 接口测试
   - 数据流测试
   - 端到端测试

## 测试格式

- 清晰的测试名称
- Given-When-Then 结构
- 完整的断言
- 测试数据准备和清理

请生成测试用例代码。
"""
    },
    {
        "title": "数据分析模版",
        "slug": "data-analysis-template",
        "description": "数据分析任务模版",
        "type": "template",
        "labels": ["数据分析", "可视化", "报告"],
        "variables": ["DATASET", "ANALYSIS_GOAL", "METRICS"],
        "content": """# {{DATASET}} 数据分析

请对 {{DATASET}} 数据集进行分析，目标是：{{ANALYSIS_GOAL}}

## 分析步骤

1. **数据探索**：
   - 数据概览（shape, dtypes, missing values）
   - 描述性统计
   - 数据分布可视化

2. **数据清洗**：
   - 缺失值处理
   - 异常值检测
   - 数据转换

3. **特征工程**：
   - 特征选择
   - 特征创建
   - 特征编码

4. **分析 {{METRICS}}**：
   - 计算关键指标
   - 趋势分析
   - 相关性分析

5. **可视化**：
   - 创建图表
   - 解释发现
   - 生成报告

请提供完整的 Python 代码（使用 pandas, matplotlib, seaborn）。
"""
    },
]

# 测试数据：对话历史
SAMPLE_CHATS = [
    {
        "title": "讨论代码重构方案",
        "description": "与 AI 讨论如何重构一个复杂的 Python 模块",
        "tags": ["重构", "Python", "架构设计"],
        "messages": [
            {
                "role": "user",
                "content": "我有一个 500 行的 Python 模块，功能很多但代码很混乱。我想重构它，但不知道从哪里开始。",
                "timestamp": "2024-11-01T10:00:00Z"
            },
            {
                "role": "assistant",
                "content": "理解你的困境。重构大型模块需要系统化的方法。让我们从以下几个步骤开始：\n\n1. **理解现有代码**：先阅读代码，列出所有的功能\n2. **识别职责**：找出代码中混在一起的不同职责\n3. **提取函数**：将大函数拆分成小函数\n4. **创建类**：将相关的函数和数据组织成类\n5. **分离模块**：将不同职责的代码分到不同文件\n\n能否分享一下这个模块的主要功能？",
                "timestamp": "2024-11-01T10:01:00Z"
            },
            {
                "role": "user",
                "content": "主要功能包括：1) 从数据库读取数据 2) 数据验证和转换 3) 业务逻辑计算 4) 生成报告 5) 发送邮件通知",
                "timestamp": "2024-11-01T10:03:00Z"
            },
            {
                "role": "assistant",
                "content": "很好！这些功能确实应该分离。我建议的重构方案：\n\n```\nproject/\n├── data/\n│   ├── __init__.py\n│   ├── repository.py      # 数据库操作\n│   └── validator.py       # 数据验证\n├── business/\n│   ├── __init__.py\n│   └── calculator.py      # 业务逻辑\n├── reporting/\n│   ├── __init__.py\n│   └── generator.py       # 报告生成\n└── notification/\n    ├── __init__.py\n    └── email_service.py   # 邮件服务\n```\n\n每个模块负责单一职责。要我帮你生成具体的代码结构吗？",
                "timestamp": "2024-11-01T10:05:00Z"
            },
        ]
    },
    {
        "title": "API 设计讨论",
        "description": "讨论 RESTful API 的设计最佳实践",
        "tags": ["API", "REST", "设计"],
        "messages": [
            {
                "role": "user",
                "content": "我正在设计一个用户管理系统的 API，不确定如何设计 URL 结构。",
                "timestamp": "2024-11-02T14:00:00Z"
            },
            {
                "role": "assistant",
                "content": "RESTful API 设计遵循一些基本原则。对于用户管理系统，我建议：\n\n**资源路径**：\n- `GET /users` - 获取用户列表\n- `GET /users/{id}` - 获取单个用户\n- `POST /users` - 创建用户\n- `PUT /users/{id}` - 更新用户\n- `DELETE /users/{id}` - 删除用户\n\n**嵌套资源**：\n- `GET /users/{id}/posts` - 获取用户的文章\n- `GET /users/{id}/comments` - 获取用户的评论\n\n你的系统有哪些资源需要管理？",
                "timestamp": "2024-11-02T14:02:00Z"
            },
            {
                "role": "user",
                "content": "除了用户，还有角色、权限、部门。用户和角色是多对多关系。",
                "timestamp": "2024-11-02T14:05:00Z"
            },
            {
                "role": "assistant",
                "content": "明白了。对于多对多关系，有两种设计方式：\n\n**方式一：嵌套资源**\n```\nPOST /users/{id}/roles/{roleId}  # 给用户分配角色\nDELETE /users/{id}/roles/{roleId}  # 移除用户角色\nGET /users/{id}/roles  # 获取用户的所有角色\n```\n\n**方式二：独立资源**\n```\nPOST /user-roles\n{\n  \"userId\": 123,\n  \"roleId\": 456\n}\nDELETE /user-roles/{id}\n```\n\n我推荐方式一，更符合 REST 语义。完整的 API 设计：\n\n```\n/users\n/roles\n/permissions\n/departments\n/users/{id}/roles\n/roles/{id}/permissions\n/departments/{id}/users\n```\n\n需要我详细说明每个端点的请求/响应格式吗？",
                "timestamp": "2024-11-02T14:08:00Z"
            },
        ]
    },
]


def setup_git_repo():
    """初始化 Git 仓库并配置用户信息"""
    os.chdir(REPO_ROOT)

    # 配置 Git 用户信息
    subprocess.run(['git', 'config', 'user.name', GIT_USER_NAME], check=True)
    subprocess.run(['git', 'config', 'user.email', GIT_USER_EMAIL], check=True)

    print(f"✅ Git 配置完成：{GIT_USER_NAME} <{GIT_USER_EMAIL}>")


def create_prompt_file(prompt_data, ulid):
    """创建提示词文件"""
    filename = f"prompt_{ulid}.md"
    filepath = PROMPTS_DIR / filename

    # 生成 Front Matter
    front_matter = {
        "id": ulid,
        "title": prompt_data["title"],
        "slug": prompt_data["slug"],
        "description": prompt_data["description"],
        "type": prompt_data["type"],
        "labels": prompt_data["labels"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "version": "1.0.0",
        "status": "draft",
    }

    # 写入文件
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("---\n")
        f.write(json.dumps(front_matter, indent=2, ensure_ascii=False))
        f.write("\n---\n\n")
        f.write(prompt_data["content"])

    return filepath, filename


def create_template_file(template_data, ulid):
    """创建模版文件"""
    filename = f"template_{ulid}.md"
    filepath = TEMPLATES_DIR / filename

    # 生成 Front Matter
    front_matter = {
        "id": ulid,
        "title": template_data["title"],
        "slug": template_data["slug"],
        "description": template_data["description"],
        "type": template_data["type"],
        "labels": template_data["labels"],
        "variables": template_data["variables"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "version": "1.0.0",
        "status": "draft",
    }

    # 写入文件
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("---\n")
        f.write(json.dumps(front_matter, indent=2, ensure_ascii=False))
        f.write("\n---\n\n")
        f.write(template_data["content"])

    return filepath, filename


def create_chat_file(chat_data, ulid):
    """创建对话历史文件"""
    filename = f"chat_{ulid}.json"
    filepath = CHATS_DIR / filename

    chat_object = {
        "id": ulid,
        "title": chat_data["title"],
        "description": chat_data["description"],
        "tags": chat_data["tags"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "messages": chat_data["messages"]
    }

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(chat_object, f, indent=2, ensure_ascii=False)

    return filepath, filename


def git_commit(filepath, message):
    """Git 提交"""
    os.chdir(REPO_ROOT)
    subprocess.run(['git', 'add', str(filepath)], check=True)
    subprocess.run(['git', 'commit', '-m', message], check=True)
    print(f"  ✅ Git commit: {message}")


def publish_version(filepath, prompt_id, version, channel, notes):
    """发布版本（创建 Git 标签）"""
    os.chdir(REPO_ROOT)

    tag_name = f"prompt/{prompt_id}/{version}"

    # 标签消息（JSON 格式）
    tag_message = json.dumps({
        "channel": channel,
        "notes": notes,
        "released_at": datetime.now().isoformat(),
        "version": version,
    }, ensure_ascii=False)

    subprocess.run(['git', 'tag', '-a', tag_name, '-m', tag_message], check=True)
    print(f"  ✅ 发布版本：{tag_name} ({channel})")


def update_index():
    """更新 index.json"""
    index_data = {
        "version": "1.0.0",
        "updated_at": datetime.now().isoformat(),
        "prompts": [],
        "templates": [],
    }

    # 扫描所有提示词
    if PROMPTS_DIR.exists():
        for filepath in PROMPTS_DIR.glob("prompt_*.md"):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                # 提取 Front Matter
                if content.startswith('---\n'):
                    parts = content.split('---\n', 2)
                    if len(parts) >= 3:
                        front_matter = json.loads(parts[1])
                        index_data["prompts"].append({
                            "id": front_matter["id"],
                            "title": front_matter["title"],
                            "slug": front_matter["slug"],
                            "description": front_matter["description"],
                            "type": front_matter["type"],
                            "labels": front_matter["labels"],
                            "status": front_matter.get("status", "draft"),
                            "version": front_matter.get("version", "1.0.0"),
                            "file": str(filepath.relative_to(REPO_ROOT)),
                        })

    # 扫描所有模版
    if TEMPLATES_DIR.exists():
        for filepath in TEMPLATES_DIR.glob("template_*.md"):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if content.startswith('---\n'):
                    parts = content.split('---\n', 2)
                    if len(parts) >= 3:
                        front_matter = json.loads(parts[1])
                        index_data["templates"].append({
                            "id": front_matter["id"],
                            "title": front_matter["title"],
                            "slug": front_matter["slug"],
                            "description": front_matter["description"],
                            "type": front_matter["type"],
                            "labels": front_matter["labels"],
                            "variables": front_matter.get("variables", []),
                            "status": front_matter.get("status", "draft"),
                            "version": front_matter.get("version", "1.0.0"),
                            "file": str(filepath.relative_to(REPO_ROOT)),
                        })

    # 写入 index.json
    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)

    print(f"✅ 索引已更新：{len(index_data['prompts'])} 个提示词，{len(index_data['templates'])} 个模版")


def main():
    """主函数"""
    print("🚀 开始生成测试数据...\n")

    # 1. 设置 Git
    print("📝 设置 Git 仓库...")
    setup_git_repo()
    print()

    # 2. 创建提示词
    print("📄 生成提示词...")
    prompt_ids = []
    for i, prompt_data in enumerate(SAMPLE_PROMPTS):
        ulid = generate_ulid()
        prompt_ids.append((ulid, prompt_data["title"]))
        filepath, filename = create_prompt_file(prompt_data, ulid)
        print(f"  ✅ 创建：{filename} - {prompt_data['title']}")

        # Git 提交
        git_commit(filepath, f"feat: add prompt {prompt_data['title']}")

        # 模拟：部分提示词发布版本
        if i < 3:
            publish_version(
                filepath,
                ulid,
                "v1.0.0",
                "prod",
                f"Initial release of {prompt_data['title']}"
            )
    print()

    # 3. 创建模版
    print("📑 生成模版...")
    for template_data in SAMPLE_TEMPLATES:
        ulid = generate_ulid()
        filepath, filename = create_template_file(template_data, ulid)
        print(f"  ✅ 创建：{filename} - {template_data['title']}")

        # Git 提交
        git_commit(filepath, f"feat: add template {template_data['title']}")
    print()

    # 4. 创建对话历史
    print("💬 生成对话历史...")
    for chat_data in SAMPLE_CHATS:
        ulid = generate_ulid()
        filepath, filename = create_chat_file(chat_data, ulid)
        print(f"  ✅ 创建：{filename} - {chat_data['title']}")

        # Git 提交
        git_commit(filepath, f"feat: add chat {chat_data['title']}")
    print()

    # 5. 更新索引
    print("📇 更新索引...")
    update_index()
    print()

    print("=" * 60)
    print("🎉 测试数据生成完成！")
    print("=" * 60)
    print(f"\n📊 统计：")
    print(f"  • {len(SAMPLE_PROMPTS)} 个提示词")
    print(f"  • {len(SAMPLE_TEMPLATES)} 个模版")
    print(f"  • {len(SAMPLE_CHATS)} 个对话历史")
    print(f"\n📁 位置：{REPO_ROOT}")
    print(f"\n🔍 查看 Git 历史：")
    print(f"  cd {REPO_ROOT} && git log --oneline")
    print(f"\n🏷️  查看版本标签：")
    print(f"  cd {REPO_ROOT} && git tag")
    print()


if __name__ == '__main__':
    main()
