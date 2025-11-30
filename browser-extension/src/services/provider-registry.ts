import { Conversation } from '../shared/models';
import chatgptProvider from '../providers/chatgpt';
import deepseekProvider from '../providers/deepseek';
import claudeProvider from '../providers/claude';
import geminiProvider from '../providers/gemini';
import doubaoProvider from '../providers/doubao';

export interface Provider {
  id: string;
  matches: (url: string) => boolean;
  extract: () => Promise<Conversation> | Conversation;
  fill: (content: string) => Promise<boolean> | boolean;
}

const providers: Provider[] = [
  chatgptProvider,
  deepseekProvider,
  claudeProvider,
  geminiProvider,
  doubaoProvider,
];

export function detectProvider(url: string): Provider | undefined {
  return providers.find((provider) => provider.matches(url));
}

export function getProvider(id: string): Provider | undefined {
  return providers.find((provider) => provider.id === id);
}

export function listProviders(): Provider[] {
  return providers.slice();
}
