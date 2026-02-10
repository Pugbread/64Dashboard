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
    <div className="flex items-center bg-bg-card border border-border rounded-xl p-1 gap-0.5">
      <div className="pl-2 pr-1">
        <Clock size={13} className="text-text-muted" />
      </div>
      {intervals.map((i) => (
        <button
          key={i.value}
          onClick={() => onChange(i.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            value === i.value
              ? 'bg-gradient-purple text-white shadow-glow-sm'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}
