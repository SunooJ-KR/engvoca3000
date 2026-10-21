import { expect, test } from 'vitest';
import type { Word } from '../types';
import { emptyProgress, finishUnit, judge, nextUnit, reviewCards, startUnit, stats, type Progress } from './study';

const words: Word[] = Array.from({ length: 35 }, (_, i) => ({
  id: `w${i + 1}`,
  word: `w${i + 1}`,
  pos: ['noun'],
  cefr: 'A1',
  meanings: ['뜻'],
  examples: [],
}));

const ids = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `w${from + i}`);

function study(p: Progress, n: number, keep: string[]): Progress {
  for (const id of p.units[n].cards) p = judge(p, id, keep.includes(id) ? 'keep' : 'known');
  return finishUnit(p, n);
}

test('keep words follow later units until known', () => {
  let p = emptyProgress();

  // 1. Unit 1: 새 단어 10장
  p = startUnit(p, words, 1);
  expect(p.units[1].cards).toEqual(ids(1, 10));

  // 2. 3개 Keep, 7개 알아요
  p = study(p, 1, ['w2', 'w5', 'w9']);
  expect(p.units[1].done).toBe(true);

  // 3. Unit 2: 새 10 + Keep 3
  p = startUnit(p, words, 2);
  expect(p.units[2].cards).toEqual([...ids(11, 20), 'w2', 'w5', 'w9']);
  expect(p.units[2].newCount).toBe(10);

  // 4. Keep 중 w2 알아요, w5 Keep 유지, w9 알아요 / 새 단어 w15 Keep
  //    진행 중인 Unit의 카드는 바뀌지 않는다
  p = study(p, 2, ['w5', 'w15']);
  expect(p.units[2].cards).toHaveLength(13);

  // 5. Unit 3: 새 10 + 남은 Keep 2
  p = startUnit(p, words, 3);
  expect(p.units[3].cards).toEqual([...ids(21, 30), 'w5', 'w15']);

  // 다시 시작해도 기록은 그대로
  expect(startUnit(p, words, 3)).toBe(p);

  // 6. Unit 1 복습 대상은 원래 새 단어 10개
  expect(reviewCards(p, 1)).toEqual(ids(1, 10));

  // 7. Unit 3 진행 중 → 이어서 학습은 Unit 3, 끝내면 Unit 4
  expect(nextUnit(p, words)).toBe(3);
  p = study(p, 3, []);
  expect(nextUnit(p, words)).toBe(4);

  // 마지막 Unit은 5장 (35단어)
  p = startUnit(p, words, 4);
  expect(p.units[4].newCount).toBe(5);

  expect(stats(p, words)).toMatchObject({ totalUnits: 4, doneUnits: 3, known: 30, keep: 0 });
});

test('out-of-range unit is ignored', () => {
  const p = emptyProgress();
  expect(startUnit(p, words, 0)).toBe(p);
  expect(startUnit(p, words, 5)).toBe(p);
});
