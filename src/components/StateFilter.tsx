'use client';

import { useMemo } from 'react';
import { Bar } from '@/types';

interface StateFilterProps {
  bars: Bar[];
  selectedState: string | null;
  onStateSelect: (state: string | null) => void;
}

export default function StateFilter({ bars, selectedState, onStateSelect }: StateFilterProps) {
  const states = useMemo(() => {
    const stateSet = new Set(bars.map(bar => bar.state));
    return Array.from(stateSet).sort();
  }, [bars]);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onStateSelect(null)}
        className={`state-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
          selectedState === null
            ? 'bg-whisky-red text-white border-whisky-red'
            : 'bg-white text-gray-700 border-gray-300 hover:border-whisky-red'
        }`}
      >
        All States
      </button>
      {states.map(state => (
        <button
          key={state}
          onClick={() => onStateSelect(state)}
          className={`state-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
            selectedState === state
              ? 'bg-whisky-red text-white border-whisky-red'
              : 'bg-white text-gray-700 border-gray-300 hover:border-whisky-red'
          }`}
        >
          {state}
        </button>
      ))}
    </div>
  );
}
