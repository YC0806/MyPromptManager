export function sendToTab(tabId, payload, timeoutMs = 8000) {
  return withTimeout(new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, payload, (response) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve(response);
    });
  }), timeoutMs);
}

export function sendRuntimeMessage(payload, timeoutMs = 8000) {
  return withTimeout(new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve(response);
    });
  }), timeoutMs);
}

function withTimeout(promise, timeoutMs) {
  if (!timeoutMs) return promise;
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeoutMs)),
  ]);
}
