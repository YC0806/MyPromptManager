#!/bin/bash

# MyPromptManager Setup Checker
# 检查系统是否正确配置

echo "🔍 MyPromptManager 设置检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 计数器
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

echo "## 1. 检查必需软件"
echo ""

# 检查 Python
if command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1)
    check_pass "Python 已安装: $PYTHON_VERSION"
    ((PASS_COUNT++))
else
    check_fail "Python 未安装"
    ((FAIL_COUNT++))
fi

# 检查 Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js 已安装: $NODE_VERSION"
    ((PASS_COUNT++))
else
    check_fail "Node.js 未安装"
    ((FAIL_COUNT++))
fi

# 检查 npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_pass "npm 已安装: v$NPM_VERSION"
    ((PASS_COUNT++))
else
    check_fail "npm 未安装"
    ((FAIL_COUNT++))
fi

echo ""
echo "## 2. 检查项目文件"
echo ""

# 检查关键文件
if [ -f "manage.py" ]; then
    check_pass "manage.py 存在"
    ((PASS_COUNT++))
else
    check_fail "manage.py 不存在"
    ((FAIL_COUNT++))
fi

if [ -f "config/settings.py" ]; then
    check_pass "config/settings.py 存在"
    ((PASS_COUNT++))
else
    check_fail "config/settings.py 不存在"
    ((FAIL_COUNT++))
fi

if [ -d "frontend" ]; then
    check_pass "frontend 目录存在"
    ((PASS_COUNT++))
else
    check_fail "frontend 目录不存在"
    ((FAIL_COUNT++))
fi

if [ -f "frontend/package.json" ]; then
    check_pass "frontend/package.json 存在"
    ((PASS_COUNT++))
else
    check_fail "frontend/package.json 不存在"
    ((FAIL_COUNT++))
fi

echo ""
echo "## 3. 检查数据库"
echo ""

# 检查数据库
if [ -f "db.sqlite3" ]; then
    check_pass "数据库文件存在"
    ((PASS_COUNT++))
else
    check_warn "数据库文件不存在（首次运行需要执行 migrate）"
    ((WARN_COUNT++))
fi

# 检查迁移
if python manage.py showmigrations --list 2>&1 | grep -q "\[X\]"; then
    check_pass "数据库迁移已应用"
    ((PASS_COUNT++))
elif [ ! -f "db.sqlite3" ]; then
    check_warn "尚未运行迁移（请执行: python manage.py migrate）"
    ((WARN_COUNT++))
else
    check_fail "迁移状态异常"
    ((FAIL_COUNT++))
fi

echo ""
echo "## 4. 检查前端依赖"
echo ""

# 检查 node_modules
if [ -d "frontend/node_modules" ]; then
    check_pass "前端依赖已安装"
    ((PASS_COUNT++))
else
    check_warn "前端依赖未安装（请执行: cd frontend && npm install）"
    ((WARN_COUNT++))
fi

echo ""
echo "## 5. 检查配置"
echo ""

# 检查设置文件中的关键配置
if grep -q "AllowAny" config/settings.py; then
    check_pass "已配置为无认证模式"
    ((PASS_COUNT++))
else
    check_fail "未正确配置无认证模式"
    ((FAIL_COUNT++))
fi

# 检查前端 API 配置
if [ -f "frontend/src/lib/api.js" ]; then
    if ! grep -q "Authorization.*Bearer" frontend/src/lib/api.js; then
        check_pass "前端已移除身份验证"
        ((PASS_COUNT++))
    else
        check_warn "前端仍包含身份验证代码"
        ((WARN_COUNT++))
    fi
fi

echo ""
echo "## 6. 检查文档"
echo ""

DOCS=("LOCAL_SETUP.md" "NO_AUTH_CHANGES.md" "DATABASE_MIGRATION_FIX.md" "FINAL_SETUP_SUMMARY.md")
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "$doc 存在"
        ((PASS_COUNT++))
    else
        check_warn "$doc 不存在"
        ((WARN_COUNT++))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 检查结果"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ 通过: $PASS_COUNT${NC}"
echo -e "${YELLOW}⚠️  警告: $WARN_COUNT${NC}"
echo -e "${RED}❌ 失败: $FAIL_COUNT${NC}"
echo ""

# 根据结果给出建议
if [ $FAIL_COUNT -eq 0 ] && [ $WARN_COUNT -eq 0 ]; then
    echo "🎉 恭喜！所有检查都通过了！"
    echo ""
    echo "你可以开始使用了："
    echo "  1. python manage.py runserver"
    echo "  2. ./start-frontend.sh"
    echo "  3. 访问 http://localhost:3000"
elif [ $FAIL_COUNT -eq 0 ]; then
    echo "✅ 基本检查通过！"
    echo ""
    echo "有一些警告需要注意："
    if [ ! -f "db.sqlite3" ]; then
        echo "  • 请先运行: python manage.py migrate"
    fi
    if [ ! -d "frontend/node_modules" ]; then
        echo "  • 请先运行: cd frontend && npm install"
    fi
else
    echo "❌ 发现一些问题需要修复"
    echo ""
    echo "请检查上述失败项并修复后重新运行此脚本"
fi

echo ""
echo "📖 详细说明请查看: FINAL_SETUP_SUMMARY.md"
echo ""
