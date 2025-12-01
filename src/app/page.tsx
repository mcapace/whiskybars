'use client';

import { useState, useMemo } from 'react';
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
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 min-h-[600px]">
              {/* Map (mobile - conditional) */}
              <div
                className={`lg:hidden ${viewMode === 'map' ? 'block' : 'hidden'} h-[450px]`}
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
                className={`lg:block ${viewMode === 'list' ? 'block' : 'hidden lg:block'} h-[600px] lg:h-[700px] overflow-hidden`}
              >
                {loading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-gray-200 animate-pulse h-24 rounded-lg" />
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
