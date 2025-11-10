#!/bin/bash

echo "=========================================="
echo "验证 Simple/Advanced 模式已完全移除"
echo "=========================================="
echo ""

# 检查前端代码中是否还有 mode 相关引用
echo "1. 检查前端代码中的 mode 引用..."
MODE_REFS=$(grep -r "mode === 'simple'\|mode === 'advanced'\|setMode" frontend/src --include="*.jsx" --include="*.js" 2>/dev/null | wc -l)

if [ "$MODE_REFS" -eq 0 ]; then
    echo "   ✅ 没有发现 simple/advanced mode 引用"
else
    echo "   ⚠️  发现 $MODE_REFS 处 mode 引用（可能是 viewMode，请人工检查）"
    grep -r "mode === 'simple'\|mode === 'advanced'\|setMode" frontend/src --include="*.jsx" --include="*.js" 2>/dev/null | head -5
fi

# 检查 store 中是否还有 mode 状态
echo ""
echo "2. 检查全局状态管理..."
if grep -q "mode:" frontend/src/store/useStore.js 2>/dev/null; then
    echo "   ❌ store 中仍有 mode 状态"
else
    echo "   ✅ store 中已移除 mode 状态"
fi

# 检查 Topbar 是否还有模式切换
echo ""
echo "3. 检查 Topbar 组件..."
if grep -q "Simple.*Advanced\|mode.*toggle" frontend/src/components/layout/Topbar.jsx 2>/dev/null; then
    echo "   ❌ Topbar 中仍有模式切换相关代码"
else
    echo "   ✅ Topbar 中已移除模式切换"
fi

# 检查 Sidebar 是否还有模式显示
echo ""
echo "4. 检查 Sidebar 组件..."
if grep -q "mode === 'simple'" frontend/src/components/layout/Sidebar.jsx 2>/dev/null; then
    echo "   ❌ Sidebar 中仍有模式判断"
else
    echo "   ✅ Sidebar 中已移除模式判断"
fi

# 检查详情页面是否统一
echo ""
echo "5. 检查详情页面..."
SIMPLE_MODE_REFS=$(grep -r "SimpleMode\|AdvancedMode" frontend/src/pages --include="*.jsx" 2>/dev/null | grep -v "EditorContent" | wc -l)

if [ "$SIMPLE_MODE_REFS" -eq 0 ]; then
    echo "   ✅ 详情页面已统一，不再区分 SimpleMode/AdvancedMode"
else
    echo "   ⚠️  发现 $SIMPLE_MODE_REFS 处 SimpleMode/AdvancedMode 引用"
fi

# 构建前端以验证没有错误
echo ""
echo "6. 构建前端验证..."
cd frontend
BUILD_OUTPUT=$(npm run build 2>&1)
if echo "$BUILD_OUTPUT" | grep -q "✓ built"; then
    echo "   ✅ 前端构建成功"
else
    echo "   ❌ 前端构建失败"
    echo "$BUILD_OUTPUT" | tail -10
fi
cd ..

# 总结
echo ""
echo "=========================================="
echo "验证完成！"
echo "=========================================="
echo ""
echo "如果所有检查都通过（✅），则 simple/advanced 模式已完全移除。"
echo ""
echo "现在可以启动前端查看效果："
echo "  cd frontend && npm run dev"
echo ""
