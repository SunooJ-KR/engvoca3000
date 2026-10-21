import { useEffect, useState } from 'react';
import data from './data/words.json';
import type { Word } from './types';
import { nextUnit, startUnit, stats } from './lib/study';
import { load, save } from './lib/storage';
import Study from './screens/Study';

const words = data as Word[];
const byId = new Map(words.map((w) => [w.id, w]));

export default function App() {
  const [progress, setProgress] = useState(load);
  const [unit, setUnit] = useState<number | null>(null);

  useEffect(() => {
    save(progress);
  }, [progress]);

  const openUnit = (n: number) => {
    setProgress((p) => startUnit(p, words, n));
    setUnit(n);
  };

  if (unit !== null && progress.units[unit]) {
    return (
      <Study
        unit={unit}
        words={words}
        byId={byId}
        progress={progress}
        setProgress={setProgress}
        onOpenUnit={openUnit}
        onHome={() => setUnit(null)}
      />
    );
  }

  // ponytail: M3에서 Unit 목록이 있는 Home 화면으로 교체
  const s = stats(progress, words);
  const next = nextUnit(progress, words);
  return (
    <main>
      <p className="label">Oxford 3000</p>
      <h1 className="display">Vocabulary</h1>
      <p className="secondary">
        완료 {s.doneUnits} / {s.totalUnits} Unit · 알아요 {s.known} / {s.totalWords} · Keep {s.keep}
      </p>
      {next !== null && (
        <div className="bottom-bar">
          <div className="bottom-bar-inner">
            <button type="button" className="btn btn-primary" onClick={() => openUnit(next)}>
              이어서 학습 · Unit {next}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
