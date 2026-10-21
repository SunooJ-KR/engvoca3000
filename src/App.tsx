import { useEffect, useState } from 'react';
import { startUnit, unitCount, type Progress } from './lib/study';
import { load, save } from './lib/storage';
import { applyOrder, words } from './lib/words';
import Home from './screens/Home';
import Review from './screens/Review';
import Search from './screens/Search';
import Study from './screens/Study';

type Route = { name: 'home' } | { name: 'unit'; n: number } | { name: 'search'; id: string | null };

function parse(hash: string): Route {
  const s = hash.match(/^#\/search(?:\/(.+))?$/);
  if (s) return { name: 'search', id: s[1] ? decodeURIComponent(s[1]) : null };
  const m = hash.match(/^#\/unit\/(\d+)$/);
  const n = m ? Number(m[1]) : 0;
  return n >= 1 && n <= unitCount(words) ? { name: 'unit', n } : { name: 'home' };
}

export default function App() {
  const [progress, setProgress] = useState(load);
  applyOrder(progress.seed); // 이 브라우저의 단어 순서. seed가 같으면 아무 일도 하지 않는다
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

  // 홈 → Unit/검색은 기록을 쌓고(뒤로가기로 홈 복귀), Unit → Unit은 교체한다.
  // state는 "뒤로가기 하면 어디로 가는지"를 표시한다.
  const navigate = (hash: string, push: false | 'fromHome' | 'fromSearch') => {
    if (push) history.pushState({ [push]: true }, '', hash);
    else history.replaceState(history.state, '', hash);
    setRoute(parse(hash));
  };
  const goHome = () => (history.state?.fromHome ? history.back() : navigate('#/', false));

  if (route.name === 'search') {
    return (
      <Search
        progress={progress}
        selected={route.id}
        onSelect={(id) => navigate(`#/search/${encodeURIComponent(id)}`, 'fromSearch')}
        onBackToList={() => (history.state?.fromSearch ? history.back() : navigate('#/search', false))}
        onHome={goHome}
      />
    );
  }

  if (unit !== null) {
    if (!progress.units[unit]) return null; // startUnit 반영 직전 한 프레임
    return <UnitScreen key={unit} unit={unit} progress={progress} setProgress={setProgress}
      onOpenUnit={(n) => navigate(`#/unit/${n}`, false)} onHome={goHome} />;
  }

  return (
    <Home
      progress={progress}
      onOpenUnit={(n) => navigate(`#/unit/${n}`, 'fromHome')}
      onSearch={() => navigate('#/search', 'fromHome')}
    />
  );
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
