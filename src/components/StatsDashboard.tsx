'use client';

import { useMemo } from 'react';
import { Bar } from '@/types';

interface StatsDashboardProps {
  bars: Bar[];
  selectedState: string | null;
}

export default function StatsDashboard({ bars, selectedState }: StatsDashboardProps) {
  const stats = useMemo(() => {
    const filteredBars = selectedState ? bars.filter(b => b.state === selectedState) : bars;
    
    // Count bars by state
    const stateCounts: Record<string, number> = {};
    filteredBars.forEach(bar => {
      stateCounts[bar.state] = (stateCounts[bar.state] || 0) + 1;
    });
    
    const topStates = Object.entries(stateCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    return {
      total: filteredBars.length,
      states: Object.keys(stateCounts).length,
      topStates,
    };
  }, [bars, selectedState]);

  return (
    <div className="bg-gradient-to-br from-wa-cream to-white rounded-xl p-6 shadow-lg border border-gray-200">
      <h3 className="font-serif text-2xl font-bold text-gray-900 mb-4">
        {selectedState ? `${selectedState} Statistics` : 'National Statistics'}
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
          <div className="text-3xl font-bold text-wa-red mb-1">{stats.total}</div>
          <div className="text-sm text-gray-600 font-medium">Total Bars</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
          <div className="text-3xl font-bold text-wa-red mb-1">{stats.states}</div>
          <div className="text-sm text-gray-600 font-medium">States</div>
        </div>
      </div>
      {!selectedState && stats.topStates.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Top States</h4>
          <div className="space-y-2">
            {stats.topStates.map(([state, count]) => (
              <div key={state} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{state}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-wa-red to-wa-gold rounded-full transition-all duration-500"
                      style={{ width: `${(count / stats.topStates[0][1]) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-wa-red w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

