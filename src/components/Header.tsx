'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen]);

  const navItems = [
    {
      label: 'Ratings & Reviews',
      href: 'https://whiskyadvocate.com/ratings-reviews',
    },
    {
      label: 'Whisky Life',
      href: 'https://whiskyadvocate.com/category/whisky-life',
      submenu: [
        { label: 'Cocktails', href: 'https://whiskyadvocate.com/category/cocktails' },
        { label: 'Gear', href: 'https://whiskyadvocate.com/category/gear' },
        { label: 'Travel', href: 'https://whiskyadvocate.com/category/travel' },
        { label: 'Food', href: 'https://whiskyadvocate.com/category/food' },
      ],
    },
    {
      label: 'WhiskyFest',
      href: 'https://whiskyadvocate.com/whiskyfest',
    },
    {
      label: 'News',
      href: 'https://whiskyadvocate.com/category/news',
      submenu: [
        { label: 'Latest News', href: 'https://whiskyadvocate.com/category/news' },
        { label: 'Whisky Weekend', href: 'https://whiskyadvocate.com/category/whisky-weekend' },
        { label: 'Dispatches', href: 'https://whiskyadvocate.com/category/dispatches' },
        { label: 'Insights', href: 'https://whiskyadvocate.com/category/insights' },
      ],
    },
    {
      label: 'Whisky 101',
      href: 'https://whiskyadvocate.com/whisky-101',
      submenu: [
        { label: 'Basics', href: 'https://whiskyadvocate.com/whisky-101' },
        { label: 'How To', href: 'https://whiskyadvocate.com/category/how-to' },
        { label: 'Instant Expert', href: 'https://whiskyadvocate.com/category/instant-expert' },
        { label: 'Glossary', href: 'https://whiskyadvocate.com/whisky-glossary' },
      ],
    },
    {
      label: 'Videos',
      href: 'https://whiskyadvocate.com/videos',
    },
    {
      label: 'Top 20',
      href: 'https://whiskyadvocate.com/top20',
    },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
        }`}
      >
        {/* Top border - light brown */}
        <div className="hidden lg:block h-1 bg-wa-brown"></div>

        {/* Main header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20 gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-gray-700 flex-shrink-0"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="relative h-10 w-32 lg:h-12 lg:w-40">
                <Image
                  src={isScrolled ? "/images/logos/wa-blue.png" : "/images/logos/wa-white.png"}
                  alt="Whisky Advocate"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center flex-1 justify-center mx-4">
              {navItems.map((item, index) => (
                <div key={item.label} className="relative group flex items-center">
                  {index > 0 && (
                    <span className="text-wa-red mx-1.5 text-[8px] leading-none">◆</span>
                  )}
                  <a
                    href={item.href}
                    className="px-2 py-2 text-sm font-serif font-bold text-gray-900 hover:text-wa-red transition-colors whitespace-nowrap"
                  >
                    {item.label}
                    {item.submenu && (
                      <svg
                        className="inline-block w-2.5 h-2.5 ml-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </a>
                  {item.submenu && (
                    <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-white shadow-lg rounded-md border border-gray-100 py-2 min-w-[180px]">
                        {item.submenu.map((subitem) => (
                          <a
                            key={subitem.label}
                            href={subitem.href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-wa-red"
                          >
                            {subitem.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <span className="text-wa-red mx-1.5 text-[8px] leading-none">◆</span>
              <Link
                href="/"
                className="px-2 py-2 text-sm font-serif font-bold text-gray-900 hover:text-wa-red transition-colors whitespace-nowrap"
              >
                Top Whisky Bars
              </Link>
            </nav>

            {/* Buttons and Search */}
            <div className="hidden lg:flex items-center flex-shrink-0 gap-0">
              <a
                href="https://whiskyadvocate.com/subscribe"
                className="bg-wa-cream border border-wa-red text-wa-red px-4 py-2 text-xs font-serif font-bold uppercase tracking-wider hover:bg-wa-cream/80 transition-colors whitespace-nowrap w-28 h-9 flex items-center justify-center"
              >
                Subscribe
              </a>
              <a
                href="https://store.whiskyadvocate.com"
                className="bg-wa-red text-wa-cream px-4 py-2 text-xs font-serif font-bold uppercase tracking-wider hover:bg-wa-red-dark transition-colors whitespace-nowrap w-28 h-9 flex items-center justify-center"
              >
                Visit Store
              </a>
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-gray-700 hover:text-wa-red transition-colors ml-2 flex-shrink-0"
                aria-label="Search"
              >
                <svg
                  className="w-5 h-5"
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
              </button>
            </div>
            
            {/* Mobile search button */}
            <div className="lg:hidden flex items-center flex-shrink-0">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-gray-700 hover:text-wa-red transition-colors"
                aria-label="Search"
              >
                <svg
                  className="w-5 h-5"
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
              </button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        {isSearchOpen && (
          <div className="border-t border-gray-200 bg-wa-cream">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search whiskyadvocate.com..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wa-red focus:border-transparent bg-white"
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 lg:hidden overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
              <div className="relative h-10 w-32">
                <Image
                  src={isScrolled ? "/images/logos/wa-blue.png" : "/images/logos/wa-white.png"}
                  alt="Whisky Advocate"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <nav className="p-4">
              {navItems.map((item) => (
                <div key={item.label} className="border-b border-gray-100">
                  <a
                    href={item.href}
                    className="block py-3 text-gray-800 font-medium"
                  >
                    {item.label}
                  </a>
                  {item.submenu && (
                    <div className="pl-4 pb-3">
                      {item.submenu.map((subitem) => (
                        <a
                          key={subitem.label}
                          href={subitem.href}
                          className="block py-2 text-sm text-gray-600"
                        >
                          {subitem.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Link
                href="/"
                className="block py-3 text-wa-red font-bold border-b border-gray-100"
              >
                Top Whisky Bars
              </Link>
            </nav>
            <div className="p-4 space-y-3">
              <a
                href="https://whiskyadvocate.com/subscribe"
                className="block w-full bg-wa-red text-white text-center py-3 font-bold uppercase tracking-wider"
              >
                Subscribe
              </a>
              <a
                href="https://store.whiskyadvocate.com"
                className="block w-full bg-gray-900 text-white text-center py-3 font-bold uppercase tracking-wider"
              >
                Visit Store
              </a>
            </div>
          </div>
        </>
      )}

      {/* Spacer for fixed header */}
      <div className="h-16 lg:h-[81px]" />
    </>
  );
}
