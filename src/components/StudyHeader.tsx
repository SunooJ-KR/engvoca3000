import type { Progress } from '../lib/study';

interface Props {
  title: string;
  progress: Progress;
  setProgress: (update: (p: Progress) => Progress) => void;
  onHome: () => void;
}

export default function StudyHeader({ title, progress, setProgress, onHome }: Props) {
  const on = progress.settings.showTranslation;
  const toggle = () =>
    setProgress((p) => ({ ...p, settings: { ...p.settings, showTranslation: !p.settings.showTranslation } }));

  return (
    <header className="study-head">
      <button type="button" className="btn-text" onClick={onHome}>← 홈</button>
      <p className="title">{title}</p>
      <button type="button" className="btn-text" onClick={toggle} aria-pressed={on}>
        번역 {on ? '켜짐' : '꺼짐'}
      </button>
    </header>
  );
}
