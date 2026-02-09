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
    <div className="flex bg-surface-800 rounded-lg p-1 gap-1">
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === r.value
              ? 'bg-accent text-white'
              : 'text-surface-400 hover:text-white hover:bg-surface-700'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
