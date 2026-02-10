interface RangeSelectorProps {
  value: string;
  onChange: (range: string) => void;
}

const ranges = [
  { label: 'Today', value: '1d' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
];

export default function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="flex bg-bg-card border border-border rounded-xl p-1 gap-0.5">
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            value === r.value
              ? 'bg-gradient-purple text-white shadow-glow-sm'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
