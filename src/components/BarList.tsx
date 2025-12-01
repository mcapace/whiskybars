'use client';

import { useMemo } from 'react';
import { Bar } from '@/types';

interface BarListProps {
  bars: Bar[];
  selectedBar: Bar | null;
  onBarSelect: (bar: Bar) => void;
  searchQuery: string;
  selectedState: string | null;
}

export default function BarList({
  bars,
  selectedBar,
  onBarSelect,
  searchQuery,
  selectedState,
}: BarListProps) {
  // Group bars by state
  const groupedBars = useMemo(() => {
    let filteredBars = bars;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredBars = filteredBars.filter(
        bar =>
          bar.name.toLowerCase().includes(query) ||
          bar.address.toLowerCase().includes(query) ||
          bar.description.toLowerCase().includes(query) ||
          bar.state.toLowerCase().includes(query)
      );
    }

    // Filter by state
    if (selectedState) {
      filteredBars = filteredBars.filter(bar => bar.state === selectedState);
    }

    // Group by state
    const grouped: Record<string, Bar[]> = {};
    filteredBars.forEach(bar => {
      if (!grouped[bar.state]) {
        grouped[bar.state] = [];
      }
      grouped[bar.state].push(bar);
    });

    // Sort states alphabetically
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [bars, searchQuery, selectedState]);

  const totalCount = useMemo(() => {
    return groupedBars.reduce((acc, [, stateBars]) => acc + stateBars.length, 0);
  }, [groupedBars]);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-4 sm:p-6">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
          {totalCount} Bars {selectedState ? `in ${selectedState}` : 'Nationwide'}
        </p>
      </div>

      {groupedBars.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No bars found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedBars.map(([state, stateBars]) => (
            <div key={state}>
              <h3 className="text-xs uppercase tracking-widest text-whisky-red font-bold mb-3 sticky top-0 bg-gray-50 py-2">
                {state}
              </h3>
              <div className="space-y-4">
                {stateBars.map(bar => (
                  <button
                    key={bar.id}
                    onClick={() => onBarSelect(bar)}
                    className={`bar-item w-full text-left p-4 rounded-lg transition-all ${
                      selectedBar?.id === bar.id
                        ? 'bg-whisky-red/10 border-l-4 border-whisky-red'
                        : 'bg-white hover:bg-gray-100 border-l-4 border-transparent'
                    }`}
                  >
                    <h4 className="font-serif text-lg font-semibold text-gray-900 mb-1">
                      {bar.name}
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">{bar.address}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{bar.description}</p>
                    <div className="flex gap-3 mt-3">
                      {bar.website && (
                        <a
                          href={`https://${bar.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-xs font-semibold text-whisky-red hover:underline"
                        >
                          Website
                        </a>
                      )}
                      {bar.whiskyList && (
                        <a
                          href={bar.whiskyList}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-xs font-semibold text-whisky-red hover:underline"
                        >
                          Whisky Menu
                        </a>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
