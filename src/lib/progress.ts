// Browser-only helpers for storing course progress in localStorage.
const KEY = 'sd-progress';

export function getDone(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function setDone(id: string, done: boolean) {
  const set = new Set(getDone());
  if (done) set.add(id);
  else set.delete(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {}
  window.dispatchEvent(new Event('sd-progress'));
}

export function saveQuizScore(id: string, score: number, total: number) {
  try {
    const all = JSON.parse(localStorage.getItem('sd-quiz') || '{}');
    const prev = all[id];
    if (!prev || score >= prev.score) all[id] = { score, total };
    localStorage.setItem('sd-quiz', JSON.stringify(all));
  } catch {}
}

export function getQuizScore(id: string): { score: number; total: number } | null {
  try {
    return JSON.parse(localStorage.getItem('sd-quiz') || '{}')[id] ?? null;
  } catch {
    return null;
  }
}
