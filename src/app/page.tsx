'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  Header,
  VideoHero,
  BarList,
  StateFilter,
  CocktailSection,
  OdeSection,
  SponsorsSection,
  Footer,
} from '@/components';
import { useBars } from '@/hooks/useBars';
import { cocktails } from '@/data/cocktails';
import { Bar, ViewMode } from '@/types';

// Dynamically import Map to avoid SSR issues with Mapbox
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-400 flex flex-col items-center gap-2">
        <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Loading map...</span>
      </div>
    </div>
  ),
});

type SortOption = 'alphabetical' | 'distance' | 'state';

export default function Home() {
  const { bars, loading, error } = useBars();
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [hoveredBar, setHoveredBar] = useState<Bar | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [barCrawlBars, setBarCrawlBars] = useState<Bar[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showBarCrawlPanel, setShowBarCrawlPanel] = useState(false);

  const barCount = useMemo(() => {
    if (selectedState) {
      return bars.filter(bar => bar.state === selectedState).length;
    }
    return bars.length;
  }, [bars, selectedState]);

  // Get user location
  const handleGetLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setSortBy('distance');
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Toggle bar in crawl
  const handleToggleBarCrawl = useCallback((bar: Bar) => {
    setBarCrawlBars((prev) => {
      const isInCrawl = prev.some((b) => b.id === bar.id);
      if (isInCrawl) {
        return prev.filter((b) => b.id !== bar.id);
      } else {
        return [...prev, bar];
      }
    });
  }, []);

  // Clear bar crawl
  const handleClearBarCrawl = useCallback(() => {
    setBarCrawlBars([]);
  }, []);

  // Show bar crawl panel when bars are added
  useEffect(() => {
    if (barCrawlBars.length > 0) {
      setShowBarCrawlPanel(true);
    }
  }, [barCrawlBars.length]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Video Hero Section */}
        <VideoHero
          videos={[
            '/videos/hero/hero-1.mp4',
            '/videos/hero/hero-2.mp4',
            '/videos/hero/hero-3.mp4',
          ]}
          interval={15000}
        >
          <div className="text-center text-white px-4 max-w-4xl mx-auto">
            <div className="mb-6">
              <Image
                src="/images/logos/wa-white.jpg"
                alt="Whisky Advocate"
                width={200}
                height={60}
                className="mx-auto opacity-90"
              />
            </div>
            <h1 className="text-hero-sm md:text-hero font-serif font-bold mb-6 drop-shadow-lg">
              America's Top Whisky Bars
            </h1>
            <p className="text-xl md:text-2xl font-light mb-2 drop-shadow-md">
              2025 Edition
            </p>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto drop-shadow-md">
              Celebrating {bars.length || '250+'} remarkable venues setting the standard for whisky culture nationwide
            </p>
            <div className="mt-8">
              <a
                href="#explore"
                className="inline-flex items-center gap-2 bg-wa-red hover:bg-wa-red-dark text-white px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors"
              >
                Explore the List
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </div>
          </div>
        </VideoHero>

        {/* Intro Section */}
        <section className="bg-white py-16 lg:py-24" id="explore">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-gray-900 mb-6">
              Where Exceptional Whisky Meets True Hospitality
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              America's Top Whisky Bars honors the places where exceptional whisky, true
              hospitality, and atmosphere converge. Each featured bar reflects the artistry
              of its beverage program, the warmth of its service, and the authenticity of
              its setting. From rare bottles and inventive cocktails to rooms that invite
              connection, this year's edition celebrates the remarkable venues setting the
              standard for whisky culture nationwide.
            </p>
          </div>
        </section>

        {/* Interactive Map & List Section */}
        <section className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Section Header */}
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl text-gray-900 mb-4">
                Explore the Bars
              </h2>
              <p className="text-gray-600">
                Browse {bars.length || '250+'} of America's finest whisky establishments
              </p>
            </div>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search bars by name, city, or state..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wa-red focus:border-transparent text-lg"
                />
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              {/* Near Me Button */}
              <button
                onClick={handleGetLocation}
                className={`filter-pill flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  userLocation
                    ? 'bg-wa-red text-white border-wa-red'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-wa-red'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {userLocation ? 'Near Me' : 'Find Near Me'}
              </button>

              {/* Heatmap Toggle */}
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`filter-pill flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  showHeatmap
                    ? 'bg-wa-red text-white border-wa-red'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-wa-red'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                Density View
              </button>

              {/* Bar Crawl Button */}
              <button
                onClick={() => setShowBarCrawlPanel(!showBarCrawlPanel)}
                className={`filter-pill flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  barCrawlBars.length > 0
                    ? 'bg-wa-red text-white border-wa-red'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-wa-red'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Bar Crawl {barCrawlBars.length > 0 && `(${barCrawlBars.length})`}
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-wa-red focus:border-transparent cursor-pointer"
                >
                  <option value="alphabetical">A-Z</option>
                  <option value="distance" disabled={!userLocation}>By Distance</option>
                  <option value="state">By State</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* State Filter */}
            <div className="mb-8">
              <p className="text-sm font-semibold text-gray-700 mb-3 text-center">Filter by State:</p>
              <div className="max-h-24 overflow-y-auto flex justify-center">
                <div className="inline-block">
                  <StateFilter
                    bars={bars}
                    selectedState={selectedState}
                    onStateSelect={setSelectedState}
                  />
                </div>
              </div>
            </div>

            {/* Mobile View Toggle */}
            <div className="lg:hidden flex gap-2 mb-6 max-w-md mx-auto">
              <button
                onClick={() => setViewMode('map')}
                className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg border transition-all ${
                  viewMode === 'map'
                    ? 'bg-wa-red text-white border-wa-red'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-wa-red'
                }`}
              >
                Map View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg border transition-all ${
                  viewMode === 'list'
                    ? 'bg-wa-red text-white border-wa-red'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-wa-red'
                }`}
              >
                List View
              </button>
            </div>
          </div>

          {/* Map and List Grid */}
          <div className="max-w-7xl mx-auto relative">
            <div className="grid lg:grid-cols-2 min-h-[600px]">
              {/* Map (mobile - conditional) */}
              <div
                className={`lg:hidden ${viewMode === 'map' ? 'block' : 'hidden'} h-[450px]`}
              >
                {!loading && !error && (
                  <Map
                    bars={bars}
                    selectedBar={selectedBar}
                    hoveredBar={hoveredBar}
                    onBarSelect={setSelectedBar}
                    onBarHover={setHoveredBar}
                    selectedState={selectedState}
                    userLocation={userLocation}
                    showHeatmap={showHeatmap}
                    barCrawlBars={barCrawlBars}
                  />
                )}
              </div>

              {/* Bar List */}
              <div
                className={`lg:block ${viewMode === 'list' ? 'block' : 'hidden lg:block'} h-[600px] lg:h-[700px] overflow-hidden`}
              >
                {loading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-gray-200 animate-pulse h-32 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <BarList
                    bars={bars}
                    selectedBar={selectedBar}
                    hoveredBar={hoveredBar}
                    onBarSelect={setSelectedBar}
                    onBarHover={setHoveredBar}
                    searchQuery={searchQuery}
                    selectedState={selectedState}
                    userLocation={userLocation}
                    barCrawlBars={barCrawlBars}
                    onToggleBarCrawl={handleToggleBarCrawl}
                    sortBy={sortBy}
                  />
                )}
              </div>

              {/* Map (desktop - in grid) */}
              <div className="hidden lg:block h-[700px] sticky top-[104px]">
                {loading ? (
                  <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                    <p className="text-gray-500">Loading map...</p>
                  </div>
                ) : error ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <p className="text-red-500">{error}</p>
                  </div>
                ) : (
                  <Map
                    bars={bars}
                    selectedBar={selectedBar}
                    hoveredBar={hoveredBar}
                    onBarSelect={setSelectedBar}
                    onBarHover={setHoveredBar}
                    selectedState={selectedState}
                    userLocation={userLocation}
                    showHeatmap={showHeatmap}
                    barCrawlBars={barCrawlBars}
                  />
                )}
              </div>
            </div>

            {/* Bar Crawl Panel */}
            {showBarCrawlPanel && barCrawlBars.length > 0 && (
              <div className="bar-crawl-panel fixed bottom-4 right-4 lg:absolute lg:bottom-4 lg:right-4 w-80 max-h-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                <div className="bg-wa-red text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="font-semibold">My Bar Crawl</span>
                  </div>
                  <button
                    onClick={() => setShowBarCrawlPanel(false)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  {barCrawlBars.map((bar, index) => (
                    <div
                      key={bar.id}
                      className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-wa-red text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{bar.name}</p>
                        <p className="text-xs text-gray-500 truncate">{bar.address}</p>
                      </div>
                      <button
                        onClick={() => handleToggleBarCrawl(bar)}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-wa-red transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearBarCrawl}
                      className="flex-1 py-2 px-3 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      className="flex-1 py-2 px-3 text-sm font-medium text-white bg-wa-red rounded-lg hover:bg-wa-red-dark transition-colors flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Ode Section */}
        <OdeSection />

        {/* Cocktails Section */}
        <CocktailSection cocktails={cocktails} />

        {/* Sponsors Section */}
        <SponsorsSection />
      </main>

      <Footer />
    </div>
  );
}
