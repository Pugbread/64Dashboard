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
    <div className="flex border border-border rounded-[3px] overflow-hidden">
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors duration-150 border-r border-border last:border-r-0 ${
            value === r.value
              ? 'bg-white text-black'
              : 'text-text-secondary hover:text-white bg-transparent'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
