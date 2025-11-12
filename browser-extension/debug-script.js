/**
 * 浏览器插件调试脚本
 *
 * 使用方法：
 * 1. 打开插件弹出窗口
 * 2. 右键 → 检查
 * 3. 在 Console 标签页中复制粘贴整个脚本
 * 4. 按 Enter 运行
 * 5. 查看输出结果
 */

console.log('========================================');
console.log('MyPromptManager 插件调试脚本');
console.log('========================================\n');

// 1. 检查基本元素
console.log('1. 基本元素检查：');
const elements = {
  'Header': document.querySelector('.header'),
  'Content': document.querySelector('.content'),
  'Tab Nav': document.querySelector('.tab-nav'),
  'Sync Tab': document.getElementById('syncTab'),
  'Library Tab': document.getElementById('libraryTab'),
  'Modal': document.getElementById('itemDetailModal'),
  'Settings Section': document.getElementById('settingsSection'),
};

Object.entries(elements).forEach(([name, el]) => {
  console.log(`  ${name}: ${el ? '✅ 存在' : '❌ 不存在'}`);
});

// 2. 检查模态框状态
console.log('\n2. 模态框状态：');
const modal = document.getElementById('itemDetailModal');
if (modal) {
  const modalStyle = window.getComputedStyle(modal);
  console.log(`  Classes: ${modal.className}`);
  console.log(`  Display: ${modalStyle.display}`);
  console.log(`  Visibility: ${modalStyle.visibility}`);
  console.log(`  Opacity: ${modalStyle.opacity}`);
  console.log(`  Z-Index: ${modalStyle.zIndex}`);
  console.log(`  Position: ${modalStyle.position}`);

  if (modalStyle.display !== 'none') {
    console.log('  ⚠️ 警告：模态框正在显示！');
  } else {
    console.log('  ✅ 模态框已隐藏');
  }
}

// 3. 检查标签页状态
console.log('\n3. 标签页状态：');
const syncTab = document.getElementById('syncTab');
const libraryTab = document.getElementById('libraryTab');

if (syncTab) {
  const syncStyle = window.getComputedStyle(syncTab);
  console.log(`  Sync Tab:`);
  console.log(`    Classes: ${syncTab.className}`);
  console.log(`    Display: ${syncStyle.display}`);
  console.log(`    Visible: ${syncStyle.display !== 'none' ? '✅ 是' : '❌ 否'}`);
}

if (libraryTab) {
  const libStyle = window.getComputedStyle(libraryTab);
  console.log(`  Library Tab:`);
  console.log(`    Classes: ${libraryTab.className}`);
  console.log(`    Display: ${libStyle.display}`);
  console.log(`    Visible: ${libStyle.display !== 'none' ? '✅ 是' : '❌ 否'}`);
}

// 4. 检查设置区域
console.log('\n4. 设置区域状态：');
const settingsSection = document.getElementById('settingsSection');
if (settingsSection) {
  const settingsStyle = window.getComputedStyle(settingsSection);
  console.log(`  Classes: ${settingsSection.className}`);
  console.log(`  Display: ${settingsStyle.display}`);
  console.log(`  Visible: ${settingsStyle.display !== 'none' ? '⚠️ 正在显示' : '✅ 已隐藏'}`);
}

// 5. 检查中心位置的元素
console.log('\n5. 中心位置元素检查：');
const centerX = 180;
const centerY = 300;
const elementsAtCenter = document.elementsFromPoint(centerX, centerY);
console.log(`  位置 (${centerX}, ${centerY}) 的元素层级：`);
elementsAtCenter.slice(0, 5).forEach((el, index) => {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
  console.log(`    ${index + 1}. ${tag}${id}${classes}`);
});

// 6. 检查所有 hidden 元素
console.log('\n6. 隐藏元素检查：');
const hiddenElements = document.querySelectorAll('.hidden');
console.log(`  找到 ${hiddenElements.length} 个带 .hidden 类的元素：`);
hiddenElements.forEach(el => {
  const style = window.getComputedStyle(el);
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  console.log(`    ${tag}${id}: display=${style.display}`);
  if (style.display !== 'none') {
    console.log(`      ⚠️ 警告：应该隐藏但正在显示！`);
  }
});

// 7. 检查高 z-index 元素
console.log('\n7. 高 Z-Index 元素检查：');
const highZElements = Array.from(document.querySelectorAll('*'))
  .filter(el => {
    const zIndex = window.getComputedStyle(el).zIndex;
    return zIndex !== 'auto' && parseInt(zIndex) > 0;
  })
  .map(el => ({
    element: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ').join('.') : ''}`,
    zIndex: window.getComputedStyle(el).zIndex,
    display: window.getComputedStyle(el).display
  }))
  .sort((a, b) => parseInt(b.zIndex) - parseInt(a.zIndex));

console.log(`  找到 ${highZElements.length} 个高 z-index 元素：`);
highZElements.forEach(item => {
  console.log(`    ${item.element}: z-index=${item.zIndex}, display=${item.display}`);
  if (item.display !== 'none') {
    console.log(`      ⚠️ 正在显示`);
  }
});

// 8. 检查半透明背景
console.log('\n8. 半透明背景检查：');
const transparentBgs = Array.from(document.querySelectorAll('*'))
  .filter(el => {
    const bg = window.getComputedStyle(el).background;
    return bg.includes('rgba') && bg.includes('0.5');
  });

console.log(`  找到 ${transparentBgs.length} 个半透明背景元素：`);
transparentBgs.forEach(el => {
  const style = window.getComputedStyle(el);
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  console.log(`    ${tag}${id}: display=${style.display}`);
});

// 9. 修复建议
console.log('\n9. 自动修复尝试：');
console.log('  执行以下命令进行修复...');

// 强制隐藏模态框
if (modal && window.getComputedStyle(modal).display !== 'none') {
  modal.style.display = 'none';
  console.log('  ✅ 强制隐藏模态框');
}

// 强制隐藏设置区域
if (settingsSection && window.getComputedStyle(settingsSection).display !== 'none') {
  settingsSection.style.display = 'none';
  console.log('  ✅ 强制隐藏设置区域');
}

// 确保 syncTab 显示
if (syncTab && window.getComputedStyle(syncTab).display === 'none') {
  syncTab.style.display = 'block';
  console.log('  ✅ 强制显示 Sync Tab');
}

// 10. 最终状态报告
console.log('\n10. 最终状态报告：');
setTimeout(() => {
  const finalModal = modal ? window.getComputedStyle(modal).display : 'N/A';
  const finalSync = syncTab ? window.getComputedStyle(syncTab).display : 'N/A';
  const finalLib = libraryTab ? window.getComputedStyle(libraryTab).display : 'N/A';

  console.log(`  模态框: ${finalModal}`);
  console.log(`  Sync Tab: ${finalSync}`);
  console.log(`  Library Tab: ${finalLib}`);

  if (finalModal === 'none' && finalSync === 'block' && finalLib === 'none') {
    console.log('\n✅ 状态正常！如果仍然有问题，可能是其他元素遮挡。');
  } else {
    console.log('\n⚠️ 状态异常！请检查上述详细信息。');
  }
}, 100);

console.log('\n========================================');
console.log('调试完成！请截图发送结果');
console.log('========================================');
