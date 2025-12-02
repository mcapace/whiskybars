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
    
    // Calculate additional useful stats
    const barsWithWebsite = filteredBars.filter(b => b.website && b.website.trim() !== '').length;
    const barsWithWhiskyList = filteredBars.filter(b => b.whiskyList && b.whiskyList.trim() !== '').length;
    const websitePercentage = filteredBars.length > 0 ? Math.round((barsWithWebsite / filteredBars.length) * 100) : 0;
    const whiskyListPercentage = filteredBars.length > 0 ? Math.round((barsWithWhiskyList / filteredBars.length) * 100) : 0;
    
    return {
      total: filteredBars.length,
      states: Object.keys(stateCounts).length,
      topStates,
      barsWithWebsite,
      barsWithWhiskyList,
      websitePercentage,
      whiskyListPercentage,
    };
  }, [bars, selectedState]);

  const StatCard = ({ icon, value, label, percentage, color = 'wa-red' }: {
    icon: React.ReactNode;
    value: number | string;
    label: string;
    percentage?: number;
    color?: string;
  }) => (
    <div className="stats-card group relative bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
      {/* Accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-${color} to-wa-gold`}></div>
      
      {/* Icon */}
      <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-${color}/10 mb-4 group-hover:bg-${color}/20 transition-colors`}>
        {icon}
      </div>
      
      {/* Value */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-4xl font-bold text-${color}`}>{value}</span>
        {percentage !== undefined && (
          <span className="text-sm font-semibold text-gray-500">{percentage}%</span>
        )}
      </div>
      
      {/* Label */}
      <p className="text-sm font-medium text-gray-600">{label}</p>
      
      {/* Hover glow effect */}
      <div className={`absolute inset-0 bg-${color}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl`}></div>
    </div>
  );

  return (
    <div className="stats-dashboard relative">
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-wa-cream/50 via-white to-wa-cream/30 rounded-2xl"></div>
      
      {/* Main content */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-200/50">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gradient-to-b from-wa-red to-wa-gold rounded-full"></div>
            <h3 className="font-serif text-3xl font-bold text-gray-900">
              {selectedState ? `${selectedState} Overview` : 'National Overview'}
            </h3>
          </div>
          <p className="text-gray-600 text-base ml-4">
            {selectedState 
              ? `Statistics for bars in ${selectedState}`
              : 'Comprehensive statistics across all featured whisky bars'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={
              <svg className="w-6 h-6 text-wa-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            value={stats.total}
            label="Total Bars"
          />
          <StatCard
            icon={
              <svg className="w-6 h-6 text-wa-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            value={stats.states}
            label="States Covered"
          />
          <StatCard
            icon={
              <svg className="w-6 h-6 text-wa-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            }
            value={stats.barsWithWebsite}
            label="With Websites"
            percentage={stats.websitePercentage}
          />
          <StatCard
            icon={
              <svg className="w-6 h-6 text-wa-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            value={stats.barsWithWhiskyList}
            label="With Whisky Lists"
            percentage={stats.whiskyListPercentage}
          />
        </div>

        {/* Top States (only show when no state filter) */}
        {!selectedState && stats.topStates.length > 0 && (
          <div className="border-t border-gray-200 pt-8">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-wa-red rounded-full"></span>
              Top States by Bar Count
            </h4>
            <div className="space-y-3">
              {stats.topStates.map(([state, count], index) => {
                const maxCount = stats.topStates[0][1];
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={state} className="flex items-center gap-4 group">
                    <div className="flex items-center gap-3 min-w-[120px]">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-wa-red text-white' : 
                        index === 1 ? 'bg-wa-red/80 text-white' : 
                        index === 2 ? 'bg-wa-red/60 text-white' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-base font-semibold text-gray-900">{state}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-wa-red to-wa-gold rounded-full transition-all duration-700 group-hover:from-wa-gold group-hover:to-wa-red"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-base font-bold text-wa-red min-w-[3rem] text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

