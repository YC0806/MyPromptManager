// Utilities for message deduplication

export function generateMessageHash(message) {
  const str = `${message.role}|${message.content}|${message.index}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash &= hash;
  }
  return hash.toString(36);
}

export function deduplicateMessages(messages = []) {
  const seen = new Set();
  return messages.filter((msg) => {
    const hash = generateMessageHash(msg);
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });
}
