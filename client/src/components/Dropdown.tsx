import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}

export default function Dropdown({ value, options, onChange, className = '' }: DropdownProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-bg-card border border-border rounded-[3px] pl-3 pr-8 py-1.5 text-white text-xs font-medium focus:outline-none focus:border-[#444] cursor-pointer transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    </div>
  );
}
