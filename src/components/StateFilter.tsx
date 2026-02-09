'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { Bar } from '@/types';

interface StateFilterProps {
  bars: Bar[];
  selectedState: string | null;
  onStateSelect: (state: string | null) => void;
}

// US Regions with their states
const REGIONS = {
  'Northeast': ['CT', 'ME', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
  'Southeast': ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MD', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV', 'DC'],
  'Midwest': ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
  'Southwest': ['AZ', 'NM', 'OK', 'TX'],
  'West': ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY'],
};

// State name mapping
const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'Washington D.C.',
};

export default function StateFilter({ bars, selectedState, onStateSelect }: StateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get states with bar counts (only states that have bars)
  const statesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bars.forEach(bar => {
      counts[bar.state] = (counts[bar.state] || 0) + 1;
    });
    return counts;
  }, [bars]);

  // Get top states by count (most bars first)
  const topStates = useMemo(() => {
    return Object.entries(statesWithCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([state]) => state);
  }, [statesWithCounts]);

  // All states that have bars, grouped by region (for More States dropdown)
  const statesByRegion = useMemo(() => {
    const stateSet = new Set(Object.keys(statesWithCounts));
    const grouped: Record<string, string[]> = {};
    Object.entries(REGIONS).forEach(([region, states]) => {
      const inRegion = states.filter(s => stateSet.has(s)).sort((a, b) => (STATE_NAMES[a] || a).localeCompare(STATE_NAMES[b] || b));
      if (inRegion.length > 0) {
        grouped[region] = inRegion;
      }
    });
    return grouped;
  }, [statesWithCounts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalBars = bars.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Quick Pills - Top States (min 44px touch target on mobile) */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2 mb-3">
        <button
          onClick={() => onStateSelect(null)}
          className={`min-h-[44px] px-4 py-2.5 text-sm font-semibold rounded-full border-2 transition-all touch-manifest ${
            selectedState === null
              ? 'bg-wa-red text-white border-wa-red shadow-md'
              : 'bg-white text-gray-700 border-gray-200 hover:border-wa-red hover:text-wa-red'
          }`}
        >
          All ({totalBars})
        </button>

        {topStates.map(state => (
          <button
            key={state}
            onClick={() => onStateSelect(state === selectedState ? null : state)}
            className={`min-h-[44px] px-4 py-2.5 text-sm font-semibold rounded-full border-2 transition-all touch-manifest ${
              selectedState === state
                ? 'bg-wa-red text-white border-wa-red shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-wa-red hover:text-wa-red'
            }`}
          >
            {state} ({statesWithCounts[state]})
          </button>
        ))}

        {/* More States Dropdown Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`min-h-[44px] px-4 py-2.5 text-sm font-semibold rounded-full border-2 transition-all flex items-center gap-1.5 touch-manifest ${
            isOpen || (selectedState && !topStates.includes(selectedState))
              ? 'bg-wa-red text-white border-wa-red shadow-md'
              : 'bg-white text-gray-700 border-gray-200 hover:border-wa-red hover:text-wa-red'
          }`}
        >
          {selectedState && !topStates.includes(selectedState) ? (
            <>
              {selectedState} ({statesWithCounts[selectedState]})
            </>
          ) : (
            <>
              More States
              <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* More States dropdown - regions with full state names */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[90vw] max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto py-2">
            {Object.entries(statesByRegion).map(([region, states]) => (
              <div key={region} className="mb-1">
                <div className="sticky top-0 z-10 px-4 py-2 bg-gray-50 border-y border-gray-100">
                  <h4 className="text-xs font-bold text-wa-red uppercase tracking-wider">{region}</h4>
                </div>
                <ul className="px-2 py-1">
                  {states.map(state => (
                    <li key={state}>
                      <button
                        type="button"
                        onClick={() => {
                          onStateSelect(state === selectedState ? null : state);
                          setIsOpen(false);
                        }}
                        className={`w-full min-h-[48px] flex items-center justify-between gap-3 px-3 py-2.5 text-left rounded-lg transition-all touch-manifest ${
                          selectedState === state
                            ? 'bg-wa-red text-white'
                            : 'text-gray-700 hover:bg-wa-red/10 hover:text-wa-red'
                        }`}
                      >
                        <span className="font-medium">
                          {STATE_NAMES[state] || state}
                        </span>
                        <span className={`text-sm tabular-nums ${selectedState === state ? 'text-white/90' : 'text-gray-500'}`}>
                          {statesWithCounts[state]} {statesWithCounts[state] === 1 ? 'bar' : 'bars'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
