#!/bin/bash

# 测试数据验证脚本

echo "🔍 验证测试数据..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
PASS_COUNT=0
FAIL_COUNT=0

check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASS_COUNT++))
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAIL_COUNT++))
}

# 检查 repo_root 目录
echo "## 1. 检查目录结构"
echo ""

if [ -d "repo_root" ]; then
    check_pass "repo_root 目录存在"
else
    check_fail "repo_root 目录不存在"
fi

if [ -d "repo_root/.git" ]; then
    check_pass "Git 仓库已初始化"
else
    check_fail "Git 仓库未初始化"
fi

if [ -d "repo_root/.promptmeta" ]; then
    check_pass ".promptmeta 目录存在"
else
    check_fail ".promptmeta 目录不存在"
fi

if [ -d "repo_root/projects/default/prompts" ]; then
    check_pass "prompts 目录存在"
else
    check_fail "prompts 目录不存在"
fi

if [ -d "repo_root/projects/default/templates" ]; then
    check_pass "templates 目录存在"
else
    check_fail "templates 目录不存在"
fi

if [ -d "repo_root/projects/default/chats" ]; then
    check_pass "chats 目录存在"
else
    check_fail "chats 目录不存在"
fi

echo ""
echo "## 2. 检查文件数量"
echo ""

# 检查提示词文件
PROMPT_COUNT=$(find repo_root/projects/default/prompts -name "prompt_*.md" 2>/dev/null | wc -l)
if [ "$PROMPT_COUNT" -eq 5 ]; then
    check_pass "提示词文件数量正确：5 个"
else
    check_fail "提示词文件数量错误：期望 5 个，实际 $PROMPT_COUNT 个"
fi

# 检查模版文件
TEMPLATE_COUNT=$(find repo_root/projects/default/templates -name "template_*.md" 2>/dev/null | wc -l)
if [ "$TEMPLATE_COUNT" -eq 3 ]; then
    check_pass "模版文件数量正确：3 个"
else
    check_fail "模版文件数量错误：期望 3 个，实际 $TEMPLATE_COUNT 个"
fi

# 检查对话历史文件
CHAT_COUNT=$(find repo_root/projects/default/chats -name "chat_*.json" 2>/dev/null | wc -l)
if [ "$CHAT_COUNT" -eq 2 ]; then
    check_pass "对话历史文件数量正确：2 个"
else
    check_fail "对话历史文件数量错误：期望 2 个，实际 $CHAT_COUNT 个"
fi

echo ""
echo "## 3. 检查索引文件"
echo ""

if [ -f "repo_root/.promptmeta/index.json" ]; then
    check_pass "index.json 文件存在"

    # 检查索引内容
    if command -v python &> /dev/null; then
        INDEX_PROMPTS=$(python -c "import json; data=json.load(open('repo_root/.promptmeta/index.json')); print(len(data['prompts']))" 2>/dev/null)
        INDEX_TEMPLATES=$(python -c "import json; data=json.load(open('repo_root/.promptmeta/index.json')); print(len(data['templates']))" 2>/dev/null)

        if [ "$INDEX_PROMPTS" = "5" ]; then
            check_pass "索引包含 5 个提示词"
        else
            check_fail "索引提示词数量错误：期望 5 个，实际 $INDEX_PROMPTS 个"
        fi

        if [ "$INDEX_TEMPLATES" = "3" ]; then
            check_pass "索引包含 3 个模版"
        else
            check_fail "索引模版数量错误：期望 3 个，实际 $INDEX_TEMPLATES 个"
        fi
    fi
else
    check_fail "index.json 文件不存在"
fi

echo ""
echo "## 4. 检查 Git 历史"
echo ""

cd repo_root 2>/dev/null || exit 1

# 检查提交数量
COMMIT_COUNT=$(git log --oneline 2>/dev/null | wc -l)
if [ "$COMMIT_COUNT" -ge 10 ]; then
    check_pass "Git 提交数量：$COMMIT_COUNT 个（期望至少 10 个）"
else
    check_fail "Git 提交数量不足：期望至少 10 个，实际 $COMMIT_COUNT 个"
fi

# 检查标签数量
TAG_COUNT=$(git tag 2>/dev/null | wc -l)
if [ "$TAG_COUNT" -ge 3 ]; then
    check_pass "Git 标签数量：$TAG_COUNT 个（期望至少 3 个）"
else
    check_fail "Git 标签数量不足：期望至少 3 个，实际 $TAG_COUNT 个"
fi

# 检查 Git 用户配置
GIT_USER=$(git config user.name 2>/dev/null)
if [ -n "$GIT_USER" ]; then
    check_pass "Git 用户配置：$GIT_USER"
else
    check_fail "Git 用户未配置"
fi

cd .. 2>/dev/null || exit 1

echo ""
echo "## 5. 检查文件内容"
echo ""

# 检查第一个提示词文件格式
FIRST_PROMPT=$(find repo_root/projects/default/prompts -name "prompt_*.md" 2>/dev/null | head -1)
if [ -n "$FIRST_PROMPT" ]; then
    if grep -q "^---$" "$FIRST_PROMPT"; then
        check_pass "提示词文件包含 Front Matter"
    else
        check_fail "提示词文件缺少 Front Matter"
    fi

    if grep -q '"id":' "$FIRST_PROMPT"; then
        check_pass "提示词文件包含 ID 字段"
    else
        check_fail "提示词文件缺少 ID 字段"
    fi
fi

# 检查第一个对话历史文件格式
FIRST_CHAT=$(find repo_root/projects/default/chats -name "chat_*.json" 2>/dev/null | head -1)
if [ -n "$FIRST_CHAT" ]; then
    if command -v python &> /dev/null; then
        if python -c "import json; json.load(open('$FIRST_CHAT'))" 2>/dev/null; then
            check_pass "对话历史文件 JSON 格式正确"
        else
            check_fail "对话历史文件 JSON 格式错误"
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 验证结果"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ 通过: $PASS_COUNT${NC}"
echo -e "${RED}❌ 失败: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 恭喜！所有验证都通过了！"
    echo ""
    echo "📁 测试数据位置："
    echo "   $(pwd)/repo_root"
    echo ""
    echo "🔍 查看测试数据："
    echo "   cd repo_root"
    echo "   git log --oneline          # 查看提交历史"
    echo "   git tag                    # 查看版本标签"
    echo "   find projects -type f      # 查看所有文件"
    echo ""
    echo "🚀 启动应用："
    echo "   python manage.py runserver      # 启动后端"
    echo "   ./start-frontend.sh             # 启动前端（新终端）"
    echo "   访问 http://localhost:3000       # 访问应用"
else
    echo "❌ 发现 $FAIL_COUNT 个问题，请检查上述失败项"
    echo ""
    echo "💡 重新生成测试数据："
    echo "   rm -rf repo_root"
    echo "   mkdir -p repo_root/.promptmeta/schema"
    echo "   mkdir -p repo_root/projects/default/{prompts,templates,chats}"
    echo "   cd repo_root && git init && cd .."
    echo "   python generate_test_data.py"
fi

echo ""
echo "📖 详细说明请查看: TEST_DATA_README.md"
echo ""
