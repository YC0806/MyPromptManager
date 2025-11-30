import { buildHistoryKey, normalizeConversation, toBackendPayload } from '../core/models.js';
import { getConfig } from './config.js';
import { getLocal, listHistories, saveLocal } from '../platform/storage.js';
import { postJson } from '../platform/http.js';

export async function saveAndSyncConversation(conversation) {
  const config = await getConfig();
  const historyKey = buildHistoryKey(conversation.provider, conversation.conversationId);
  const existing = await getLocal(historyKey);

  const normalized = normalizeConversation(conversation, existing?.messages);

  await saveLocal(historyKey, normalized);
  await postJson(`${config.apiUrl}/chats`, toBackendPayload(normalized));

  return {
    saved: true,
    synced: true,
    messageCount: normalized.messages.length,
  };
}

export async function syncAllHistories() {
  const config = await getConfig();
  const histories = await listHistories();

  for (const history of histories) {
    try {
      await postJson(`${config.apiUrl}/chats`, toBackendPayload(history));
    } catch (error) {
      console.error('[SyncService] Failed to sync conversation', history?.conversationId, error);
    }
  }
}
