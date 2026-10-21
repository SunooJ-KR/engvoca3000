import { useState } from 'react';
import type { Word } from '../types';

interface Props {
  word: Word;
  revealed?: boolean;
  isKeep?: boolean;
  showTranslation?: boolean;
}

// 예문 번역 펼침 상태는 카드마다 초기화돼야 하므로 부모에서 key={word.id}로 렌더링한다.
export default function WordCard({ word, revealed = true, isKeep = false, showTranslation = false }: Props) {
  const [open, setOpen] = useState<boolean[]>([]);
  const toggle = (i: number) => setOpen((o) => Object.assign([...o], { [i]: !o[i] }));

  return (
    <article className="card">
      <header className="card-head">
        {isKeep && <span className="tag tag-keep">Keep</span>}
        <h2 className={`display word${word.word.length >= 12 ? ' word-long' : ''}`} lang="en">
          {word.word}
        </h2>
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
                <li key={i}>
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
                </li>
              );
            })}
          </ul>
        </>
      )}
    </article>
  );
}
