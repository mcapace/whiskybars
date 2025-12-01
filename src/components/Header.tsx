'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex flex-col">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
              Whisky
            </span>
            <span className="text-[10px] tracking-[3px] uppercase text-gray-500 -mt-1">
              Advocate
            </span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-4">
            <a
              href="https://whiskyadvocate.com/subscribe"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-whisky-red text-white px-3 sm:px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-whisky-red-dark transition-colors"
            >
              Subscribe
            </a>
            <a
              href="https://store.whiskyadvocate.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-900 text-white px-3 sm:px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-gray-800 transition-colors"
            >
              Shop
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
