import { deduplicateMessages } from './dedupe.js';

export const DEFAULT_CONFIG = {
  apiUrl: 'http://localhost:8000/v1',
  autoSync: false,
};

export function buildHistoryKey(provider, conversationId) {
  return `history_${provider}_${conversationId}`;
}

export function normalizeConversation(conversation, existingMessages = []) {
  const mergedMessages = deduplicateMessages([
    ...(existingMessages || []),
    ...(conversation.messages || []),
  ]);

  return {
    id: conversation.id || buildHistoryKey(conversation.provider, conversation.conversationId),
    provider: conversation.provider,
    conversationId: conversation.conversationId,
    title: conversation.title || 'Untitled Conversation',
    description: conversation.description || '',
    model: conversation.model || conversation.provider,
    messages: mergedMessages,
    labels: conversation.labels || [],
    created_at: conversation.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: conversation.metadata || {},
    url: conversation.url,
    extractedAt: conversation.extractedAt || new Date().toISOString(),
  };
}

export function toBackendPayload(conversation) {
  return {
    provider: conversation.provider,
    conversation_id: conversation.conversationId,
    title: conversation.title || 'Untitled Conversation',
    description: conversation.description || '',
    model: conversation.model || conversation.provider,
    messages: conversation.messages || [],
    labels: conversation.labels || [],
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
  };
}
