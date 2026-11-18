export const SAVED_KEY = 'tyrelink:saved';
export const RECENT_KEY = 'tyrelink:recent';
export const COMPARE_KEY = 'tyrelink:compare';
export function readIds(key: string): string[] {
  try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string'))].slice(0, 40) : []; } catch { return []; }
}
export function writeIds(key: string, ids: string[]): boolean {
  try { localStorage.setItem(key, JSON.stringify([...new Set(ids)].slice(0, 40))); window.dispatchEvent(new Event('tyrelink:shopping')); return true; } catch { return false; }
}
export function recordViewed(id: string) { writeIds(RECENT_KEY, [id, ...readIds(RECENT_KEY).filter(value => value !== id)].slice(0, 12)); }
export function toggleSaved(id: string) { const ids = readIds(SAVED_KEY); return writeIds(SAVED_KEY, ids.includes(id) ? ids.filter(value => value !== id) : [id, ...ids]); }
