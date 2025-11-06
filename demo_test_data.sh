#!/bin/bash

# 测试数据演示脚本
# 展示如何查看和使用生成的测试数据

echo "🎬 MyPromptManager 测试数据演示"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

cmd() {
    echo -e "${YELLOW}$ $1${NC}"
}

# 1. 目录结构
section "📁 1. 目录结构"

info "查看整体目录结构"
cmd "tree repo_root -L 3 -I '.git'"
tree repo_root -L 3 -I '.git' 2>/dev/null || find repo_root -type d | head -20

# 2. 提示词文件
section "📄 2. 提示词文件"

info "列出所有提示词"
cmd "ls -lh repo_root/projects/default/prompts/"
ls -lh repo_root/projects/default/prompts/

echo ""
info "查看第一个提示词的 Front Matter"
FIRST_PROMPT=$(find repo_root/projects/default/prompts -name "prompt_*.md" | head -1)
cmd "head -20 $FIRST_PROMPT"
head -20 "$FIRST_PROMPT"

# 3. 模版文件
section "📑 3. 模版文件"

info "列出所有模版"
cmd "ls -lh repo_root/projects/default/templates/"
ls -lh repo_root/projects/default/templates/

# 4. 对话历史
section "💬 4. 对话历史"

info "列出所有对话"
cmd "ls -lh repo_root/projects/default/chats/"
ls -lh repo_root/projects/default/chats/

echo ""
info "查看第一个对话的内容"
FIRST_CHAT=$(find repo_root/projects/default/chats -name "chat_*.json" | head -1)
cmd "cat $FIRST_CHAT | python -m json.tool | head -30"
cat "$FIRST_CHAT" | python -m json.tool | head -30

# 5. 索引文件
section "📇 5. 索引文件"

info "查看索引统计"
cmd "cat repo_root/.promptmeta/index.json | python -m json.tool | head -5"
cat repo_root/.promptmeta/index.json | python -m json.tool | head -5

echo ""
info "提示词列表（仅显示标题）"
cmd "python -c \"import json; data=json.load(open('repo_root/.promptmeta/index.json')); [print(f\\\"  • {p['title']}\\\") for p in data['prompts']]\""
python -c "import json; data=json.load(open('repo_root/.promptmeta/index.json')); [print(f\"  • {p['title']}\") for p in data['prompts']]"

echo ""
info "模版列表（仅显示标题）"
cmd "python -c \"import json; data=json.load(open('repo_root/.promptmeta/index.json')); [print(f\\\"  • {t['title']}\\\") for t in data['templates']]\""
python -c "import json; data=json.load(open('repo_root/.promptmeta/index.json')); [print(f\"  • {t['title']}\") for t in data['templates']]"

# 6. Git 历史
section "🔀 6. Git 历史"

cd repo_root || exit 1

info "查看提交历史"
cmd "git log --oneline"
git log --oneline

echo ""
info "查看提交统计"
cmd "git log --oneline | wc -l"
echo "  总提交数：$(git log --oneline | wc -l)"

# 7. Git 标签
section "🏷️  7. Git 标签"

info "查看所有标签"
cmd "git tag"
git tag

echo ""
info "查看标签详情（第一个）"
FIRST_TAG=$(git tag | head -1)
cmd "git show $FIRST_TAG"
git show "$FIRST_TAG" | head -20

cd .. || exit 1

# 8. 统计信息
section "📊 8. 统计信息"

echo "测试数据统计："
echo ""
echo "  📄 提示词文件：     $(find repo_root/projects/default/prompts -name "prompt_*.md" | wc -l) 个"
echo "  📑 模版文件：       $(find repo_root/projects/default/templates -name "template_*.md" | wc -l) 个"
echo "  💬 对话历史文件：   $(find repo_root/projects/default/chats -name "chat_*.json" | wc -l) 个"
echo ""

cd repo_root || exit 1
echo "  🔀 Git 提交：       $(git log --oneline | wc -l) 个"
echo "  🏷️  Git 标签：       $(git tag | wc -l) 个"
cd .. || exit 1

echo ""
echo "  📇 索引条目："
python -c "
import json
data = json.load(open('repo_root/.promptmeta/index.json'))
print(f'     • 提示词：{len(data[\"prompts\"])} 个')
print(f'     • 模版：{len(data[\"templates\"])} 个')
"

# 9. API 测试示例
section "🌐 9. API 测试示例"

info "确保后端正在运行：python manage.py runserver"
echo ""
echo "然后可以测试以下 API 端点："
echo ""
echo "  # 健康检查"
echo "  curl http://127.0.0.1:8000/v1/health"
echo ""
echo "  # 搜索提示词"
echo "  curl http://127.0.0.1:8000/v1/search?project=default"
echo ""
echo "  # 获取索引状态"
echo "  curl http://127.0.0.1:8000/v1/index/status"
echo ""
echo "  # 获取特定提示词的内容（使用第一个提示词 ID）"
FIRST_ID=$(python -c "import json; data=json.load(open('repo_root/.promptmeta/index.json')); print(data['prompts'][0]['id'])")
echo "  curl http://127.0.0.1:8000/v1/simple/prompts/$FIRST_ID/content?ref=latest"
echo ""
echo "  # 获取时间线"
echo "  curl http://127.0.0.1:8000/v1/simple/prompts/$FIRST_ID/timeline?view=all"
echo ""
echo "  # 获取发布列表"
echo "  curl http://127.0.0.1:8000/v1/detail/prompts/$FIRST_ID/releases"

# 10. 下一步
section "🚀 10. 下一步"

echo "现在你可以："
echo ""
echo "  1️⃣  启动后端服务器："
echo "     python manage.py runserver"
echo ""
echo "  2️⃣  启动前端（新终端）："
echo "     ./start-frontend.sh"
echo ""
echo "  3️⃣  访问应用："
echo "     http://localhost:3000"
echo ""
echo "  4️⃣  测试功能："
echo "     • 查看 Dashboard 统计"
echo "     • 浏览 Prompts 列表"
echo "     • 查看提示词详情"
echo "     • 查看时间线"
echo "     • 查看发布版本"
echo "     • 测试搜索功能"
echo ""

section "📖 参考文档"

echo "  • TEST_DATA_README.md      - 测试数据详细说明"
echo "  • USAGE_EXAMPLES.md        - 使用示例"
echo "  • CLAUDE.md                - API 规范"
echo "  • LOCAL_SETUP.md           - 本地配置"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 演示完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
