import { useEffect, useState } from 'react';
import { startUnit, unitCount, type Progress } from './lib/study';
import { load, save } from './lib/storage';
import { words } from './lib/words';
import Home from './screens/Home';
import Review from './screens/Review';
import Study from './screens/Study';

type Route = { name: 'home' } | { name: 'unit'; n: number };

function parse(hash: string): Route {
  const m = hash.match(/^#\/unit\/(\d+)$/);
  const n = m ? Number(m[1]) : 0;
  return n >= 1 && n <= unitCount(words) ? { name: 'unit', n } : { name: 'home' };
}

export default function App() {
  const [progress, setProgress] = useState(load);
  const [route, setRoute] = useState(() => parse(location.hash));

  useEffect(() => {
    save(progress);
  }, [progress]);

  // 브라우저/모바일 뒤로가기와 주소 직접 입력
  useEffect(() => {
    const sync = () => setRoute(parse(location.hash));
    addEventListener('popstate', sync);
    addEventListener('hashchange', sync);
    return () => {
      removeEventListener('popstate', sync);
      removeEventListener('hashchange', sync);
    };
  }, []);

  // 주소로 바로 들어온 미시작 Unit도 시작 처리
  const unit = route.name === 'unit' ? route.n : null;
  useEffect(() => {
    if (unit !== null) setProgress((p) => startUnit(p, words, unit));
  }, [unit]);

  // 홈 → Unit은 기록을 쌓고(뒤로가기로 홈 복귀), Unit → Unit은 교체한다
  const navigate = (hash: string, push: boolean) => {
    if (push) history.pushState({ fromHome: true }, '', hash);
    else history.replaceState(history.state, '', hash);
    setRoute(parse(hash));
  };
  const goHome = () => (history.state?.fromHome ? history.back() : navigate('#/', false));

  if (unit !== null) {
    if (!progress.units[unit]) return null; // startUnit 반영 직전 한 프레임
    return <UnitScreen key={unit} unit={unit} progress={progress} setProgress={setProgress}
      onOpenUnit={(n) => navigate(`#/unit/${n}`, false)} onHome={goHome} />;
  }

  return <Home progress={progress} onOpenUnit={(n) => navigate(`#/unit/${n}`, true)} />;
}

interface UnitScreenProps {
  unit: number;
  progress: Progress;
  setProgress: (update: (p: Progress) => Progress) => void;
  onOpenUnit: (n: number) => void;
  onHome: () => void;
}

// 모드는 열 때 한 번만 정한다. 학습 중 완료돼도 복습으로 바뀌지 않고 완료 요약을 보여준다.
function UnitScreen(props: UnitScreenProps) {
  const [review] = useState(() => props.progress.units[props.unit].done);
  return review ? <Review {...props} /> : <Study {...props} />;
}
