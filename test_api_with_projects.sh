#!/bin/bash

# 测试后端 API 与多项目数据
# 验证所有 API 端点是否正确读取测试数据

BACKEND_URL="http://127.0.0.1:8000"

echo "=================================="
echo "🌐 测试后端 API 与项目数据"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 测试计数
PASSED=0
FAILED=0

# 测试 API 并显示结果
test_api() {
    local description=$1
    local endpoint=$2
    local show_output=${3:-false}

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}测试: $description${NC}"
    echo -e "端点: $endpoint"
    echo ""

    response=$(curl -s "$BACKEND_URL$endpoint")
    status=$?

    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓ 请求成功${NC}"
        ((PASSED++))

        if [ "$show_output" = "true" ]; then
            echo ""
            echo "响应内容:"
            echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
        else
            # 显示简要信息
            echo ""
            echo "响应摘要:"
            echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if isinstance(data, dict):
        print(f'  类型: dict')
        print(f'  键: {list(data.keys())}')
        if 'results' in data:
            print(f'  结果数: {len(data[\"results\"])}')
    elif isinstance(data, list):
        print(f'  类型: list')
        print(f'  数量: {len(data)}')
except:
    print('  无法解析 JSON')
" 2>/dev/null
        fi
    else
        echo -e "${RED}✗ 请求失败${NC}"
        ((FAILED++))
    fi

    echo ""
}

# 1. 健康检查
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${YELLOW}1. 健康检查${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""
test_api "系统健康状态" "/v1/health" true

# 2. 搜索 API
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${YELLOW}2. 搜索 API${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""

test_api "搜索所有提示词" "/v1/search?type=prompt" true
test_api "搜索所有模版" "/v1/search?type=template" true
test_api "搜索 default 项目" "/v1/search?project=default"
test_api "搜索 frontend 项目" "/v1/search?project=frontend"
test_api "搜索 backend 项目" "/v1/search?project=backend"
test_api "按标签搜索（开发）" "/v1/search?labels=开发"
test_api "按作者搜索（admin）" "/v1/search?author=admin"

# 3. 获取特定提示词数据
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${YELLOW}3. 获取特定提示词${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""

# 从索引获取提示词 ID
echo "从索引获取提示词 ID..."
PROMPT_IDS=$(curl -s "$BACKEND_URL/v1/search?type=prompt&limit=5" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for item in data.get('results', []):
    print(item['id'])
" 2>/dev/null)

echo "找到的提示词 ID:"
echo "$PROMPT_IDS" | head -5
echo ""

# 测试第一个提示词
FIRST_PROMPT_ID=$(echo "$PROMPT_IDS" | head -1)

if [ -n "$FIRST_PROMPT_ID" ]; then
    echo "使用提示词 ID: $FIRST_PROMPT_ID"
    echo ""

    # Simple API
    test_api "获取提示词内容（latest）" "/v1/simple/prompts/$FIRST_PROMPT_ID/content?ref=latest"
    test_api "获取时间线（所有）" "/v1/simple/prompts/$FIRST_PROMPT_ID/timeline?view=all"
    test_api "获取时间线（发布）" "/v1/simple/prompts/$FIRST_PROMPT_ID/timeline?view=releases"

    # Detail API
    test_api "获取提交历史" "/v1/detail/prompts/$FIRST_PROMPT_ID/history"
    test_api "获取发布列表" "/v1/detail/prompts/$FIRST_PROMPT_ID/releases" true
else
    echo -e "${RED}⚠ 无法获取提示词 ID${NC}"
fi

# 4. 索引管理
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${YELLOW}4. 索引管理${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""

test_api "获取索引状态" "/v1/index/status" true

# 5. Git 操作
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${YELLOW}5. Git 操作${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""

test_api "获取分支列表" "/v1/detail/git/branches" true

# 6. 按项目统计
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${YELLOW}6. 项目统计${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""

echo "各项目统计:"
echo ""

for project in default frontend backend; do
    echo -e "${YELLOW}项目: $project${NC}"

    prompt_count=$(curl -s "$BACKEND_URL/v1/search?project=$project&type=prompt" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(len(data.get('results', [])))
except:
    print(0)
" 2>/dev/null)

    template_count=$(curl -s "$BACKEND_URL/v1/search?project=$project&type=template" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(len(data.get('results', [])))
except:
    print(0)
" 2>/dev/null)

    echo "  提示词: $prompt_count"
    echo "  模版: $template_count"
    echo ""
done

# 7. 发布版本统计
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${YELLOW}7. 发布版本统计${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""

echo "已发布的提示词:"
echo ""

for prompt_id in $PROMPT_IDS; do
    releases=$(curl -s "$BACKEND_URL/v1/detail/prompts/$prompt_id/releases" 2>/dev/null)

    if [ -n "$releases" ]; then
        count=$(echo "$releases" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if isinstance(data, list):
        print(len(data))
    else:
        print(0)
except:
    print(0)
" 2>/dev/null)

        if [ "$count" -gt 0 ]; then
            title=$(curl -s "$BACKEND_URL/v1/search?type=prompt" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for item in data.get('results', []):
    if item['id'] == '$prompt_id':
        print(item['title'])
        break
" 2>/dev/null)

            versions=$(echo "$releases" | python3 -c "
import sys, json
data = json.load(sys.stdin)
versions = [r.get('version', '') for r in data]
print(', '.join(versions))
" 2>/dev/null)

            echo "  $title ($prompt_id)"
            echo "    版本: $versions"
            echo ""
        fi
    fi
done

# 总结
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${YELLOW}测试总结${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}通过: $PASSED${NC}"
echo -e "  ${RED}失败: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 所有 API 测试通过！${NC}"
    exit 0
else
    echo -e "${RED}❌ 有 $FAILED 个测试失败${NC}"
    exit 1
fi
