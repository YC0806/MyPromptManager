/**
 * Prompt库调试脚本
 *
 * 在浏览器控制台运行此脚本，查看Prompt库为什么是空的
 */

console.log('===== Prompt库调试脚本 =====\n');

// 1. 检查DOM元素
console.log('1. 检查DOM元素:');
const itemsList = document.getElementById('itemsList');
const libraryTab = document.getElementById('libraryTab');
const searchInput = document.getElementById('searchInput');

console.log('  itemsList:', itemsList ? '✅ 存在' : '❌ 不存在');
console.log('  libraryTab:', libraryTab ? '✅ 存在' : '❌ 不存在');
console.log('  searchInput:', searchInput ? '✅ 存在' : '❌ 不存在');

if (itemsList) {
  console.log('  itemsList 内容:', itemsList.innerHTML.substring(0, 100));
}

// 2. 检查配置
console.log('\n2. 检查API配置:');
chrome.runtime.sendMessage({ action: 'getConfig' }, (response) => {
  if (response && response.success) {
    console.log('  ✅ 配置加载成功');
    console.log('  API URL:', response.config.apiUrl);

    const apiUrl = response.config.apiUrl;

    // 3. 测试API连接
    console.log('\n3. 测试API连接:');

    // 测试健康检查
    console.log('  测试健康检查端点...');
    fetch(`${apiUrl}/health`)
      .then(res => {
        console.log('    状态码:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('    ✅ 健康检查成功:', data);

        // 4. 测试prompts API
        console.log('\n4. 测试Prompts API:');
        return fetch(`${apiUrl}/prompts?limit=5`);
      })
      .then(res => {
        console.log('    状态码:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('    ✅ Prompts API 成功');
        console.log('    Prompts 数量:', data.prompts.length);
        console.log('    总数:', data.total);
        if (data.prompts.length > 0) {
          console.log('    第一个 Prompt:', {
            id: data.prompts[0].id,
            title: data.prompts[0].title,
            type: data.prompts[0].type
          });
        }

        // 5. 测试templates API
        console.log('\n5. 测试Templates API:');
        return fetch(`${apiUrl}/templates?limit=5`);
      })
      .then(res => {
        console.log('    状态码:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('    ✅ Templates API 成功');
        console.log('    Templates 数量:', data.templates.length);
        console.log('    总数:', data.total);
        if (data.templates.length > 0) {
          console.log('    第一个 Template:', {
            id: data.templates[0].id,
            title: data.templates[0].title,
            type: data.templates[0].type
          });
        }

        // 6. 手动触发加载
        console.log('\n6. 手动触发加载:');
        console.log('  尝试手动调用 loadLibraryItems()...');

        // 检查是否可以找到函数
        if (typeof window.loadLibraryItems === 'function') {
          console.log('  ✅ 找到 loadLibraryItems 函数');
          window.loadLibraryItems();
        } else {
          console.log('  ❌ 未找到 loadLibraryItems 函数');
          console.log('  这可能是因为函数在闭包中，需要通过点击标签触发');
        }

        console.log('\n===== 诊断完成 =====');
        console.log('\n建议操作:');
        console.log('1. 如果所有API测试都成功，尝试手动点击"Prompt库"标签');
        console.log('2. 查看Network标签页，确认API请求是否发送');
        console.log('3. 检查Console是否有其他错误信息');
      })
      .catch(error => {
        console.error('    ❌ API测试失败:', error);
        console.log('\n可能的原因:');
        console.log('1. 后端未运行');
        console.log('2. API URL配置错误');
        console.log('3. CORS问题');
        console.log('4. 网络问题');
      });
  } else {
    console.error('  ❌ 配置加载失败');
    console.log('  错误:', response ? response.error : '无响应');
  }
});

// 7. 检查事件监听器
console.log('\n7. 检查标签按钮:');
const libraryButton = document.querySelector('[data-tab="library"]');
if (libraryButton) {
  console.log('  ✅ 找到 Prompt库 按钮');
  console.log('  类名:', libraryButton.className);
  console.log('  是否激活:', libraryButton.classList.contains('active'));

  // 模拟点击
  console.log('\n  模拟点击 Prompt库 按钮...');
  setTimeout(() => {
    libraryButton.click();
    console.log('  已触发点击事件');

    // 检查结果
    setTimeout(() => {
      console.log('\n8. 点击后检查:');
      console.log('  itemsList 内容:', itemsList ? itemsList.innerHTML.substring(0, 200) : 'N/A');
    }, 1000);
  }, 500);
} else {
  console.log('  ❌ 未找到 Prompt库 按钮');
}
