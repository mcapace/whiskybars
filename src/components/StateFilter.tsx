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
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get states with bar counts
  const statesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bars.forEach(bar => {
      counts[bar.state] = (counts[bar.state] || 0) + 1;
    });
    return counts;
  }, [bars]);

  // Get top states by count
  const topStates = useMemo(() => {
    return Object.entries(statesWithCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([state]) => state);
  }, [statesWithCounts]);

  // Filter states by search
  const filteredStates = useMemo(() => {
    if (!searchQuery) return Object.keys(statesWithCounts).sort();
    const query = searchQuery.toLowerCase();
    return Object.keys(statesWithCounts).filter(state =>
      state.toLowerCase().includes(query) ||
      (STATE_NAMES[state] && STATE_NAMES[state].toLowerCase().includes(query))
    ).sort();
  }, [statesWithCounts, searchQuery]);

  // Group filtered states by region
  const statesByRegion = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    Object.entries(REGIONS).forEach(([region, states]) => {
      const filtered = states.filter(s => filteredStates.includes(s));
      if (filtered.length > 0) {
        grouped[region] = filtered;
      }
    });
    return grouped;
  }, [filteredStates]);

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
      {/* Quick Pills - Top States */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
        <button
          onClick={() => onStateSelect(null)}
          className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-all ${
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
            className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-all ${
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
          className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-all flex items-center gap-1.5 ${
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

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[90vw] max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search states..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wa-red focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* States by Region */}
          <div className="max-h-80 overflow-y-auto p-4">
            {Object.entries(statesByRegion).map(([region, states]) => (
              <div key={region} className="mb-4 last:mb-0">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{region}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {states.map(state => (
                    <button
                      key={state}
                      onClick={() => {
                        onStateSelect(state === selectedState ? null : state);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all ${
                        selectedState === state
                          ? 'bg-wa-red text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-wa-red/10 hover:text-wa-red'
                      }`}
                    >
                      <span className="font-medium">{state}</span>
                      <span className={`text-xs ${selectedState === state ? 'text-white/80' : 'text-gray-400'}`}>
                        {statesWithCounts[state]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(statesByRegion).length === 0 && (
              <p className="text-center text-gray-400 py-8">No states found matching "{searchQuery}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
