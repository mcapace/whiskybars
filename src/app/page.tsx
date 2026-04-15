'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  Header,
  VideoHero,
  BarList,
  StateFilter,
  CocktailSection,
  SponsorsSection,
  Footer,
  ScrollProgress,
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
        <span className="text-base">Loading map...</span>
      </div>
    </div>
  ),
});

type SortOption = 'alphabetical' | 'distance' | 'state';

// Toast component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-md bg-gray-900 text-white px-6 py-3 rounded-xl shadow-xl z-50 flex items-center gap-3 safe-bottom safe-x">
      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {message}
    </div>
  );
}

export default function Home() {
  const { bars, loading, error } = useBars();
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [hoveredBar, setHoveredBar] = useState<Bar | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [focusedBarIndex, setFocusedBarIndex] = useState<number>(-1);

  // Filtered bars for keyboard navigation
  const filteredBars = useMemo(() => {
    if (!selectedState) return bars;
    return bars.filter(bar => bar.state === selectedState);
  }, [bars, selectedState]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedState = localStorage.getItem('whiskyBars_selectedState');
    const savedSort = localStorage.getItem('whiskyBars_sortBy');
    const savedDarkMode = localStorage.getItem('whiskyBars_darkMode');

    if (savedState && savedState !== 'null') setSelectedState(savedState);
    if (savedSort) setSortBy(savedSort as SortOption);
    if (savedDarkMode) setDarkMode(savedDarkMode === 'true');
  }, []);

  // When a bar is selected (e.g. from map marker click), show list on mobile so the bar's info is visible
  useEffect(() => {
    if (typeof window === 'undefined' || !selectedBar) return;
    if (window.matchMedia('(max-width: 1023px)').matches) setViewMode('list');
  }, [selectedBar]);

  // When user changes state filter (after initial load): clear selected bar so list shows state section and map shows only markers (no popups)
  const isInitialStateMount = useRef(true);
  useEffect(() => {
    if (isInitialStateMount.current) {
      isInitialStateMount.current = false;
      return;
    }
    setSelectedBar(null);
  }, [selectedState]);

  // Save preferences to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('whiskyBars_selectedState', selectedState || 'null');
  }, [selectedState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('whiskyBars_sortBy', sortBy);
  }, [sortBy]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('whiskyBars_darkMode', String(darkMode));
  }, [darkMode]);

  // URL deep linking - read query params on mount
  useEffect(() => {
    if (typeof window === 'undefined' || bars.length === 0) return;

    const params = new URLSearchParams(window.location.search);

    // Read bar ID from URL
    const barId = params.get('bar');
    if (barId) {
      const bar = bars.find(b => b.id === parseInt(barId));
      if (bar) setSelectedBar(bar);
    }

    // Read state filter from URL
    const state = params.get('state');
    if (state) setSelectedState(state);
  }, [bars]);

  // URL deep linking - update URL when selection changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();

    if (selectedBar) params.set('bar', selectedBar.id.toString());
    if (selectedState) params.set('state', selectedState);

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, [selectedBar, selectedState]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          setFocusedBarIndex(prev => Math.min(prev + 1, filteredBars.length - 1));
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          setFocusedBarIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedBarIndex >= 0 && focusedBarIndex < filteredBars.length) {
            setSelectedBar(filteredBars[focusedBarIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setSelectedBar(null);
          setFocusedBarIndex(-1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredBars, focusedBarIndex]);

  // Update hovered bar when focused index changes
  useEffect(() => {
    if (focusedBarIndex >= 0 && focusedBarIndex < filteredBars.length) {
      setHoveredBar(filteredBars[focusedBarIndex]);
    }
  }, [focusedBarIndex, filteredBars]);

  const barCount = useMemo(() => {
    return selectedState ? bars.filter(bar => bar.state === selectedState).length : bars.length;
  }, [bars, selectedState]);

  // Get user location
  const handleGetLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setSortBy('distance');
          setToast('Location found! Bars sorted by distance.');
        },
        () => setToast('Unable to get your location. Please enable location services.'),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Random bar discovery - "Surprise Me"
  const handleRandomBar = useCallback(() => {
    const availableBars = selectedState
      ? bars.filter(bar => bar.state === selectedState)
      : bars;
    if (availableBars.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableBars.length);
      setSelectedBar(availableBars[randomIndex]);
      setToast(`Discovered: ${availableBars[randomIndex].name}!`);
    }
  }, [bars, selectedState]);

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark-mode bg-gray-900' : 'bg-white'}`}>
      <ScrollProgress />
      <Header />

      <main className="flex-1">
        {/* Video Hero Section */}
        <VideoHero>
          <div className="text-center text-white px-4 max-w-4xl mx-auto">
            <div className="mb-6">
              <Image src="/images/logos/wa-white.png" alt="Whisky Advocate" width={280} height={84} className="mx-auto opacity-90" />
            </div>
            <h1 className="text-hero-sm md:text-hero font-serif font-bold mb-6 drop-shadow-lg">
              America's Top Whisky Bars
            </h1>
            <p className="text-xl md:text-2xl font-light mb-2 drop-shadow-md">2026 Edition</p>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto drop-shadow-md">
              Celebrating {bars.length >= 150 ? '150+' : bars.length || '150+'} remarkable venues setting the standard<br className="hidden sm:block" /> for whisky culture across the nation
            </p>
            <div className="mt-8">
              <a href="#explore" className="inline-flex items-center justify-center gap-2 min-h-[48px] bg-wa-red hover:bg-wa-red-dark text-white px-8 py-4 text-base font-bold uppercase tracking-wider transition-colors touch-manifest rounded-lg">
                Explore the List
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </div>
          </div>
        </VideoHero>

        {/* Intro Section */}
        <section className={`py-16 lg:py-24 ${darkMode ? 'bg-gray-900' : 'bg-white'}`} id="explore">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className={`font-serif text-3xl md:text-4xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Where Exceptional Whisky Meets True Hospitality
            </h2>
            <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              America&apos;s Top Whisky Bars honors the places where exceptional whisky,<br className="hidden sm:block" /> true hospitality, and atmosphere converge. Each featured bar reflects the artistry<br className="hidden sm:block" /> of its beverage program, the warmth of its service, and the authenticity of its setting.{' '}
              Think your favorite bar would be included next?{' '}
              <a
                href="https://whiskyadvocate.com/bars"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-wa-red underline underline-offset-2 hover:text-wa-red-dark"
              >
                Let us know here!
              </a>
            </p>
          </div>
        </section>

        {/* Interactive Map & List Section - mobile-optimized */}
        <section className={`border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} safe-x`} id="explore-bars">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            {/* Section Header */}
            <div className="text-center mb-6 lg:mb-10">
              <h2 className={`font-serif text-2xl sm:text-3xl mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Explore the Bars</h2>
            </div>

            {/* State Filter */}
            <div className="mb-6 lg:mb-8">
              <StateFilter bars={bars} selectedState={selectedState} onStateSelect={setSelectedState} />
            </div>

            {/* Mobile: sticky Map/List toggle - always visible when scrolling this section */}
            <div className={`lg:hidden sticky top-16 z-20 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 ${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'} mb-4 lg:border-0 lg:static lg:mb-6`}>
              <div className="flex gap-2 max-w-md mx-auto">
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex-1 min-h-[48px] py-3 px-4 text-base font-semibold rounded-xl border-2 transition-all touch-manifest ${viewMode === 'map' ? 'bg-wa-red text-white border-wa-red' : darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}
                >
                  Map
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 min-h-[48px] py-3 px-4 text-base font-semibold rounded-xl border-2 transition-all touch-manifest ${viewMode === 'list' ? 'bg-wa-red text-white border-wa-red' : darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Map and List Grid */}
          <div className="max-w-7xl mx-auto relative">
            <div className="grid lg:grid-cols-3 min-h-[400px] lg:min-h-[600px]">
              {/* Bar List - 1/3 width; on mobile full height when list view */}
              <div className={`lg:col-span-1 lg:block ${viewMode === 'list' ? 'block' : 'hidden lg:block'} min-h-[60dvh] lg:min-h-0 h-[70dvh] lg:h-[700px] overflow-hidden`}>
                {loading ? (
                  <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <div key={i} className={`animate-pulse h-32 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />)}</div>
                ) : (
                  <BarList bars={bars} selectedBar={selectedBar} hoveredBar={hoveredBar} onBarSelect={setSelectedBar} onBarHover={setHoveredBar} selectedState={selectedState} userLocation={userLocation} sortBy={sortBy} />
                )}
              </div>

              {/* Map (desktop) - 2/3 width */}
              <div className="lg:col-span-2 hidden lg:block h-[700px] sticky top-[104px]">
                {loading ? (
                  <div className={`w-full h-full animate-pulse flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}><p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading map...</p></div>
                ) : error ? (
                  <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}><p className="text-red-500">{error}</p></div>
                ) : (
                  <Map bars={bars} selectedBar={selectedBar} hoveredBar={hoveredBar} onBarSelect={setSelectedBar} onBarHover={setHoveredBar} selectedState={selectedState} userLocation={userLocation} showHeatmap={showHeatmap} darkMode={darkMode} />
                )}
              </div>

              {/* Map (mobile) - taller for easier pan/zoom */}
              <div className={`lg:hidden ${viewMode === 'map' ? 'block' : 'hidden'} min-h-[55dvh] h-[55dvh] rounded-b-xl overflow-hidden`}>
                {!loading && !error && <Map bars={bars} selectedBar={selectedBar} hoveredBar={hoveredBar} onBarSelect={setSelectedBar} onBarHover={setHoveredBar} selectedState={selectedState} userLocation={userLocation} showHeatmap={showHeatmap} darkMode={darkMode} />}
              </div>
            </div>
          </div>
        </section>

        <CocktailSection cocktails={cocktails} />
        <SponsorsSection />
      </main>

      <Footer />

      {/* Toast Notification */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
