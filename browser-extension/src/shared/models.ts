export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: string | null;
  index: number;
}

export interface Conversation {
  id: string;
  provider: string;
  conversationId: string;
  title: string;
  messages: Message[];
  url: string;
  extractedAt: string;
}

export interface RoleDetectionConfig {
  attribute?: string;
  values?: Record<string, Role>;
  classHints?: Record<string, Role>;
  fallback?: (element: Element) => Role | null;
}

export interface TimestampConfig {
  selector?: string;
  attribute?: string;
  parser?: (value: string) => string | null;
}

export interface DomProviderConfig {
  id: string;
  matches: (url: string) => boolean;
  getConversationId: () => string | null;
  getTitle: () => string;
  messageSelectors?: string[];
  findMessageElements?: () => Element[];
  messageFilter?: (element: Element) => boolean;
  contentSelectors?: string[];
  extractContent?: (element: Element) => string;
  role?: RoleDetectionConfig;
  timestamp?: TimestampConfig;
  fillSelectors: string[];
}
