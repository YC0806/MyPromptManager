export function findFirst(selectors = [], predicate = () => true) {
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      if (predicate(el)) return el;
    }
  }
  return null;
}

export function fillInput(content, selectors = []) {
  const input = findFirst(selectors, (el) => {
    const rect = el.getBoundingClientRect?.();
    return (!rect || (rect.width > 0 && rect.height > 0)) && !el.disabled;
  });

  if (!input) {
    throw new Error('无法找到输入框');
  }

  const isContentEditable = input.contentEditable === 'true';

  // 先聚焦，确保输入框处于活跃状态
  input.focus?.();

  if (isContentEditable) {
    // 对于 contenteditable 元素，使用更可靠的方法
    // 1. 清空现有内容
    input.textContent = '';

    // 2. 使用 document.execCommand (虽然已废弃，但对某些网站仍然必要)
    if (document.execCommand) {
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      document.execCommand('insertText', false, content);
    } else {
      // 3. 备用方法：直接设置内容
      input.textContent = content;
    }

    // 4. 将光标移到末尾
    const range = document.createRange();
    const sel = window.getSelection();
    if (input.childNodes.length > 0) {
      const lastChild = input.childNodes[input.childNodes.length - 1];
      range.setStartAfter(lastChild);
      range.collapse(true);
    } else {
      range.selectNodeContents(input);
      range.collapse(false);
    }
    sel?.removeAllRanges();
    sel?.addRange(range);
  } else {
    // 对于 textarea 或 input 元素
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement?.prototype || window.HTMLInputElement?.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      // 使用原生 setter，绕过 React/Vue 的拦截
      nativeInputValueSetter.call(input, content);
    } else {
      input.value = content;
    }

    // 设置光标到末尾
    input.selectionStart = content.length;
    input.selectionEnd = content.length;
  }

  // 触发各种事件以通知框架
  dispatchInputEvents(input);

  // 调整 textarea 高度
  if (!isContentEditable && input.tagName === 'TEXTAREA' && input.style) {
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  }

  return true;
}

export function dispatchInputEvents(element) {
  // 为了兼容 React、Vue 等现代框架，需要触发多种事件
  const events = [
    // React 特别需要这些事件
    new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: element.value || element.textContent
    }),
    new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: element.value || element.textContent
    }),
    new Event('change', { bubbles: true, cancelable: true }),
    // 触发一个普通的键盘事件来激活验证逻辑，但不使用 Enter 键以避免自动提交
    // 使用空格键，这样不会触发发送操作
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: ' ',
      code: 'Space',
      keyCode: 32
    }),
    new KeyboardEvent('keyup', {
      bubbles: true,
      cancelable: true,
      key: ' ',
      code: 'Space',
      keyCode: 32
    }),
  ];

  events.forEach((event) => {
    try {
      element.dispatchEvent(event);
    } catch (e) {
      console.warn('[fillInput] 事件触发失败:', e);
    }
  });

  // 额外触发 React 的内部事件
  // React 16+ 会在元素上存储 fiber 节点
  const reactPropsKey = Object.keys(element).find(key =>
    key.startsWith('__reactProps') || key.startsWith('__reactEventHandlers')
  );

  if (reactPropsKey) {
    // 如果检测到 React，强制触发 React 的 onChange
    const reactProps = element[reactPropsKey];
    if (reactProps && typeof reactProps.onChange === 'function') {
      try {
        reactProps.onChange({
          target: element,
          currentTarget: element,
          type: 'change'
        });
      } catch (e) {
        console.warn('[fillInput] React onChange 触发失败:', e);
      }
    }
  }
}
