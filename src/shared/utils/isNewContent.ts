/**
 * Determine if content was added recently (within `days` days).
 * Expects a unix timestamp string (seconds since epoch).
 */
export function isNewContent(added: string | undefined, days = 7): boolean {
  if (!added) return false;
  const ts = parseInt(added, 10);
  if (isNaN(ts) || ts <= 0) return false;
  const addedMs = ts * 1000;
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return addedMs > threshold;
}
