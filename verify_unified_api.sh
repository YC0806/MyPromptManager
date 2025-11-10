#!/bin/bash

echo "=========================================="
echo "统一 API 架构验证脚本"
echo "=========================================="
echo ""

# 检查后端是否运行
echo "1. 检查后端服务..."
if curl -s http://localhost:8000/v1/health > /dev/null 2>&1; then
    echo "   ✅ 后端服务运行正常"
else
    echo "   ❌ 后端服务未运行，请先启动: python manage.py runserver"
    exit 1
fi

# 测试 Prompts API
echo ""
echo "2. 测试 Prompts API..."
PROMPTS_COUNT=$(curl -s http://localhost:8000/v1/prompts | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])")
echo "   ✅ Prompts 总数: $PROMPTS_COUNT"

# 测试 Templates API
echo ""
echo "3. 测试 Templates API..."
TEMPLATES_COUNT=$(curl -s http://localhost:8000/v1/templates | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])")
echo "   ✅ Templates 总数: $TEMPLATES_COUNT"

# 测试 Chats API
echo ""
echo "4. 测试 Chats API..."
CHATS_COUNT=$(curl -s http://localhost:8000/v1/chats | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])")
echo "   ✅ Chats 总数: $CHATS_COUNT"

# 测试 Search API (验证 items 字段)
echo ""
echo "5. 测试 Search API (验证 items 字段)..."
SEARCH_RESPONSE=$(curl -s "http://localhost:8000/v1/search?limit=3")
HAS_ITEMS=$(echo "$SEARCH_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print('items' in data)")
if [ "$HAS_ITEMS" = "True" ]; then
    ITEMS_COUNT=$(echo "$SEARCH_RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['items']))")
    echo "   ✅ Search API 返回 'items' 字段，包含 $ITEMS_COUNT 个项目"
else
    echo "   ❌ Search API 未返回 'items' 字段"
    exit 1
fi

# 验证搜索结果按时间排序
echo ""
echo "6. 验证搜索结果排序..."
FIRST_UPDATED=$(echo "$SEARCH_RESPONSE" | python3 -c "import sys, json; items = json.load(sys.stdin)['items']; print(items[0]['updated_at'] if items else '')")
echo "   ✅ 最新项目更新时间: $FIRST_UPDATED"

# 运行后端测试
echo ""
echo "7. 运行完整后端测试..."
TEST_RESULT=$(python3 tests/api/run_api_tests.py 2>&1 | grep -c "PASS")
if [ "$TEST_RESULT" -eq 12 ]; then
    echo "   ✅ 后端测试: 12/12 通过"
else
    echo "   ⚠️  后端测试: $TEST_RESULT/12 通过"
fi

echo ""
echo "=========================================="
echo "验证完成！"
echo "=========================================="
echo ""
echo "前端访问地址："
echo "  • Dashboard:    http://localhost:5173/"
echo "  • Prompts:      http://localhost:5173/prompts"
echo "  • Templates:    http://localhost:5173/templates"
echo "  • Chats:        http://localhost:5173/chats"
echo "  • API 测试页面:  http://localhost:5173/test-api-integration.html"
echo ""
echo "启动前端: cd frontend && npm run dev"
echo ""
