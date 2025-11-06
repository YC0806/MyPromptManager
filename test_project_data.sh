#!/bin/bash

# 测试项目数据验证脚本
# 验证生成的测试数据是否完整，并测试后端API

set -e  # 遇到错误立即退出

REPO_ROOT="repo_root"
BACKEND_URL="http://127.0.0.1:8000"

echo "=================================="
echo "🧪 测试项目数据验证"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_item() {
    local description=$1
    local command=$2

    echo -n "  测试: $description ... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# 测试 API 端点
test_api() {
    local description=$1
    local endpoint=$2
    local expected_status=${3:-200}

    echo -n "  API: $description ... "

    status=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL$endpoint" 2>/dev/null || echo "000")

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, Got $status)"
        ((FAILED++))
        return 1
    fi
}

# 1. 检查基本目录结构
echo "📁 1. 检查目录结构"
test_item "repo_root 目录存在" "[ -d '$REPO_ROOT' ]"
test_item "Git 仓库已初始化" "[ -d '$REPO_ROOT/.git' ]"
test_item ".promptmeta 目录存在" "[ -d '$REPO_ROOT/.promptmeta' ]"
test_item "projects 目录存在" "[ -d '$REPO_ROOT/projects' ]"
echo ""

# 2. 检查项目目录
echo "📦 2. 检查项目目录"
test_item "default 项目存在" "[ -d '$REPO_ROOT/projects/default' ]"
test_item "frontend 项目存在" "[ -d '$REPO_ROOT/projects/frontend' ]"
test_item "backend 项目存在" "[ -d '$REPO_ROOT/projects/backend' ]"
echo ""

# 3. 检查文件数量
echo "📄 3. 检查文件数量"
prompt_count=$(find $REPO_ROOT/projects -name "prompt_*.md" | wc -l | tr -d ' ')
template_count=$(find $REPO_ROOT/projects -name "template_*.md" | wc -l | tr -d ' ')

echo "  提示词数量: $prompt_count"
test_item "至少有 7 个提示词" "[ $prompt_count -ge 7 ]"

echo "  模版数量: $template_count"
test_item "至少有 3 个模版" "[ $template_count -ge 3 ]"
echo ""

# 4. 检查索引文件
echo "📇 4. 检查索引文件"
test_item "index.json 存在" "[ -f '$REPO_ROOT/.promptmeta/index.json' ]"

if [ -f "$REPO_ROOT/.promptmeta/index.json" ]; then
    index_prompts=$(cat $REPO_ROOT/.promptmeta/index.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('prompts', [])))")
    index_templates=$(cat $REPO_ROOT/.promptmeta/index.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('templates', [])))")

    echo "  索引中的提示词: $index_prompts"
    echo "  索引中的模版: $index_templates"

    test_item "索引包含所有提示词" "[ $index_prompts -eq $prompt_count ]"
    test_item "索引包含所有模版" "[ $index_templates -eq $template_count ]"
fi
echo ""

# 5. 检查 Git 提交
echo "🔀 5. 检查 Git 提交"
cd $REPO_ROOT
commit_count=$(git log --oneline | wc -l | tr -d ' ')
echo "  提交数量: $commit_count"
test_item "至少有 10 个提交" "[ $commit_count -ge 10 ]"
cd ..
echo ""

# 6. 检查 Git 标签
echo "🏷️  6. 检查 Git 标签"
cd $REPO_ROOT
tag_count=$(git tag | wc -l | tr -d ' ')
echo "  标签数量: $tag_count"
test_item "至少有 5 个版本标签" "[ $tag_count -ge 5 ]"

# 检查特定版本
test_item "存在 v1.0.0 版本" "git tag | grep -q 'v1.0.0'"
test_item "存在 v2.0.0 版本" "git tag | grep -q 'v2.0.0'"
test_item "存在 v1.1.0 版本" "git tag | grep -q 'v1.1.0'"
cd ..
echo ""

# 7. 检查文件内容格式
echo "📝 7. 检查文件内容格式"
sample_prompt=$(find $REPO_ROOT/projects -name "prompt_*.md" | head -1)
if [ -n "$sample_prompt" ]; then
    test_item "提示词文件包含 Front Matter" "head -1 '$sample_prompt' | grep -q '^---$'"
    test_item "Front Matter 是有效的 JSON" "sed -n '2,/^---$/p' '$sample_prompt' | head -n -1 | python3 -m json.tool > /dev/null"
fi
echo ""

# 8. 测试后端 API（如果后端在运行）
echo "🌐 8. 测试后端 API"
echo "  检查后端是否运行..."

if curl -s "$BACKEND_URL/v1/health" > /dev/null 2>&1; then
    echo -e "  ${GREEN}后端服务正在运行${NC}"
    echo ""

    # 通用 API 测试
    echo "  📍 通用 API 端点："
    test_api "健康检查" "/v1/health" 200
    test_api "搜索所有提示词" "/v1/search?type=prompt"
    test_api "搜索 default 项目" "/v1/search?project=default"
    test_api "搜索 frontend 项目" "/v1/search?project=frontend"
    test_api "搜索 backend 项目" "/v1/search?project=backend"
    test_api "索引状态" "/v1/index/status"
    echo ""

    # Simple API 测试
    echo "  📍 Simple API 端点："
    # 获取第一个提示词 ID
    first_prompt_id=$(cat $REPO_ROOT/.promptmeta/index.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['prompts'][0]['id'])" 2>/dev/null || echo "")

    if [ -n "$first_prompt_id" ]; then
        test_api "获取提示词内容" "/v1/simple/prompts/$first_prompt_id/content?ref=latest"
        test_api "获取时间线" "/v1/simple/prompts/$first_prompt_id/timeline?view=all"
    else
        echo -e "  ${YELLOW}⚠ 无法获取提示词 ID，跳过 Simple API 测试${NC}"
    fi
    echo ""

    # Detail API 测试
    echo "  📍 Detail API 端点："
    if [ -n "$first_prompt_id" ]; then
        test_api "获取提示词历史" "/v1/detail/prompts/$first_prompt_id/history"
        test_api "获取发布列表" "/v1/detail/prompts/$first_prompt_id/releases"
    fi
    test_api "获取分支列表" "/v1/detail/git/branches"
    echo ""

else
    echo -e "  ${YELLOW}⚠ 后端服务未运行，跳过 API 测试${NC}"
    echo "  启动后端: python manage.py runserver"
    echo ""
fi

# 9. 项目统计
echo "📊 9. 项目统计"
echo ""
echo "  项目结构："
cd $REPO_ROOT
tree -L 3 -I '.git' projects 2>/dev/null || find projects -type d | head -20
cd ..
echo ""

echo "  各项目统计："
for project_dir in $REPO_ROOT/projects/*; do
    if [ -d "$project_dir" ]; then
        project_name=$(basename "$project_dir")
        p_count=$(find "$project_dir" -name "prompt_*.md" 2>/dev/null | wc -l | tr -d ' ')
        t_count=$(find "$project_dir" -name "template_*.md" 2>/dev/null | wc -l | tr -d ' ')
        echo "    $project_name: $p_count 个提示词, $t_count 个模版"
    fi
done
echo ""

# 10. 总结
echo "=================================="
echo "📈 测试结果总结"
echo "=================================="
echo ""
echo -e "  ${GREEN}通过: $PASSED${NC}"
echo -e "  ${RED}失败: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}❌ 有 $FAILED 个测试失败${NC}"
    exit 1
fi
