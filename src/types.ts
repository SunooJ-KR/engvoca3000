export type Cefr = 'A1' | 'A2' | 'B1' | 'B2';

// 형식 검증은 scripts/build-data.mjs가 담당한다. 이 타입을 바꾸면 그 스크립트도 같이 바꾼다.
export interface Word {
  id: string; // 소문자 영어 원형. 품사가 여러 개여도 단어당 1개
  word: string;
  pos: string[];
  cefr: Cefr;
  meanings: string[]; // 1~3개, 첫 번째가 대표 뜻
  examples: { en: string; ko: string }[]; // 정확히 3개
}
