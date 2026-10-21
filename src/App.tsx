import data from './data/words.json';
import type { Word } from './types';

const words = data as Word[];

export default function App() {
  return (
    <main>
      <p className="label">Oxford 3000</p>
      <h1 className="display">Vocabulary</h1>
      <p className="secondary">
        {words.length}단어 · {Math.ceil(words.length / 10)} Unit
      </p>
    </main>
  );
}
