import { useEffect, useRef } from 'react';
import { keepIds, nextUnit, reviewCards, stats, unitCount, unitWords, type Progress } from '../lib/study';
import { words } from '../lib/words';

interface Props {
  progress: Progress;
  onOpenUnit: (n: number) => void;
  onSearch: () => void;
  onReset: () => void;
}

export default function Home({ progress, onOpenUnit, onSearch, onReset }: Props) {
  const s = stats(progress, words);
  const next = nextUnit(progress, words);
  const current = useRef<HTMLLIElement>(null);

  // 처음 열 때 진행 중인 Unit 근처로 스크롤
  useEffect(() => {
    current.current?.scrollIntoView({ block: 'center' });
  }, []);

  const nextRecord = next !== null ? progress.units[next] : undefined;
  const nextDetail = nextRecord
    ? `${nextRecord.cards.length}장 중 ${nextRecord.pos}장 완료`
    : `새 단어 ${next !== null ? unitWords(words, next).length : 0} + Keep ${keepIds(progress).length}`;

  const units = Array.from({ length: unitCount(words) }, (_, i) => i + 1);

  return (
    <main>
      <header className="home-top">
        <span className="label">Oxford 3000</span>
        <button type="button" className="btn-text" onClick={onSearch}>검색</button>
      </header>
      <section className="home-hero">
        <p className="label">{next === null ? '학습 완료' : nextRecord ? '이어서 학습' : '다음 학습'}</p>
        <h1 className="display">{next === null ? '모두 완료' : `Unit ${next}`}</h1>
        {next !== null && <p className="secondary">{nextDetail}</p>}
      </section>

      <dl className="home-stats">
        <div><dt className="label">완료 Unit</dt><dd className="title">{s.doneUnits}<span className="secondary"> / {s.totalUnits}</span></dd></div>
        <div><dt className="label">알아요</dt><dd className="title">{s.known}<span className="secondary"> / {s.totalWords}</span></dd></div>
        <div><dt className="label">Keep</dt><dd className="title count-keep">{s.keep}</dd></div>
      </dl>

      <ol className="unit-list">
        {units.map((n) => {
          const record = progress.units[n];
          const known = reviewCards(progress, n).filter((id) => progress.words[id] === 'known').length;
          return (
            <li key={n} ref={n === next ? current : undefined}>
              <button type="button" className="unit-row" onClick={() => onOpenUnit(n)}>
                <span className="unit-name">Unit {n}</span>
                {record?.done ? (
                  <span className="unit-status">
                    <span className="count-known">{known} / {record.newCount}</span> · 복습
                  </span>
                ) : record ? (
                  <span className="unit-status unit-active">진행 중 · {record.pos} / {record.cards.length}</span>
                ) : (
                  <span className="unit-status secondary">{n === next ? '시작' : ''}</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <section className="reset">
        <button type="button" className="btn-text btn-danger" onClick={onReset}>학습 기록 초기화</button>
        <p className="secondary">판정, Keep, 진행 위치가 모두 지워지고 새 단어 순서로 처음부터 시작해요.</p>
      </section>

      {next !== null && (
        <div className="bottom-bar">
          <div className="bottom-bar-inner">
            <button type="button" className="btn btn-primary" onClick={() => onOpenUnit(next)}>
              {nextRecord ? '이어서 학습' : '학습 시작'} · Unit {next}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
