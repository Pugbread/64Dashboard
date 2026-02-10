import { Clock } from 'lucide-react';

interface IntervalSelectorProps {
  value: string;
  onChange: (interval: string) => void;
}

const intervals = [
  { label: 'Hourly', value: 'hourly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
];

export default function IntervalSelector({ value, onChange }: IntervalSelectorProps) {
  return (
    <div className="flex items-center border border-border rounded-[3px] overflow-hidden">
      <div className="px-2 border-r border-border flex items-center h-full">
        <Clock size={13} className="text-text-muted" />
      </div>
      {intervals.map((i) => (
        <button
          key={i.value}
          onClick={() => onChange(i.value)}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors duration-150 border-r border-border last:border-r-0 ${
            value === i.value
              ? 'bg-white text-black'
              : 'text-text-secondary hover:text-white bg-transparent'
          }`}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}
