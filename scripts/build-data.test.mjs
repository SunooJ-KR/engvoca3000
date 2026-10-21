import { expect, test } from 'vitest';
import { validate } from './build-data.mjs';

const ok = {
  id: 'run',
  word: 'run',
  pos: ['verb', 'noun'],
  cefr: 'A1',
  meanings: ['달리다'],
  examples: [
    { en: 'I run every day.', ko: '나는 매일 달린다.' },
    { en: 'She is running late.', ko: '그녀는 늦고 있다.' },
    { en: 'He ran home.', ko: '그는 집으로 뛰어갔다.' },
  ],
};

test('valid entry passes; irregular form only warns', () => {
  const { errors, warnings } = validate([ok], 'A1');
  expect(errors).toEqual([]);
  expect(warnings).toHaveLength(1); // "ran"
});

test('catches schema errors', () => {
  const bad = [
    { ...ok, examples: ok.examples.slice(0, 2) },
    { ...ok, id: 'Run' },
    { ...ok, cefr: 'B1' },
    { ...ok, meanings: [] },
  ];
  const { errors } = validate(bad, 'A1');
  expect(errors.some((e) => e.includes('examples'))).toBe(true);
  expect(errors.some((e) => e.includes('소문자'))).toBe(true);
  expect(errors.some((e) => e.includes('중복'))).toBe(true);
  expect(errors.some((e) => e.includes('cefr'))).toBe(true);
  expect(errors.some((e) => e.includes('meanings'))).toBe(true);
});

