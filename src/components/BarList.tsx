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
  const firstStateBarRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Sort bars within each state
    if (sortBy === 'distance' && userLocation) {
      filteredBars.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else {
      // Default to alphabetical by name
      filteredBars.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filteredBars;
  }, [bars, searchQuery, selectedState, userLocation, sortBy]);

  // Always group by state in alphabetical order
  const groupedBars = useMemo(() => {
    const grouped: Record<string, typeof processedBars> = {};
    processedBars.forEach(bar => {
      if (!grouped[bar.state]) {
        grouped[bar.state] = [];
      }
      grouped[bar.state].push(bar);
    });

    // Sort states alphabetically
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [processedBars]);

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

  // Scroll to first bar when state is selected
  useEffect(() => {
    if (selectedState && firstStateBarRef.current && listRef.current) {
      setTimeout(() => {
        firstStateBarRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [selectedState]);

  // Intersection Observer to detect which bar is in view and update map
  useEffect(() => {
    if (!listRef.current) return;

    const observerOptions = {
      root: listRef.current,
      rootMargin: '-20% 0px -60% 0px', // Trigger when bar is in upper 40% of viewport
      threshold: 0.5,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      // Don't update if user is actively scrolling (to avoid janky map movements)
      if (isScrollingRef.current) return;

      // Find the bar that's most visible
      let mostVisibleBar: Bar | null = null;
      let maxRatio = 0;

      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          const barId = parseInt(entry.target.getAttribute('data-bar-id') || '0');
          const foundBar = processedBars.find(b => b.id === barId) as Bar | undefined;
          if (foundBar) {
            mostVisibleBar = foundBar;
            maxRatio = entry.intersectionRatio;
          }
        }
      });

      // Update selected bar if we found a visible one and it's different
      if (mostVisibleBar !== null) {
        const barToSelect: Bar = mostVisibleBar;
        if (barToSelect.id !== selectedBar?.id) {
          onBarSelect(barToSelect);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Observe all bar cards
    barRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [processedBars, selectedBar, onBarSelect]);

  // Track scrolling state
  useEffect(() => {
    if (!listRef.current) return;

    const handleScroll = () => {
      isScrollingRef.current = true;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 150); // Wait 150ms after scroll stops before allowing updates
    };

    const listElement = listRef.current;
    listElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      listElement.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={listRef} className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-wa-cream via-white to-wa-cream backdrop-blur-sm px-6 py-4 border-b-2 border-wa-red/20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif font-bold text-wa-red">
                {totalCount}
              </span>
              <span className="text-lg font-semibold text-gray-700 uppercase tracking-wider">
                {totalCount === 1 ? 'Bar' : 'Bars'}
              </span>
            </div>
            {selectedState && (
              <span className="text-base text-gray-600 font-medium px-3 py-1 bg-white/80 rounded-full border border-wa-red/20">
                in {selectedState}
              </span>
            )}
          </div>
          {userLocation && sortBy === 'distance' && (
            <span className="text-sm text-wa-red font-semibold bg-wa-red/10 px-3 py-1.5 rounded-full">
              Sorted by distance
            </span>
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
            <p className="text-gray-400 text-base mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedBars.map(([state, stateBars], groupIndex) => {
              // Calculate starting index for this group
              const startIndex = groupedBars.slice(0, groupIndex).reduce((sum, [, bars]) => sum + bars.length, 0);
              
              return (
                <div key={state}>
                  <h3 className="text-sm uppercase tracking-widest text-wa-red font-bold mb-3 sticky top-14 bg-gray-50/95 backdrop-blur-sm py-2 z-[5]">
                    {state} ({stateBars.length})
                  </h3>
                  <div className="grid gap-3">
                    {stateBars.map((bar, localIndex) => {
                      const isInCrawl = barCrawlBars.some(b => b.id === bar.id);
                      const crawlIndex = isInCrawl
                        ? barCrawlBars.findIndex(b => b.id === bar.id) + 1
                        : undefined;
                      // Calculate overall position in the list
                      const overallIndex = startIndex + localIndex;
                      const isFirstBar = localIndex === 0 && selectedState;

                      return (
                        <div
                          key={bar.id}
                          data-bar-id={bar.id}
                          ref={(el) => {
                            if (el) {
                              barRefs.current.set(bar.id, el);
                              // Also set refs for selected/first bar
                              if (selectedBar?.id === bar.id) {
                                (selectedRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                              }
                              if (isFirstBar) {
                                (firstStateBarRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                              }
                            } else {
                              barRefs.current.delete(bar.id);
                            }
                          }}
                        >
                          <BarCard
                            bar={bar}
                            index={overallIndex}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
