interface Props {
  onKeep: () => void;
  onKnown: () => void;
}

export default function VerdictBar({ onKeep, onKnown }: Props) {
  return (
    <div className="bottom-bar">
      <div className="bottom-bar-inner">
        <button type="button" className="btn btn-keep" onClick={onKeep}>
          Keep
        </button>
        <button type="button" className="btn btn-primary" onClick={onKnown}>
          알아요
        </button>
      </div>
    </div>
  );
}
