#!/usr/bin/env python3
"""
创建多个测试项目作为测试数据
包括不同类型的提示词、模板和对话历史
"""
import os
import json
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
import random
import time

# ULID 生成（简化版）
def generate_ulid():
    """生成类似 ULID 的唯一 ID"""
    timestamp = int(time.time() * 1000)
    random_part = ''.join(random.choices('0123456789ABCDEFGHJKMNPQRSTVWXYZ', k=16))
    return f"{timestamp:013d}{random_part}"

# 配置
REPO_ROOT = Path(__file__).parent / 'repo_root'
PROJECTS_DIR = REPO_ROOT / 'projects'
PROMPTMETA_DIR = REPO_ROOT / '.promptmeta'
INDEX_FILE = PROMPTMETA_DIR / 'index.json'

# Git 配置
GIT_USER_NAME = "Test User"
GIT_USER_EMAIL = "test@example.com"

# 项目定义
PROJECTS = [
    {
        "name": "default",
        "description": "默认项目",
        "prompts": [
            {
                "title": "代码审查助手",
                "slug": "code-review-assistant",
                "description": "帮助开发者进行代码审查，提供改进建议",
                "labels": ["开发", "代码审查", "最佳实践"],
                "author": "admin",
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
""",
                "publish": True,
                "version": "v1.0.0"
            },
            {
                "title": "API 文档生成器",
                "slug": "api-doc-generator",
                "description": "根据代码自动生成 API 文档",
                "labels": ["文档", "API", "自动化"],
                "author": "admin",
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
""",
                "publish": True,
                "version": "v1.0.0"
            },
            {
                "title": "SQL 查询优化器",
                "slug": "sql-optimizer",
                "description": "分析和优化 SQL 查询性能",
                "labels": ["数据库", "SQL", "性能优化"],
                "author": "admin",
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
""",
                "publish": False
            }
        ],
        "templates": [
            {
                "title": "代码生成模版",
                "slug": "code-generator",
                "description": "通用代码生成模版，支持多种编程语言",
                "labels": ["代码生成", "模版", "多语言"],
                "author": "admin",
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
            }
        ]
    },
    {
        "name": "frontend",
        "description": "前端开发项目",
        "prompts": [
            {
                "title": "React 组件生成器",
                "slug": "react-component-generator",
                "description": "生成 React 功能组件和 Hooks",
                "labels": ["React", "前端", "组件"],
                "author": "developer",
                "content": """# React 组件生成器

请生成一个 React 功能组件：{{COMPONENT_NAME}}

## 需求

- 组件功能：{{FUNCTIONALITY}}
- Props 接口：{{PROPS}}
- 使用的 Hooks：{{HOOKS}}
- 样式方案：{{STYLING}}

## 要求

1. 使用 TypeScript
2. 包含完整的类型定义
3. 添加 PropTypes 或类型注释
4. 包含使用示例
5. 响应式设计
6. 可访问性支持（ARIA）

请生成组件代码。
""",
                "publish": True,
                "version": "v1.0.0"
            },
            {
                "title": "CSS 样式优化器",
                "slug": "css-optimizer",
                "description": "优化和重构 CSS 代码",
                "labels": ["CSS", "优化", "前端"],
                "author": "developer",
                "content": """# CSS 样式优化器

请优化以下 CSS 代码：

{{CSS_CODE}}

## 优化目标

1. **减少冗余**：合并重复样式
2. **提高性能**：优化选择器
3. **增强可维护性**：使用 CSS 变量和模块化
4. **浏览器兼容**：添加必要的前缀
5. **响应式设计**：优化媒体查询

请提供优化后的代码和说明。
""",
                "publish": False
            }
        ],
        "templates": [
            {
                "title": "Vue 组件模版",
                "slug": "vue-component-template",
                "description": "Vue 3 Composition API 组件模版",
                "labels": ["Vue", "前端", "模版"],
                "author": "developer",
                "variables": ["COMPONENT_NAME", "PROPS", "EMITS"],
                "content": """# {{COMPONENT_NAME}} 组件

请创建 Vue 3 组件：{{COMPONENT_NAME}}

## Props
{{PROPS}}

## Emits
{{EMITS}}

## 要求
- 使用 Composition API
- TypeScript 支持
- 完整的类型定义
- 单元测试
"""
            }
        ]
    },
    {
        "name": "backend",
        "description": "后端开发项目",
        "prompts": [
            {
                "title": "RESTful API 设计器",
                "slug": "restful-api-designer",
                "description": "设计符合 REST 规范的 API",
                "labels": ["API", "REST", "后端"],
                "author": "backend-dev",
                "content": """# RESTful API 设计器

请为以下资源设计 RESTful API：

## 资源信息

- 资源名称：{{RESOURCE_NAME}}
- 资源属性：{{ATTRIBUTES}}
- 关联资源：{{RELATIONSHIPS}}
- 业务规则：{{BUSINESS_RULES}}

## 设计要求

1. **URL 设计**：
   - 遵循 REST 命名约定
   - 合理的资源嵌套
   - 版本控制策略

2. **HTTP 方法**：
   - GET, POST, PUT, PATCH, DELETE
   - 幂等性考虑
   - 批量操作设计

3. **请求/响应格式**：
   - JSON Schema 定义
   - 分页和过滤
   - 排序和搜索
   - 错误响应格式（RFC 7807）

4. **状态码**：
   - 2xx, 4xx, 5xx 使用场景
   - 自定义错误码

5. **安全性**：
   - 认证方案（JWT, OAuth）
   - 授权检查
   - 速率限制

请生成完整的 API 设计文档。
""",
                "publish": True,
                "version": "v2.0.0"
            },
            {
                "title": "数据库 Schema 设计器",
                "slug": "db-schema-designer",
                "description": "设计数据库表结构和关系",
                "labels": ["数据库", "设计", "Schema"],
                "author": "backend-dev",
                "content": """# 数据库 Schema 设计器

请为以下需求设计数据库结构：

## 业务需求

{{REQUIREMENTS}}

## 设计要求

1. **表设计**：
   - 主键和外键
   - 索引策略
   - 数据类型选择
   - 约束条件

2. **关系设计**：
   - 一对一、一对多、多对多
   - 关联表设计
   - 级联操作

3. **优化考虑**：
   - 查询性能
   - 存储效率
   - 扩展性

4. **规范化**：
   - 第三范式（3NF）
   - 反规范化场景

请生成 SQL DDL 语句。
""",
                "publish": True,
                "version": "v1.1.0"
            }
        ],
        "templates": [
            {
                "title": "GraphQL Schema 模版",
                "slug": "graphql-schema-template",
                "description": "GraphQL API Schema 定义模版",
                "labels": ["GraphQL", "API", "Schema"],
                "author": "backend-dev",
                "variables": ["TYPE_NAME", "FIELDS", "RESOLVERS"],
                "content": """# GraphQL Schema: {{TYPE_NAME}}

## Type Definition

type {{TYPE_NAME}} {
  {{FIELDS}}
}

## Resolvers

{{RESOLVERS}}

## Queries & Mutations

请定义相关的查询和变更操作。
"""
            }
        ]
    }
]


def setup_git_repo():
    """初始化 Git 仓库并配置用户信息"""
    os.chdir(REPO_ROOT)
    subprocess.run(['git', 'config', 'user.name', GIT_USER_NAME], check=True)
    subprocess.run(['git', 'config', 'user.email', GIT_USER_EMAIL], check=True)
    print(f"✅ Git 配置完成：{GIT_USER_NAME} <{GIT_USER_EMAIL}>")


def create_prompt_file(project_name, prompt_data, ulid):
    """创建提示词文件"""
    prompts_dir = PROJECTS_DIR / project_name / 'prompts'
    prompts_dir.mkdir(parents=True, exist_ok=True)

    filename = f"prompt_{ulid}.md"
    filepath = prompts_dir / filename

    # 生成 Front Matter
    front_matter = {
        "id": ulid,
        "title": prompt_data["title"],
        "slug": prompt_data["slug"],
        "description": prompt_data["description"],
        "type": "prompt",
        "project": project_name,
        "labels": prompt_data["labels"],
        "author": prompt_data.get("author", "anonymous"),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "version": prompt_data.get("version", "1.0.0"),
        "status": "draft",
    }

    # 写入文件
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("---\n")
        f.write(json.dumps(front_matter, indent=2, ensure_ascii=False))
        f.write("\n---\n\n")
        f.write(prompt_data["content"])

    return filepath, filename, ulid


def create_template_file(project_name, template_data, ulid):
    """创建模版文件"""
    templates_dir = PROJECTS_DIR / project_name / 'templates'
    templates_dir.mkdir(parents=True, exist_ok=True)

    filename = f"template_{ulid}.md"
    filepath = templates_dir / filename

    # 生成 Front Matter
    front_matter = {
        "id": ulid,
        "title": template_data["title"],
        "slug": template_data["slug"],
        "description": template_data["description"],
        "type": "template",
        "project": project_name,
        "labels": template_data["labels"],
        "author": template_data.get("author", "anonymous"),
        "variables": template_data.get("variables", []),
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

    return filepath, filename, ulid


def git_commit(filepath, message):
    """Git 提交"""
    os.chdir(REPO_ROOT)
    subprocess.run(['git', 'add', str(filepath)], check=True)
    subprocess.run(['git', 'commit', '-m', message], check=True)
    print(f"  ✅ Git commit: {message}")


def publish_version(prompt_id, version, channel, title):
    """发布版本（创建 Git 标签）"""
    os.chdir(REPO_ROOT)

    tag_name = f"prompt/{prompt_id}/{version}"

    # 标签消息（JSON 格式）
    tag_message = json.dumps({
        "channel": channel,
        "notes": f"Release {version} of {title}",
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

    # 扫描所有项目的提示词
    for project_dir in PROJECTS_DIR.iterdir():
        if not project_dir.is_dir():
            continue

        project_name = project_dir.name
        prompts_dir = project_dir / 'prompts'

        if prompts_dir.exists():
            for filepath in prompts_dir.glob("prompt_*.md"):
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
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
                                "project": front_matter.get("project", project_name),
                                "labels": front_matter["labels"],
                                "author": front_matter.get("author", "anonymous"),
                                "status": front_matter.get("status", "draft"),
                                "version": front_matter.get("version", "1.0.0"),
                                "file": str(filepath.relative_to(REPO_ROOT)),
                            })

    # 扫描所有项目的模版
    for project_dir in PROJECTS_DIR.iterdir():
        if not project_dir.is_dir():
            continue

        project_name = project_dir.name
        templates_dir = project_dir / 'templates'

        if templates_dir.exists():
            for filepath in templates_dir.glob("template_*.md"):
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
                                "project": front_matter.get("project", project_name),
                                "labels": front_matter["labels"],
                                "author": front_matter.get("author", "anonymous"),
                                "variables": front_matter.get("variables", []),
                                "status": front_matter.get("status", "draft"),
                                "version": front_matter.get("version", "1.0.0"),
                                "file": str(filepath.relative_to(REPO_ROOT)),
                            })

    # 确保 .promptmeta 目录存在
    PROMPTMETA_DIR.mkdir(parents=True, exist_ok=True)

    # 写入 index.json
    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)

    print(f"✅ 索引已更新：{len(index_data['prompts'])} 个提示词，{len(index_data['templates'])} 个模版")


def main():
    """主函数"""
    print("🚀 开始创建测试项目数据...\n")

    # 1. 设置 Git
    print("📝 设置 Git 仓库...")
    setup_git_repo()
    print()

    total_prompts = 0
    total_templates = 0
    published_count = 0

    # 2. 遍历每个项目
    for project in PROJECTS:
        project_name = project["name"]
        print(f"📁 项目：{project_name} - {project['description']}")

        # 创建提示词
        for prompt_data in project.get("prompts", []):
            ulid = generate_ulid()
            time.sleep(0.01)  # 确保 ULID 唯一

            filepath, filename, prompt_id = create_prompt_file(project_name, prompt_data, ulid)
            print(f"  📄 提示词：{prompt_data['title']}")

            # Git 提交
            git_commit(filepath, f"feat({project_name}): add prompt {prompt_data['title']}")

            # 发布版本
            if prompt_data.get("publish", False):
                version = prompt_data.get("version", "v1.0.0")
                publish_version(prompt_id, version, "prod", prompt_data['title'])
                published_count += 1

            total_prompts += 1

        # 创建模版
        for template_data in project.get("templates", []):
            ulid = generate_ulid()
            time.sleep(0.01)

            filepath, filename, template_id = create_template_file(project_name, template_data, ulid)
            print(f"  📑 模版：{template_data['title']}")

            # Git 提交
            git_commit(filepath, f"feat({project_name}): add template {template_data['title']}")

            total_templates += 1

        print()

    # 3. 更新索引
    print("📇 更新索引...")
    update_index()

    # Git 提交索引
    git_commit(INDEX_FILE, "chore: update index")
    print()

    print("=" * 60)
    print("🎉 测试项目数据创建完成！")
    print("=" * 60)
    print(f"\n📊 统计：")
    print(f"  • {len(PROJECTS)} 个项目")
    print(f"  • {total_prompts} 个提示词")
    print(f"  • {total_templates} 个模版")
    print(f"  • {published_count} 个已发布版本")
    print(f"\n📁 位置：{REPO_ROOT}")
    print(f"\n🔍 查看 Git 历史：")
    print(f"  cd {REPO_ROOT} && git log --oneline")
    print(f"\n🏷️  查看版本标签：")
    print(f"  cd {REPO_ROOT} && git tag")
    print()


if __name__ == '__main__':
    main()
