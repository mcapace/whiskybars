'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Bar } from '@/types';
import BarCard from './BarCard';

interface BarListProps {
  bars: Bar[];
  selectedBar: Bar | null;
  hoveredBar: Bar | null;
  onBarSelect: (bar: Bar) => void;
  onBarHover: (bar: Bar | null) => void;
  searchQuery: string;
  selectedState: string | null;
  userLocation: { lat: number; lng: number } | null;
  barCrawlBars: Bar[];
  onToggleBarCrawl: (bar: Bar) => void;
  sortBy: 'alphabetical' | 'distance' | 'state';
}

// Calculate distance between two points in miles
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function BarList({
  bars,
  selectedBar,
  hoveredBar,
  onBarSelect,
  onBarHover,
  searchQuery,
  selectedState,
  userLocation,
  barCrawlBars,
  onToggleBarCrawl,
  sortBy,
}: BarListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Calculate distances and filter/sort bars
  const processedBars = useMemo(() => {
    let filteredBars = bars.map(bar => ({
      ...bar,
      distance: userLocation && bar.coordinates.lat && bar.coordinates.lng
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            bar.coordinates.lat,
            bar.coordinates.lng
          )
        : null,
    }));

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

    // Sort
    if (sortBy === 'distance' && userLocation) {
      filteredBars.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else if (sortBy === 'alphabetical') {
      filteredBars.sort((a, b) => a.name.localeCompare(b.name));
    }
    // 'state' sorting is handled by grouping below

    return filteredBars;
  }, [bars, searchQuery, selectedState, userLocation, sortBy]);

  // Group by state if sorting by state
  const groupedBars = useMemo(() => {
    if (sortBy !== 'state') {
      return [['All', processedBars] as [string, typeof processedBars]];
    }

    const grouped: Record<string, typeof processedBars> = {};
    processedBars.forEach(bar => {
      if (!grouped[bar.state]) {
        grouped[bar.state] = [];
      }
      grouped[bar.state].push(bar);
    });

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [processedBars, sortBy]);

  const totalCount = processedBars.length;

  // Scroll to selected bar
  useEffect(() => {
    if (selectedBar && selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedBar]);

  return (
    <div ref={listRef} className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">
            {totalCount} {totalCount === 1 ? 'Bar' : 'Bars'}
            {selectedState && <span className="text-gray-500 font-normal"> in {selectedState}</span>}
          </p>
          {userLocation && sortBy === 'distance' && (
            <span className="text-xs text-wa-red font-medium">Sorted by distance</span>
          )}
        </div>
      </div>

      {/* List */}
      <div className="p-4">
        {totalCount === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 font-medium">No bars found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedBars.map(([state, stateBars]) => (
              <div key={state}>
                {sortBy === 'state' && (
                  <h3 className="text-xs uppercase tracking-widest text-wa-red font-bold mb-3 sticky top-14 bg-gray-50/95 backdrop-blur-sm py-2 z-[5]">
                    {state} ({stateBars.length})
                  </h3>
                )}
                <div className="grid gap-3">
                  {stateBars.map((bar, index) => {
                    const isInCrawl = barCrawlBars.some(b => b.id === bar.id);
                    const crawlIndex = isInCrawl
                      ? barCrawlBars.findIndex(b => b.id === bar.id) + 1
                      : undefined;

                    return (
                      <div
                        key={bar.id}
                        ref={selectedBar?.id === bar.id ? selectedRef : undefined}
                      >
                        <BarCard
                          bar={bar}
                          index={index}
                          isSelected={selectedBar?.id === bar.id}
                          isHovered={hoveredBar?.id === bar.id}
                          distance={bar.distance}
                          isInCrawl={isInCrawl}
                          crawlIndex={crawlIndex}
                          onSelect={() => onBarSelect(bar)}
                          onHover={(hovered) => onBarHover(hovered ? bar : null)}
                          onToggleCrawl={() => onToggleBarCrawl(bar)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
