export interface HighScore {
  name: string;
  score: number;
  level: number; // 1-based level reached
  date: number;
}

const KEY = "devquest_hs_v1";
const MAX = 8;

export function loadScores(): HighScore[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as HighScore[];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((s) => s && typeof s.score === "number")
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function qualifies(score: number): boolean {
  if (score <= 0) return false;
  const arr = loadScores();
  if (arr.length < MAX) return true;
  return score > arr[arr.length - 1].score;
}

export function saveScore(entry: HighScore): HighScore[] {
  const arr = loadScores();
  arr.push(entry);
  arr.sort((a, b) => b.score - a.score);
  const trimmed = arr.slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* storage unavailable — scores stay in-memory only */
  }
  return trimmed;
}
