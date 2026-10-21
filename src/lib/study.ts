// Unit 구성·Keep 순환·판정 규칙. 모두 Progress를 받아 새 Progress를 반환하는 순수 함수다.
import type { Word } from '../types';

export const UNIT_SIZE = 10;

export type Verdict = 'keep' | 'known';

export interface UnitRecord {
  cards: string[]; // 시작 시 확정한 카드 순서: 새 단어 → Keep 단어
  newCount: number; // cards 앞쪽 몇 개가 이 Unit의 새 단어인지
  pos: number; // 현재 카드 위치
  done: boolean;
}

export interface Progress {
  version: 1;
  seed: number; // 이 브라우저 전용 단어 순서. 처음 만들 때 정해지고 바뀌지 않는다
  words: Record<string, Verdict>; // 없으면 미학습
  units: Record<number, UnitRecord>; // 시작한 Unit만 존재
  settings: { showTranslation: boolean };
}

export const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

export const emptyProgress = (seed = randomSeed()): Progress => ({
  version: 1,
  seed,
  words: {},
  units: {},
  settings: { showTranslation: false },
});

// seed가 같으면 항상 같은 순서. 등급 구분 없이 전체를 섞는다 (mulberry32 + Fisher–Yates).
export function shuffled<T>(items: T[], seed: number): T[] {
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const unitCount = (words: Word[]) => Math.ceil(words.length / UNIT_SIZE);

export const unitWords = (words: Word[], n: number) =>
  words.slice((n - 1) * UNIT_SIZE, n * UNIT_SIZE);

export const keepIds = (p: Progress) => Object.keys(p.words).filter((id) => p.words[id] === 'keep');

// Keep 목록은 여기서만 읽는다. 진행 중인 Unit의 cards는 이미 확정돼 있으므로
// 이번 Unit에서 새로 Keep된 단어는 자연스럽게 다음 Unit부터 등장한다.
export function startUnit(p: Progress, words: Word[], n: number): Progress {
  if (p.units[n] || n < 1 || n > unitCount(words)) return p;
  const fresh = unitWords(words, n).map((w) => w.id);
  const exists = new Set(words.map((w) => w.id));
  const keeps = keepIds(p).filter((id) => exists.has(id) && !fresh.includes(id));
  const record: UnitRecord = { cards: [...fresh, ...keeps], newCount: fresh.length, pos: 0, done: false };
  return { ...p, units: { ...p.units, [n]: record } };
}

export const judge = (p: Progress, id: string, verdict: Verdict): Progress => ({
  ...p,
  words: { ...p.words, [id]: verdict },
});

function updateUnit(p: Progress, n: number, patch: Partial<UnitRecord>): Progress {
  const unit = p.units[n];
  return unit ? { ...p, units: { ...p.units, [n]: { ...unit, ...patch } } } : p;
}

export const move = (p: Progress, n: number, pos: number) => updateUnit(p, n, { pos });

export const finishUnit = (p: Progress, n: number) => updateUnit(p, n, { done: true });

export const reviewCards = (p: Progress, n: number) => {
  const unit = p.units[n];
  return unit ? unit.cards.slice(0, unit.newCount) : [];
};

// 진행 중인 Unit이 있으면 그것, 없으면 시작하지 않은 첫 Unit. 전부 끝났으면 null.
export function nextUnit(p: Progress, words: Word[]): number | null {
  const total = unitCount(words);
  for (let n = 1; n <= total; n++) if (p.units[n] && !p.units[n].done) return n;
  for (let n = 1; n <= total; n++) if (!p.units[n]) return n;
  return null;
}

export function stats(p: Progress, words: Word[]) {
  const states = words.map((w) => p.words[w.id]);
  return {
    totalUnits: unitCount(words),
    doneUnits: Object.values(p.units).filter((u) => u.done).length,
    totalWords: words.length,
    known: states.filter((s) => s === 'known').length,
    keep: states.filter((s) => s === 'keep').length,
  };
}
