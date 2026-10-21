import data from '../data/words.json';
import type { Word } from '../types';

export const words = data as Word[];

const byId = new Map(words.map((w) => [w.id, w]));

// ponytail: 데이터 갱신으로 사라진 단어도 판정은 할 수 있게 자리만 채운다
export const getWord = (id: string): Word =>
  byId.get(id) ?? { id, word: id, pos: ['?'], cefr: 'A1', meanings: ['(데이터에서 삭제된 단어)'], examples: [] };
