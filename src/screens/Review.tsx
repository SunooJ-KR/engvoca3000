import { useEffect, useState } from 'react';
import StudyHeader from '../components/StudyHeader';
import WordCard from '../components/WordCard';
import VerdictBar from '../components/VerdictBar';
import { useKeys } from '../lib/input';
import { speak } from '../lib/speech';
import { judge, reviewCards, type Progress, type Verdict } from '../lib/study';
import { getWord } from '../lib/words';

interface Props {
  unit: number;
  progress: Progress;
  setProgress: (update: (p: Progress) => Progress) => void;
  onHome: () => void;
}

// ponytail: 복습은 10장뿐이라 진행 위치를 저장하지 않는다. 새로고침하면 처음부터.
export default function Review({ unit, progress, setProgress, onHome }: Props) {
  const cards = reviewCards(progress, unit);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Verdict[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pos]);

  const decide = (verdict: Verdict) => {
    setProgress((p) => judge(p, cards[pos], verdict));
    setResults((r) => [...r, verdict]);
    setRevealed(false);
    setPos(pos + 1);
  };

  const done = pos >= cards.length;
  useKeys(
    done
      ? {}
      : {
          Space: revealed ? undefined : () => setRevealed(true),
          '1': revealed ? () => decide('keep') : undefined,
          '2': revealed ? () => decide('known') : undefined,
          p: () => speak(getWord(cards[pos]).word),
        },
  );

  const restart = () => {
    setPos(0);
    setResults([]);
    setRevealed(false);
  };

  const header = <StudyHeader title={`Unit ${unit} 복습`} progress={progress} setProgress={setProgress} onHome={onHome} />;

  if (done) {
    const known = results.filter((v) => v === 'known').length;
    const keeps = cards.filter((_, i) => results[i] === 'keep');
    return (
      <main>
        {header}
        <section className="summary">
          <p className="label">복습 완료</p>
          <p className="summary-score">
            <span className="display count-known">{known}</span>
            <span className="title secondary"> / {cards.length} 알아요</span>
          </p>
          {keeps.length > 0 && (
            <>
              <p className="secondary">Keep으로 다음 Unit에 등장할 단어</p>
              <ul className="chip-list" lang="en">
                {keeps.map((id) => <li key={id}>{getWord(id).word}</li>)}
              </ul>
            </>
          )}
        </section>
        <div className="bottom-bar">
          <div className="bottom-bar-inner">
            <button type="button" className="btn btn-ghost" onClick={restart}>다시 복습</button>
            <button type="button" className="btn btn-primary" onClick={onHome}>홈</button>
          </div>
        </div>
      </main>
    );
  }

  const id = cards[pos];

  return (
    <main>
      {header}
      <div className="study-progress">
        <p className="secondary">{pos + 1} / {cards.length}</p>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={cards.length} aria-valuenow={pos}>
          <div className="bar-fill" style={{ width: `${(pos / cards.length) * 100}%` }} />
        </div>
      </div>

      <div onClick={revealed ? undefined : () => setRevealed(true)}>
        <WordCard key={id} word={getWord(id)} revealed={revealed} showTranslation={progress.settings.showTranslation} />
      </div>
      {!revealed && <p className="secondary hint">뜻을 떠올린 뒤 확인하세요</p>}

      {revealed ? (
        <VerdictBar onKeep={() => decide('keep')} onKnown={() => decide('known')} />
      ) : (
        <div className="bottom-bar">
          <div className="bottom-bar-inner">
            <button type="button" className="btn btn-primary" onClick={() => setRevealed(true)}>
              정답 보기<kbd className="kbd">Space</kbd>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
