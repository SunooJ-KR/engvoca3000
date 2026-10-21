import { useMemo, useState } from 'react';
import WordCard from '../components/WordCard';
import type { Progress } from '../lib/study';
import { getWord, unitOf, words } from '../lib/words';

interface Props {
  progress: Progress;
  selected: string | null; // 주소(#/search/<id>)로 관리해 뒤로가기가 목록으로 돌아오게 한다
  onSelect: (id: string) => void;
  onBackToList: () => void;
  onHome: () => void;
}

const MAX_RESULTS = 100;

const STATE_LABEL = { keep: 'Keep', known: '알아요' } as const;

export default function Search({ progress, selected, onSelect, onBackToList, onHome }: Props) {
  const [q, setQ] = useState('');
  const [keepOnly, setKeepOnly] = useState(false);
  const query = q.trim().toLowerCase();

  // 영어 앞부분 일치를 먼저, 그다음 영어 부분 일치·한국어 뜻 일치
  const results = useMemo(() => {
    const base = keepOnly ? words.filter((w) => progress.words[w.id] === 'keep') : words;
    if (!query) return keepOnly ? base : [];
    const starts = base.filter((w) => w.id.startsWith(query));
    const rest = base.filter(
      (w) => !w.id.startsWith(query) && (w.id.includes(query) || w.meanings.some((m) => m.includes(query))),
    );
    return [...starts, ...rest];
  }, [query, keepOnly, progress.words]);

  if (selected) {
    const state = progress.words[selected];
    return (
      <main>
        <header className="study-head">
          <button type="button" className="btn-text" onClick={onBackToList}>← 목록</button>
          <p className="secondary">
            Unit {unitOf(selected) ?? '?'}
            {state && <> · <span className={`count-${state}`}>{STATE_LABEL[state]}</span></>}
          </p>
        </header>
        <WordCard key={selected} word={getWord(selected)} showTranslation={progress.settings.showTranslation} />
      </main>
    );
  }

  return (
    <main>
      <header className="study-head">
        <button type="button" className="btn-text" onClick={onHome}>← 홈</button>
        <p className="title">검색</p>
        <button type="button" className="btn-text" onClick={() => setKeepOnly((k) => !k)} aria-pressed={keepOnly}>
          Keep만
        </button>
      </header>

      <input
        className="search-input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="영어 단어 또는 한국어 뜻"
        aria-label="단어 검색"
        autoFocus
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
      />

      {!query && !keepOnly ? (
        <p className="secondary search-empty">단어를 입력하거나 Keep만 보기를 켜세요.</p>
      ) : results.length === 0 ? (
        <p className="secondary search-empty">{keepOnly && !query ? 'Keep 단어가 없습니다.' : '결과가 없습니다.'}</p>
      ) : (
        <>
          <p className="label search-count">{results.length}개</p>
          <ul className="result-list">
            {results.slice(0, MAX_RESULTS).map((w) => {
              const state = progress.words[w.id];
              return (
                <li key={w.id}>
                  <button type="button" className="result-row" onClick={() => onSelect(w.id)}>
                    <span className="result-main">
                      <span className="result-word" lang="en">{w.word}</span>
                      <span className="secondary">{w.meanings[0]}</span>
                    </span>
                    <span className="result-meta">
                      {state && <span className={`count-${state}`}>{STATE_LABEL[state]}</span>}
                      <span className="secondary">{w.cefr} · U{unitOf(w.id)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {results.length > MAX_RESULTS && (
            <p className="secondary search-empty">상위 {MAX_RESULTS}개만 표시합니다. 검색어를 더 입력하세요.</p>
          )}
        </>
      )}
    </main>
  );
}
