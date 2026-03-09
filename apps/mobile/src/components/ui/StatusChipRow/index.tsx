import './status-chip-row.css';

type StatusChipRowProps = {
  chips: string[];
};

export function StatusChipRow({ chips }: StatusChipRowProps) {
  return (
    <div className="inspector-order-chip-row">
      {chips.map((chip, index) => (
        <span key={`${chip}-${index}`} className="inspector-order-badge">
          {chip}
        </span>
      ))}
    </div>
  );
}
