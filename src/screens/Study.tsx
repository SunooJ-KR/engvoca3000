import { useEffect } from 'react';
import WordCard from '../components/WordCard';
import VerdictBar from '../components/VerdictBar';
import { finishUnit, judge, move, nextUnit, type Progress, type Verdict } from '../lib/study';
import type { Word } from '../types';

interface Props {
  unit: number;
  words: Word[];
  byId: Map<string, Word>;
  progress: Progress;
  setProgress: (update: (p: Progress) => Progress) => void;
  onOpenUnit: (n: number) => void;
  onHome: () => void;
}

// ponytail: 데이터 갱신으로 사라진 단어도 판정은 할 수 있게 자리만 채운다
const missing = (id: string): Word => ({
  id, word: id, pos: ['?'], cefr: 'A1', meanings: ['(데이터에서 삭제된 단어)'], examples: [],
});

export default function Study({ unit, words, byId, progress, setProgress, onOpenUnit, onHome }: Props) {
  const record = progress.units[unit];
  const { cards, newCount, pos } = record;
  const finished = pos >= cards.length;
  const showTranslation = progress.settings.showTranslation;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pos]);

  const decide = (verdict: Verdict) =>
    setProgress((p) => {
      const next = move(judge(p, cards[pos], verdict), unit, pos + 1);
      return pos + 1 >= cards.length ? finishUnit(next, unit) : next;
    });

  const toggleTranslation = () =>
    setProgress((p) => ({ ...p, settings: { ...p.settings, showTranslation: !p.settings.showTranslation } }));

  const header = (
    <header className="study-head">
      <button type="button" className="btn-text" onClick={onHome}>← 홈</button>
      <p className="title">Unit {unit}</p>
      <button type="button" className="btn-text" onClick={toggleTranslation} aria-pressed={showTranslation}>
        번역 {showTranslation ? '켜짐' : '꺼짐'}
      </button>
    </header>
  );

  if (finished) {
    const verdicts = cards.map((id) => progress.words[id]);
    const keeps = cards.filter((id) => progress.words[id] === 'keep');
    const next = nextUnit(progress, words);
    return (
      <main>
        {header}
        <section className="summary">
          <p className="label">학습 완료</p>
          <div className="summary-counts">
            <p><span className="display count-known">{verdicts.filter((v) => v === 'known').length}</span> 알아요</p>
            <p><span className="display count-keep">{keeps.length}</span> Keep</p>
          </div>
          {keeps.length > 0 && (
            <>
              <p className="secondary">다음 Unit으로 넘어갈 단어</p>
              <ul className="chip-list" lang="en">
                {keeps.map((id) => <li key={id}>{byId.get(id)?.word ?? id}</li>)}
              </ul>
            </>
          )}
        </section>
        <div className="bottom-bar">
          <div className="bottom-bar-inner">
            <button type="button" className="btn btn-ghost" onClick={onHome}>홈</button>
            {next !== null && (
              <button type="button" className="btn btn-primary" onClick={() => onOpenUnit(next)}>
                Unit {next} 시작
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  const id = cards[pos];
  const keepCount = cards.length - newCount;

  return (
    <main>
      {header}
      <div className="study-progress">
        <p className="secondary">
          {pos + 1} / {cards.length}
          {keepCount > 0 && ` · 새 단어 ${newCount} + Keep ${keepCount}`}
        </p>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={cards.length} aria-valuenow={pos}>
          <div className="bar-fill" style={{ width: `${(pos / cards.length) * 100}%` }} />
        </div>
      </div>

      <WordCard key={id} word={byId.get(id) ?? missing(id)} isKeep={pos >= newCount} showTranslation={showTranslation} />

      {pos > 0 && (
        <button type="button" className="btn-text prev" onClick={() => setProgress((p) => move(p, unit, pos - 1))}>
          ← 이전 단어
        </button>
      )}

      <VerdictBar onKeep={() => decide('keep')} onKnown={() => decide('known')} />
    </main>
  );
}
