import chatgptProvider from '../providers/chatgpt.js';
import deepseekProvider from '../providers/deepseek.js';
import claudeProvider from '../providers/claude.js';
import geminiProvider from '../providers/gemini.js';
import doubaoProvider from '../providers/doubao.js';

const providers = [
  chatgptProvider,
  deepseekProvider,
  claudeProvider,
  geminiProvider,
  doubaoProvider,
];

export function detectProvider(url) {
  return providers.find((provider) => provider.matches(url));
}

export function getProvider(id) {
  return providers.find((provider) => provider.id === id);
}

export function listProviders() {
  return providers.slice();
}
