#!/bin/bash

# 后端 API 测试脚本
# 测试所有主要的 API 端点

echo "🧪 测试 MyPromptManager 后端 API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

BASE_URL="http://127.0.0.1:8000"

# 测试计数
PASS_COUNT=0
FAIL_COUNT=0

test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    echo -e "${CYAN}Testing: $name${NC}"
    echo "  URL: $url"

    response=$(curl -s -w "\n%{http_code}" "$url")
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "  ${GREEN}✅ Status: $status_code${NC}"
        ((PASS_COUNT++))
    else
        echo -e "  ${RED}❌ Status: $status_code (expected $expected_status)${NC}"
        echo "  Response: $body"
        ((FAIL_COUNT++))
        return 1
    fi

    echo ""
    return 0
}

test_json_response() {
    local name=$1
    local url=$2
    local json_check=$3

    echo -e "${CYAN}Testing: $name${NC}"
    echo "  URL: $url"

    response=$(curl -s "$url")

    if echo "$response" | python -m json.tool > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Valid JSON${NC}"

        if [ -n "$json_check" ]; then
            if echo "$response" | python -c "
import json, sys
data = json.load(sys.stdin)
$json_check
" 2>/dev/null; then
                echo -e "  ${GREEN}✅ JSON validation passed${NC}"
                ((PASS_COUNT++))
            else
                echo -e "  ${RED}❌ JSON validation failed${NC}"
                echo "  Response: $response"
                ((FAIL_COUNT++))
            fi
        else
            ((PASS_COUNT++))
        fi
    else
        echo -e "  ${RED}❌ Invalid JSON${NC}"
        echo "  Response: $response"
        ((FAIL_COUNT++))
    fi

    echo ""
}

echo "## 1. 健康检查"
echo ""

test_json_response \
    "Health check" \
    "$BASE_URL/v1/health" \
    "assert data['status'] == 'healthy'"

echo "## 2. 索引状态"
echo ""

test_json_response \
    "Index status" \
    "$BASE_URL/v1/index/status" \
    "assert data['prompts_count'] >= 0 and data['templates_count'] >= 0"

echo "## 3. 搜索功能"
echo ""

test_json_response \
    "Search all prompts" \
    "$BASE_URL/v1/search?project=default" \
    "assert 'results' in data and isinstance(data['results'], list)"

test_json_response \
    "Search by type (prompt)" \
    "$BASE_URL/v1/search?project=default&type=prompt" \
    "assert all(r.get('file_path', '').find('/prompts/') > 0 or r.get('file_path', '').find('/templates/') > 0 for r in data['results'])"

test_json_response \
    "Search with limit" \
    "$BASE_URL/v1/search?project=default&limit=2" \
    "assert len(data['results']) <= 2"

echo "## 4. Simple API - 提示词内容"
echo ""

# 从搜索结果获取第一个提示词 ID
PROMPT_ID=$(curl -s "$BASE_URL/v1/search?project=default&type=prompt&limit=1" | python -c "import json, sys; data=json.load(sys.stdin); print(data['results'][0]['id']) if data['results'] else exit(1)" 2>/dev/null)

if [ -n "$PROMPT_ID" ]; then
    echo "Using prompt ID: $PROMPT_ID"
    echo ""

    test_json_response \
        "Get prompt content (latest)" \
        "$BASE_URL/v1/simple/prompts/$PROMPT_ID/content?ref=latest" \
        "assert 'content' in data and 'metadata' in data and 'body' in data"

    test_json_response \
        "Get prompt timeline" \
        "$BASE_URL/v1/simple/prompts/$PROMPT_ID/timeline?view=all" \
        "assert 'timeline' in data and isinstance(data['timeline'], list)"

else
    echo -e "${YELLOW}⚠️  No prompts found, skipping prompt-specific tests${NC}"
    echo ""
fi

echo "## 5. Schema 端点"
echo ""

test_json_response \
    "Get frontmatter schema" \
    "$BASE_URL/v1/schemas/frontmatter" \
    "assert '\$schema' in data or 'properties' in data"

test_json_response \
    "Get index schema" \
    "$BASE_URL/v1/schemas/index" \
    "assert '\$schema' in data or 'properties' in data"

echo "## 6. 索引管理"
echo ""

echo -e "${CYAN}Testing: Repair index${NC}"
echo "  URL: $BASE_URL/v1/index/repair"
response=$(curl -s -X POST "$BASE_URL/v1/index/repair")
if echo "$response" | python -m json.tool > /dev/null 2>&1; then
    if echo "$response" | python -c "import json, sys; data=json.load(sys.stdin); assert 'status' in data" 2>/dev/null; then
        echo -e "  ${GREEN}✅ Valid JSON${NC}"
        echo -e "  ${GREEN}✅ JSON validation passed${NC}"
        ((PASS_COUNT++))
    else
        echo -e "  ${RED}❌ JSON validation failed${NC}"
        echo "  Response: $response"
        ((FAIL_COUNT++))
    fi
else
    echo -e "  ${RED}❌ Invalid JSON${NC}"
    echo "  Response: $response"
    ((FAIL_COUNT++))
fi
echo ""

# 注意：rebuild 会重建整个索引，比较耗时
# test_json_response \
#     "Rebuild index" \
#     "$BASE_URL/v1/index/rebuild" \
#     "assert 'status' in data and 'stats' in data"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 测试结果"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ 通过: $PASS_COUNT${NC}"
echo -e "${RED}❌ 失败: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 所有测试通过！"
    echo ""
    echo "后端 API 工作正常，可以继续开发或部署。"
else
    echo "❌ 发现 $FAIL_COUNT 个失败的测试"
    echo ""
    echo "请检查："
    echo "  1. 后端服务是否正在运行（python manage.py runserver）"
    echo "  2. 测试数据是否已生成（python generate_test_data.py）"
    echo "  3. 检查服务器日志获取详细错误信息"
fi

echo ""
echo "📖 详细说明请查看："
echo "  • BACKEND_FIXES.md - 已修复的问题"
echo "  • TEST_DATA_README.md - 测试数据说明"
echo "  • QUICK_TEST.md - 快速测试指南"
echo ""

exit $FAIL_COUNT
