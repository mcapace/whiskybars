'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Header,
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
    <div className="w-full h-full min-h-[400px] bg-gray-100 animate-pulse rounded-lg" />
  ),
});

export default function Home() {
  const { bars, loading, error } = useBars();
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  const barCount = useMemo(() => {
    if (selectedState) {
      return bars.filter(bar => bar.state === selectedState).length;
    }
    return bars.length;
  }, [bars, selectedState]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Content */}
              <div>
                <h1 className="font-serif text-4xl sm:text-5xl font-medium text-gray-900 mb-6 leading-tight">
                  America's Top Whisky Bars 2025
                </h1>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  America's Top Whisky Bars honors the places where exceptional whisky, true
                  hospitality, and atmosphere converge. Each featured bar reflects the artistry
                  of its beverage program, the warmth of its service, and the authenticity of
                  its setting. From rare bottles and inventive cocktails to rooms that invite
                  connection, this year's edition celebrates{' '}
                  <span className="font-semibold text-whisky-red">{bars.length || '250+'}</span>{' '}
                  remarkable venues setting the standard for whisky culture nationwide.
                </p>

                {/* Search */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search bars by name, city, or state..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="search-input w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* State Filter */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Filter by State:</p>
                  <div className="max-h-32 overflow-y-auto">
                    <StateFilter
                      bars={bars}
                      selectedState={selectedState}
                      onStateSelect={setSelectedState}
                    />
                  </div>
                </div>

                {/* Mobile View Toggle */}
                <div className="lg:hidden flex gap-2 mb-6">
                  <button
                    onClick={() => setViewMode('map')}
                    className={`view-toggle-btn flex-1 py-2 px-4 text-sm font-semibold rounded-lg border ${
                      viewMode === 'map'
                        ? 'bg-whisky-red text-white border-whisky-red'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Map View
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`view-toggle-btn flex-1 py-2 px-4 text-sm font-semibold rounded-lg border ${
                      viewMode === 'list'
                        ? 'bg-whisky-red text-white border-whisky-red'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    List View
                  </button>
                </div>
              </div>

              {/* Map (desktop) */}
              <div className="hidden lg:block h-[500px] rounded-lg overflow-hidden shadow-lg">
                {loading ? (
                  <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
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
                    onBarSelect={setSelectedBar}
                    selectedState={selectedState}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Map & List Section */}
        <section className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 min-h-[600px]">
              {/* Map (mobile - conditional) */}
              <div
                className={`lg:hidden ${viewMode === 'map' ? 'block' : 'hidden'} h-[400px]`}
              >
                {!loading && !error && (
                  <Map
                    bars={bars}
                    selectedBar={selectedBar}
                    onBarSelect={setSelectedBar}
                    selectedState={selectedState}
                  />
                )}
              </div>

              {/* Bar List */}
              <div
                className={`lg:block ${viewMode === 'list' ? 'block' : 'hidden lg:block'} h-[600px] lg:h-auto`}
              >
                {loading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="loading-skeleton h-24 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <BarList
                    bars={bars}
                    selectedBar={selectedBar}
                    onBarSelect={setSelectedBar}
                    searchQuery={searchQuery}
                    selectedState={selectedState}
                  />
                )}
              </div>

              {/* Map (desktop - in grid) */}
              <div className="hidden lg:block h-[600px] sticky top-16">
                {!loading && !error && (
                  <Map
                    bars={bars}
                    selectedBar={selectedBar}
                    onBarSelect={setSelectedBar}
                    selectedState={selectedState}
                  />
                )}
              </div>
            </div>
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
