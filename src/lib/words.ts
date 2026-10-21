import data from '../data/words.json';
import type { Word } from '../types';
import { UNIT_SIZE, shuffled } from './study';

const base = data as Word[];
const byId = new Map(base.map((w) => [w.id, w]));

// Unit 배치 순서. 브라우저별 seed로 섞이며 앱 시작 시 applyOrder로 정해진다 (ES 모듈 live binding).
export let words: Word[] = base;
let unitById = new Map<string, number>();
let currentSeed: number | null = null;

export function applyOrder(seed: number) {
  if (seed === currentSeed) return;
  currentSeed = seed;
  words = shuffled(base, seed);
  unitById = new Map(words.map((w, i) => [w.id, Math.floor(i / UNIT_SIZE) + 1]));
}

export const unitOf = (id: string) => unitById.get(id);

// ponytail: 데이터 갱신으로 사라진 단어도 판정은 할 수 있게 자리만 채운다
export const getWord = (id: string): Word =>
  byId.get(id) ?? { id, word: id, pos: ['?'], cefr: 'A1', meanings: ['(데이터에서 삭제된 단어)'], examples: [] };
