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

// Get state abbreviation from full state name
function getStateAbbreviation(stateName: string): string {
  const STATE_TO_ABBR: Record<string, string> = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
    'Washington D.C.': 'DC', 'District of Columbia': 'DC',
    'Puerto Rico': 'PR',
  };
  
  // If already an abbreviation (2 letters), return as is
  if (stateName.length === 2 && stateName === stateName.toUpperCase()) {
    return stateName;
  }
  
  return STATE_TO_ABBR[stateName] || stateName.substring(0, 2).toUpperCase();
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
  const manualSelectRef = useRef(false); // Track manual selections to prevent intersection observer interference

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
    if (!listRef.current || processedBars.length === 0) return;

    const observerOptions = {
      root: listRef.current,
      rootMargin: '-20% 0px -60% 0px', // Trigger when bar is in upper 40% of viewport
      threshold: [0.1, 0.3, 0.5, 0.7, 0.9], // Multiple thresholds for better detection
    };

    let lastUpdateTime = 0;
    const UPDATE_THROTTLE = 300; // Throttle updates to every 300ms
    const visibleBars = new Map<number, number>(); // Track barId -> intersectionRatio

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      // Update visibility map
      entries.forEach(entry => {
        const barId = parseInt(entry.target.getAttribute('data-bar-id') || '0');
        if (entry.isIntersecting) {
          visibleBars.set(barId, entry.intersectionRatio);
        } else {
          visibleBars.delete(barId);
        }
      });

      // Don't update if user just manually selected a bar
      if (manualSelectRef.current) return;

      const now = Date.now();
      // Throttle updates
      if (now - lastUpdateTime < UPDATE_THROTTLE) return;

      // Find the bar that's most visible
      let mostVisibleBar: Bar | null = null;
      let maxRatio = 0;

      visibleBars.forEach((ratio, barId) => {
        if (ratio > maxRatio) {
          const foundBar = processedBars.find(b => b.id === barId);
          if (foundBar) {
            // TypeScript-safe assignment: processedBars items are Bar-compatible
            mostVisibleBar = foundBar as Bar;
            maxRatio = ratio;
          }
        }
      });

      // Update selected bar if we found a visible one and it's different
      // Use explicit type guard to help TypeScript
      const barToSelect: Bar | null = mostVisibleBar;
      if (barToSelect !== null) {
        if (barToSelect.id !== selectedBar?.id) {
          lastUpdateTime = now;
          onBarSelect(barToSelect);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Use setTimeout to ensure DOM is fully rendered before observing
    const timeoutId = setTimeout(() => {
      // Observe all bar cards
      barRefs.current.forEach((element) => {
        if (element) observer.observe(element);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      visibleBars.clear();
    };
  }, [processedBars, selectedBar, onBarSelect]);

  // Reset manual select flag after a delay when it's set
  useEffect(() => {
    if (manualSelectRef.current) {
      const timeoutId = setTimeout(() => {
        manualSelectRef.current = false;
      }, 1000); // Reset after 1 second
      return () => clearTimeout(timeoutId);
    }
  }, [selectedBar]);

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
      }, 100); // Reduced from 150ms to 100ms for faster response
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
                  <h3 className="text-sm uppercase tracking-widest text-wa-red font-bold mb-3 sticky top-14 bg-gray-50/95 backdrop-blur-sm py-2 z-[5] flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-wa-red/10 text-wa-red font-bold text-xs border border-wa-red/20">
                      {getStateAbbreviation(state)}
                    </span>
                    <span>{state} ({stateBars.length})</span>
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
                            onSelect={() => {
                              manualSelectRef.current = true; // Mark as manual selection
                              onBarSelect(bar);
                            }}
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
