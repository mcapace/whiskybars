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

// Toast component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3">
      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {message}
    </div>
  );
}

// Share Modal component
function ShareModal({ url, onClose }: { url: string; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="share-modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="share-modal bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-semibold text-gray-900">Share Bar Crawl</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">Share this link with friends to show them your bar crawl route:</p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={url}
            readOnly
            className="share-link-input flex-1"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-wa-red text-white rounded-lg font-medium hover:bg-wa-red-dark transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [darkMode, setDarkMode] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [focusedBarIndex, setFocusedBarIndex] = useState<number>(-1);

  // Filtered bars for keyboard navigation
  const filteredBars = useMemo(() => {
    let result = bars;
    if (selectedState) {
      result = result.filter(bar => bar.state === selectedState);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(bar =>
        bar.name.toLowerCase().includes(query) ||
        bar.address.toLowerCase().includes(query) ||
        bar.state.toLowerCase().includes(query)
      );
    }
    return result;
  }, [bars, selectedState, searchQuery]);

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

    // Read bar crawl from URL
    const crawlIds = params.get('crawl');
    if (crawlIds) {
      const ids = crawlIds.split(',').map(id => parseInt(id));
      const crawlBars = ids.map(id => bars.find(b => b.id === id)).filter(Boolean) as Bar[];
      if (crawlBars.length > 0) {
        setBarCrawlBars(crawlBars);
        setShowBarCrawlPanel(true);
      }
    }
  }, [bars]);

  // URL deep linking - update URL when selection changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();

    if (selectedBar) params.set('bar', selectedBar.id.toString());
    if (selectedState) params.set('state', selectedState);
    if (barCrawlBars.length > 0) params.set('crawl', barCrawlBars.map(b => b.id).join(','));

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, [selectedBar, selectedState, barCrawlBars]);

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
        case '/':
          e.preventDefault();
          document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
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

  // Toggle bar in crawl
  const handleToggleBarCrawl = useCallback((bar: Bar) => {
    setBarCrawlBars(prev => {
      const isInCrawl = prev.some(b => b.id === bar.id);
      return isInCrawl ? prev.filter(b => b.id !== bar.id) : [...prev, bar];
    });
  }, []);

  // Clear bar crawl
  const handleClearBarCrawl = useCallback(() => setBarCrawlBars([]), []);

  // Share bar crawl
  const handleShareBarCrawl = useCallback(() => {
    if (barCrawlBars.length > 0) setShowShareModal(true);
  }, [barCrawlBars]);

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

  // Calculate bar crawl total distance
  const barCrawlDistance = useMemo(() => {
    if (barCrawlBars.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < barCrawlBars.length - 1; i++) {
      const bar1 = barCrawlBars[i];
      const bar2 = barCrawlBars[i + 1];
      if (bar1.coordinates.lat && bar1.coordinates.lng && bar2.coordinates.lat && bar2.coordinates.lng) {
        const R = 3959;
        const dLat = (bar2.coordinates.lat - bar1.coordinates.lat) * (Math.PI / 180);
        const dLng = (bar2.coordinates.lng - bar1.coordinates.lng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(bar1.coordinates.lat * (Math.PI / 180)) *
          Math.cos(bar2.coordinates.lat * (Math.PI / 180)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        total += R * c;
      }
    }
    return total;
  }, [barCrawlBars]);

  // Get share URL
  const getShareUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (barCrawlBars.length > 0) params.set('crawl', barCrawlBars.map(b => b.id).join(','));
    return `${typeof window !== 'undefined' ? window.location.origin : ''}${typeof window !== 'undefined' ? window.location.pathname : ''}?${params.toString()}`;
  }, [barCrawlBars]);

  // Show bar crawl panel when bars are added
  useEffect(() => {
    if (barCrawlBars.length > 0) setShowBarCrawlPanel(true);
  }, [barCrawlBars.length]);

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark-mode bg-gray-900' : 'bg-white'}`}>
      <Header />

      <main className="flex-1">
        {/* Video Hero Section */}
        <VideoHero
          videos={['/videos/hero/hero-1.mp4', '/videos/hero/hero-2.mp4', '/videos/hero/hero-3.mp4']}
          interval={15000}
        >
          <div className="text-center text-white px-4 max-w-4xl mx-auto">
            <div className="mb-6">
              <Image src="/images/logos/wa-white.png" alt="Whisky Advocate" width={200} height={60} className="mx-auto opacity-90" />
            </div>
            <h1 className="text-hero-sm md:text-hero font-serif font-bold mb-6 drop-shadow-lg">
              America's Top Whisky Bars
            </h1>
            <p className="text-xl md:text-2xl font-light mb-2 drop-shadow-md">2025 Edition</p>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto drop-shadow-md">
              Celebrating {bars.length || '250+'} remarkable venues setting the standard for whisky culture nationwide
            </p>
            <div className="mt-8">
              <a href="#explore" className="inline-flex items-center gap-2 bg-wa-red hover:bg-wa-red-dark text-white px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors">
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
              America's Top Whisky Bars honors the places where exceptional whisky, true hospitality, and atmosphere converge. Each featured bar reflects the artistry of its beverage program, the warmth of its service, and the authenticity of its setting.
            </p>
          </div>
        </section>

        {/* Interactive Map & List Section */}
        <section className={`border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Section Header */}
            <div className="text-center mb-10">
              <h2 className={`font-serif text-3xl mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Explore the Bars</h2>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Browse {bars.length || '250+'} of America's finest whisky establishments
              </p>
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <kbd className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-mono">↓</kbd> navigate · <kbd className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-mono">Enter</kbd> select · <kbd className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-mono">/</kbd> search
              </p>
            </div>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search bars by name, city, or state..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-wa-red focus:border-transparent ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button onClick={handleGetLocation} className={`filter-pill flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${userLocation ? 'bg-wa-red text-white border-wa-red' : darkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:border-wa-red' : 'bg-white text-gray-700 border-gray-300 hover:border-wa-red'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {userLocation ? 'Near Me' : 'Find Near Me'}
              </button>

              <button onClick={() => setShowHeatmap(!showHeatmap)} className={`filter-pill flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${showHeatmap ? 'bg-wa-red text-white border-wa-red' : darkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:border-wa-red' : 'bg-white text-gray-700 border-gray-300 hover:border-wa-red'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
                Density View
              </button>

              <button onClick={() => setShowBarCrawlPanel(!showBarCrawlPanel)} className={`filter-pill flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${barCrawlBars.length > 0 ? 'bg-wa-red text-white border-wa-red' : darkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:border-wa-red' : 'bg-white text-gray-700 border-gray-300 hover:border-wa-red'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                Bar Crawl {barCrawlBars.length > 0 && `(${barCrawlBars.length})`}
              </button>

              <button onClick={() => setDarkMode(!darkMode)} className={`filter-pill flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                {darkMode ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                {darkMode ? 'Light' : 'Dark'}
              </button>

              {/* Surprise Me - Random Bar Discovery */}
              <button onClick={handleRandomBar} className={`filter-pill flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all bg-gradient-to-r from-wa-gold to-amber-500 text-white border-wa-gold hover:shadow-lg hover:scale-105`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Surprise Me!
              </button>

              <div className="relative">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className={`appearance-none border rounded-full px-4 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-wa-red cursor-pointer ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}>
                  <option value="alphabetical">A-Z</option>
                  <option value="distance" disabled={!userLocation}>By Distance</option>
                  <option value="state">By State</option>
                </select>
                <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* State Filter */}
            <div className="mb-8">
              <StateFilter bars={bars} selectedState={selectedState} onStateSelect={setSelectedState} />
            </div>

            {/* Mobile View Toggle */}
            <div className="lg:hidden flex gap-2 mb-6 max-w-md mx-auto">
              <button onClick={() => setViewMode('map')} className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg border transition-all ${viewMode === 'map' ? 'bg-wa-red text-white border-wa-red' : darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}>Map View</button>
              <button onClick={() => setViewMode('list')} className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg border transition-all ${viewMode === 'list' ? 'bg-wa-red text-white border-wa-red' : darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}>List View</button>
            </div>
          </div>

          {/* Map and List Grid */}
          <div className="max-w-7xl mx-auto relative">
            <div className="grid lg:grid-cols-2 min-h-[600px]">
              {/* Map (mobile) */}
              <div className={`lg:hidden ${viewMode === 'map' ? 'block' : 'hidden'} h-[450px]`}>
                {!loading && !error && <Map bars={bars} selectedBar={selectedBar} hoveredBar={hoveredBar} onBarSelect={setSelectedBar} onBarHover={setHoveredBar} selectedState={selectedState} userLocation={userLocation} showHeatmap={showHeatmap} barCrawlBars={barCrawlBars} darkMode={darkMode} />}
              </div>

              {/* Bar List */}
              <div className={`lg:block ${viewMode === 'list' ? 'block' : 'hidden lg:block'} h-[600px] lg:h-[700px] overflow-hidden`}>
                {loading ? (
                  <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <div key={i} className={`animate-pulse h-32 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />)}</div>
                ) : (
                  <BarList bars={bars} selectedBar={selectedBar} hoveredBar={hoveredBar} onBarSelect={setSelectedBar} onBarHover={setHoveredBar} searchQuery={searchQuery} selectedState={selectedState} userLocation={userLocation} barCrawlBars={barCrawlBars} onToggleBarCrawl={handleToggleBarCrawl} sortBy={sortBy} />
                )}
              </div>

              {/* Map (desktop) */}
              <div className="hidden lg:block h-[700px] sticky top-[104px]">
                {loading ? (
                  <div className={`w-full h-full animate-pulse flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}><p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading map...</p></div>
                ) : error ? (
                  <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}><p className="text-red-500">{error}</p></div>
                ) : (
                  <Map bars={bars} selectedBar={selectedBar} hoveredBar={hoveredBar} onBarSelect={setSelectedBar} onBarHover={setHoveredBar} selectedState={selectedState} userLocation={userLocation} showHeatmap={showHeatmap} barCrawlBars={barCrawlBars} darkMode={darkMode} />
                )}
              </div>
            </div>

            {/* Bar Crawl Panel */}
            {showBarCrawlPanel && barCrawlBars.length > 0 && (
              <div className={`bar-crawl-panel fixed bottom-4 right-4 lg:absolute lg:bottom-4 lg:right-4 w-80 max-h-96 rounded-xl shadow-2xl border overflow-hidden z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="bg-wa-red text-white px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      <span className="font-semibold">My Bar Crawl</span>
                    </div>
                    <button onClick={() => setShowBarCrawlPanel(false)} className="p-1 hover:bg-white/20 rounded transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  {barCrawlBars.length >= 2 && barCrawlDistance > 0 && (
                    <div className="mt-2 flex items-center gap-4 text-white/90 text-xs">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                        {barCrawlBars.length} stops
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        {barCrawlDistance.toFixed(1)} mi total
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-4 max-h-64 overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  {barCrawlBars.map((bar, index) => (
                    <div key={bar.id} className={`flex items-start gap-3 py-2 border-b last:border-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <span className="flex-shrink-0 w-6 h-6 bg-wa-red text-white rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{bar.name}</p>
                        <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{bar.address}</p>
                      </div>
                      <button onClick={() => handleToggleBarCrawl(bar)} className={`flex-shrink-0 p-1 transition-colors ${darkMode ? 'text-gray-500 hover:text-wa-red' : 'text-gray-400 hover:text-wa-red'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className={`p-4 border-t ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex gap-2">
                    <button onClick={handleClearBarCrawl} className={`flex-1 py-2 px-3 text-sm font-medium border rounded-lg transition-colors ${darkMode ? 'text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700' : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'}`}>Clear All</button>
                    <button onClick={handleShareBarCrawl} className="flex-1 py-2 px-3 text-sm font-medium text-white bg-wa-red rounded-lg hover:bg-wa-red-dark transition-colors flex items-center justify-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      Share
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <OdeSection />
        <CocktailSection cocktails={cocktails} />
        <SponsorsSection />
      </main>

      <Footer />

      {/* Share Modal */}
      {showShareModal && <ShareModal url={getShareUrl()} onClose={() => setShowShareModal(false)} />}

      {/* Toast Notification */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
