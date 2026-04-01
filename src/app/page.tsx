'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// Scroll reveal hook
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    document.querySelectorAll('.reveal, .reveal-scale').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
}
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
    <div className="w-full h-full min-h-[400px] bg-slate-200/90 animate-pulse rounded-2xl flex items-center justify-center border border-slate-300/60">
      <div className="text-[var(--apex-muted)] flex flex-col items-center gap-2 font-mono text-sm">
        <svg className="w-10 h-10 animate-spin text-apex-cyan" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading map…</span>
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

  // Initialize scroll reveal animations
  useScrollReveal();

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
    <div className={`noise-overlay site-apex min-h-screen flex flex-col ${darkMode ? 'dark-mode' : ''}`}>
      <ScrollProgress />
      <Header />

      <main className="flex-1">
        {/* Video Hero Section */}
        <VideoHero>
          <div className="text-center text-white px-4 max-w-4xl mx-auto">
            <div className="mb-8 hero-text-reveal">
              <Image src="/images/logos/wa-white.png" alt="Whisky Advocate" width={280} height={84} className="mx-auto opacity-95 drop-shadow-[0_0_40px_rgba(46,196,182,0.25)]" />
            </div>
            <p className="hero-text-reveal font-mono text-[11px] md:text-xs tracking-[0.35em] text-teal-200/90 uppercase mb-4">
              Field guide · nationwide index
            </p>
            <div className="hero-line-reveal h-px bg-gradient-to-r from-transparent via-teal-300/50 to-transparent mx-auto mb-8" />
            <h1 className="text-hero-sm md:text-hero font-serif font-semibold mb-6 drop-shadow-[0_4px_32px_rgba(0,0,0,0.6)] hero-text-reveal-delay-1 tracking-tight">
              America&apos;s Top Whisky Bars
            </h1>
            <p className="text-xl md:text-2xl font-light mb-2 drop-shadow-md hero-text-reveal-delay-2 tracking-[0.2em] uppercase text-white/75 font-mono text-base md:text-lg">
              2026 · Edition
            </p>
            <p className="text-lg md:text-xl text-slate-300/90 max-w-2xl mx-auto drop-shadow-md hero-text-reveal-delay-3 leading-relaxed">
              Celebrating {bars.length >= 150 ? '150+' : bars.length || '150+'} remarkable venues setting the standard<br className="hidden sm:block" /> for whisky culture across the nation
            </p>
            <div className="mt-10 hero-text-reveal-delay-4">
              <a href="#explore" className="apex-hero-cta group inline-flex items-center justify-center gap-2.5 min-h-[48px] text-white px-10 py-4 text-xs transition-all duration-300 touch-manifest">
                Explore the index
                <svg className="w-4 h-4 transition-transform group-hover:translate-y-0.5 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </div>
          </div>
        </VideoHero>

        {/* Intro Section */}
        <section className="py-20 lg:py-32 gradient-mesh-warm relative" id="explore">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="reveal font-mono text-[10px] md:text-xs tracking-[0.28em] uppercase text-apex-cyan/90 mb-6">
              Editorial
            </p>
            <h2 className="reveal font-serif text-3xl md:text-5xl md:font-medium mb-8 leading-tight text-[var(--apex-ink)]">
              Where Exceptional Whisky Meets True Hospitality
            </h2>
            <div className="reveal reveal-delay-1 section-divider w-24 mx-auto mb-8" />
            <p className="reveal reveal-delay-2 text-lg md:text-xl leading-relaxed text-[var(--apex-muted)]">
              America&apos;s Top Whisky Bars honors the places where exceptional whisky,
              true hospitality, and atmosphere converge. Each featured bar reflects the artistry
              of its beverage program, the warmth of its service, and the authenticity of its setting.
            </p>
          </div>
        </section>

        {/* Interactive Map & List Section - mobile-optimized */}
        <section className="gradient-mesh-section safe-x relative border-y border-[var(--apex-line)]" id="explore-bars">
          <div className="section-divider opacity-60" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
            {/* Section Header */}
            <div className="text-center mb-8 lg:mb-12">
              <p className="reveal font-mono text-[10px] tracking-[0.25em] uppercase text-apex-cyan/80 mb-3">
                Interactive atlas
              </p>
              <h2 className="reveal font-serif text-2xl sm:text-4xl md:font-medium mb-3 text-[var(--apex-ink)]">Explore the Bars</h2>
              <p className="reveal reveal-delay-1 text-[var(--apex-muted)] text-base">Discover your next favorite spot</p>
            </div>

            {/* State Filter */}
            <div className="mb-6 lg:mb-8">
              <StateFilter bars={bars} selectedState={selectedState} onStateSelect={setSelectedState} />
            </div>

            {/* Mobile: modern toggle */}
            <div className="lg:hidden sticky top-16 z-20 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 bg-[var(--apex-surface)]/85 backdrop-blur-xl border-b border-[var(--apex-line)] mb-4 lg:border-0 lg:static lg:mb-6">
              <div className="modern-toggle flex gap-1 max-w-xs mx-auto">
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex-1 min-h-[44px] py-2.5 px-4 transition-all touch-manifest modern-toggle-btn ${viewMode === 'map' ? 'modern-toggle-btn-active' : 'text-[var(--apex-muted)]'}`}
                >
                  Map
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 min-h-[44px] py-2.5 px-4 transition-all touch-manifest modern-toggle-btn ${viewMode === 'list' ? 'modern-toggle-btn-active' : 'text-[var(--apex-muted)]'}`}
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
                  <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <div key={i} className={`animate-pulse h-32 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-[var(--apex-line)]'}`} />)}</div>
                ) : (
                  <BarList bars={bars} selectedBar={selectedBar} hoveredBar={hoveredBar} onBarSelect={setSelectedBar} onBarHover={setHoveredBar} selectedState={selectedState} userLocation={userLocation} sortBy={sortBy} darkMode={darkMode} />
                )}
              </div>

              {/* Map (desktop) - 2/3 width */}
              <div className="lg:col-span-2 hidden lg:block h-[700px] sticky top-[104px] modern-map-container">
                {loading ? (
                  <div className={`w-full h-full animate-pulse flex items-center justify-center rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-[var(--apex-line)]'}`}><p className="font-mono text-sm text-[var(--apex-muted)]">Loading map…</p></div>
                ) : error ? (
                  <div className={`w-full h-full flex items-center justify-center rounded-2xl ${darkMode ? 'bg-slate-900' : 'bg-[var(--apex-line)]'}`}><p className="text-red-500">{error}</p></div>
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

        <CocktailSection cocktails={cocktails} darkMode={darkMode} />
        <SponsorsSection darkMode={darkMode} />
      </main>

      <Footer />

      {/* Toast Notification */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
