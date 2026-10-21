import { useEffect } from 'react';
import StudyHeader from '../components/StudyHeader';
import WordCard from '../components/WordCard';
import VerdictBar from '../components/VerdictBar';
import { finishUnit, judge, move, nextUnit, type Progress, type Verdict } from '../lib/study';
import { getWord, words } from '../lib/words';

interface Props {
  unit: number;
  progress: Progress;
  setProgress: (update: (p: Progress) => Progress) => void;
  onOpenUnit: (n: number) => void;
  onHome: () => void;
}

export default function Study({ unit, progress, setProgress, onOpenUnit, onHome }: Props) {
  const { cards, newCount, pos } = progress.units[unit];
  const finished = pos >= cards.length;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pos]);

  const decide = (verdict: Verdict) =>
    setProgress((p) => {
      const next = move(judge(p, cards[pos], verdict), unit, pos + 1);
      return pos + 1 >= cards.length ? finishUnit(next, unit) : next;
    });

  const header = <StudyHeader title={`Unit ${unit}`} progress={progress} setProgress={setProgress} onHome={onHome} />;

  if (finished) {
    const known = cards.filter((id) => progress.words[id] === 'known').length;
    const keeps = cards.filter((id) => progress.words[id] === 'keep');
    const next = nextUnit(progress, words);
    return (
      <main>
        {header}
        <section className="summary">
          <p className="label">학습 완료</p>
          <div className="summary-counts">
            <p><span className="display count-known">{known}</span> 알아요</p>
            <p><span className="display count-keep">{keeps.length}</span> Keep</p>
          </div>
          {keeps.length > 0 && (
            <>
              <p className="secondary">다음 Unit으로 넘어갈 단어</p>
              <ul className="chip-list" lang="en">
                {keeps.map((id) => <li key={id}>{getWord(id).word}</li>)}
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

      <WordCard key={id} word={getWord(id)} isKeep={pos >= newCount} showTranslation={progress.settings.showTranslation} />

      {pos > 0 && (
        <button type="button" className="btn-text prev" onClick={() => setProgress((p) => move(p, unit, pos - 1))}>
          ← 이전 단어
        </button>
      )}

      <VerdictBar onKeep={() => decide('keep')} onKnown={() => decide('known')} />
    </main>
  );
}
