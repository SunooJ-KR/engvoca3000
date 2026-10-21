// data/levels/{a1,a2,b1,b2}.json 검증 후 src/data/words.json으로 병합한다. 등급 순서는 유지하고 등급 안은 섞는다.
// 사용: node scripts/build-data.mjs [--check]   (--check: 검사만, 파일 쓰지 않음)
// 형식 기준은 src/types.ts의 Word 타입이다.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const root = new URL('../', import.meta.url);

export function validate(words, level) {
  const errors = [];
  const warnings = [];
  const ids = new Set();

  words.forEach((w, i) => {
    const at = `${level} #${i + 1} ${JSON.stringify(w?.id ?? '?')}`;
    const err = (msg) => errors.push(`${at}: ${msg}`);
    const nonEmpty = (s) => typeof s === 'string' && s.trim() !== '';

    if (!w || typeof w !== 'object') return err('항목이 객체가 아님');
    if (!nonEmpty(w.word)) err('word 비어 있음');
    if (w.id !== w.word?.toLowerCase()) err('id는 word의 소문자여야 함');
    if (ids.has(w.id)) err('id 중복');
    ids.add(w.id);
    if (w.cefr !== level) err(`cefr가 ${level}가 아님`);
    if (!Array.isArray(w.pos) || w.pos.length === 0 || !w.pos.every(nonEmpty)) err('pos는 비어 있지 않은 문자열 배열');
    if (!Array.isArray(w.meanings) || w.meanings.length < 1 || w.meanings.length > 3 || !w.meanings.every(nonEmpty)) {
      err('meanings는 1~3개의 비어 있지 않은 문자열');
    }
    if (!Array.isArray(w.examples) || w.examples.length !== 3) return err('examples는 정확히 3개');

    w.examples.forEach((ex, j) => {
      if (!nonEmpty(ex?.en) || !nonEmpty(ex?.ko)) return err(`예문 ${j + 1}의 en/ko 비어 있음`);
      if (!mentions(ex.en, w.id)) warnings.push(`${at}: 예문 ${j + 1}에 단어 없음 → "${ex.en}"`);
    });
  });

  return { errors, warnings };
}

// 등급 안에서 Unit 배치를 섞는다. id 해시 순서라 빌드할 때마다 같은 결과(고정된 무작위)가 나온다.
// 등급 파일에 단어가 추가되면 그 등급의 배치는 바뀌므로, 등급 데이터가 완성된 뒤 반영한다.
export function shuffleLevel(words) {
  const hash = (s) => {
    let h = 0x811c9dc5; // FNV-1a 32bit
    for (const c of s) h = Math.imul(h ^ c.codePointAt(0), 0x01000193) >>> 0;
    return h;
  };
  return words
    .map((w) => [hash(w.id), w])
    .sort((a, b) => a[0] - b[0] || (a[1].id < b[1].id ? -1 : 1))
    .map(([, w]) => w);
}

// ponytail: 접두어 비교라 불규칙 변화형(go → went)은 경고로 남는다. 오류가 아니라 경고인 이유.
function mentions(sentence, id) {
  const text = sentence.toLowerCase();
  if (id.includes(' ')) return text.includes(id);
  const stem = id.length > 3 ? id.replace(/(e|y)$/, '') : id;
  return new RegExp(`\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text);
}

function main() {
  const check = process.argv.includes('--check');
  const all = [];
  let errorCount = 0;
  let warningCount = 0;

  for (const level of LEVELS) {
    const file = new URL(`data/levels/${level.toLowerCase()}.json`, root);
    if (!existsSync(file)) continue;

    let words;
    try {
      words = JSON.parse(readFileSync(file, 'utf8'));
    } catch (e) {
      console.error(`✗ ${level}: JSON 파싱 실패 — ${e.message}`);
      errorCount++;
      continue;
    }
    if (!Array.isArray(words)) {
      console.error(`✗ ${level}: 최상위가 배열이 아님`);
      errorCount++;
      continue;
    }

    const { errors, warnings } = validate(words, level);
    errors.forEach((m) => console.error(`✗ ${m}`));
    warnings.forEach((m) => console.warn(`! ${m}`));
    errorCount += errors.length;
    warningCount += warnings.length;
    console.log(`${level}: ${words.length}단어, 오류 ${errors.length}, 경고 ${warnings.length}`);
    all.push(...shuffleLevel(words));
  }

  const seen = new Set();
  for (const w of all) {
    if (seen.has(w.id)) {
      console.error(`✗ 등급 간 id 중복: ${w.id}`);
      errorCount++;
    }
    seen.add(w.id);
  }

  if (all.length === 0) {
    console.error('✗ data/levels/에 등급 파일이 없음');
    process.exit(1);
  }
  console.log(`합계: ${all.length}단어, 오류 ${errorCount}, 경고 ${warningCount}`);
  if (errorCount > 0) process.exit(1);
  if (check) return;

  writeFileSync(new URL('src/data/words.json', root), JSON.stringify(all, null, 2) + '\n');
  console.log('→ src/data/words.json 갱신');
}

if (import.meta.main) main();
