interface Props {
  onKeep: () => void;
  onKnown: () => void;
}

export default function VerdictBar({ onKeep, onKnown }: Props) {
  return (
    <div className="bottom-bar">
      <div className="bottom-bar-inner">
        <button type="button" className="btn btn-keep" onClick={onKeep}>
          Keep<kbd className="kbd">1</kbd>
        </button>
        <button type="button" className="btn btn-primary" onClick={onKnown}>
          알아요<kbd className="kbd">2</kbd>
        </button>
      </div>
    </div>
  );
}
