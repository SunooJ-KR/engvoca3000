import { useState, type MouseEvent } from 'react';
import { canSpeak, speak } from '../lib/speech';
import type { Word } from '../types';

interface Props {
  word: Word;
  revealed?: boolean;
  isKeep?: boolean;
  showTranslation?: boolean;
}

function SpeakButton({ text, label, large = false }: { text: string; label: string; large?: boolean }) {
  if (!canSpeak) return null;
  // 복습 모드에서 카드 탭(정답 보기)으로 번지지 않게 막는다
  const onClick = (e: MouseEvent) => {
    e.stopPropagation();
    speak(text);
  };
  return (
    <button type="button" className={`speak${large ? ' speak-large' : ''}`} onClick={onClick} aria-label={label}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </button>
  );
}

// 예문 번역 펼침 상태는 카드마다 초기화돼야 하므로 부모에서 key={word.id}로 렌더링한다.
export default function WordCard({ word, revealed = true, isKeep = false, showTranslation = false }: Props) {
  const [open, setOpen] = useState<boolean[]>([]);
  const toggle = (i: number) => setOpen((o) => Object.assign([...o], { [i]: !o[i] }));

  return (
    <article className="card">
      <header className="card-head">
        {isKeep && <span className="tag tag-keep">Keep</span>}
        <div className="word-line">
          <h2 className={`display word${word.word.length >= 12 ? ' word-long' : ''}`} lang="en">
            {word.word}
          </h2>
          <SpeakButton text={word.word} label={`${word.word} 발음 듣기`} large />
        </div>
        <p className="label">
          {word.pos.join(' · ')} · {word.cefr}
        </p>
      </header>

      {revealed && (
        <>
          <ol className="meanings">
            {word.meanings.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ol>

          <ul className="examples">
            {word.examples.map((ex, i) => {
              const shown = showTranslation || open[i];
              return (
                <li key={i} className="example-row">
                  <button
                    type="button"
                    className="example"
                    onClick={() => toggle(i)}
                    aria-expanded={shown}
                    disabled={showTranslation}
                  >
                    <span className="example-en" lang="en">{ex.en}</span>
                    {shown ? (
                      <span className="example-ko">{ex.ko}</span>
                    ) : (
                      <span className="example-hint">탭해서 번역 보기</span>
                    )}
                  </button>
                  <SpeakButton text={ex.en} label={`예문 ${i + 1} 발음 듣기`} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </article>
  );
}
