'use client';

import { Bar } from '@/types';

interface BarCardProps {
  bar: Bar;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  distance?: number | null;
  isInCrawl: boolean;
  crawlIndex?: number;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
  onToggleCrawl: () => void;
}

export default function BarCard({
  bar,
  index,
  isSelected,
  isHovered,
  distance,
  isInCrawl,
  crawlIndex,
  onSelect,
  onHover,
  onToggleCrawl,
}: BarCardProps) {
  return (
    <div
      className={`bar-card group relative bg-white rounded-xl transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? 'ring-2 ring-wa-red shadow-lg scale-[1.02]'
          : isHovered
          ? 'shadow-lg scale-[1.01] ring-1 ring-wa-red/30'
          : 'shadow-sm hover:shadow-md'
      }`}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Crawl indicator */}
      {isInCrawl && (
        <div className="absolute top-3 left-3 z-10 w-7 h-7 bg-wa-red text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
          {crawlIndex}
        </div>
      )}

      {/* Card Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-semibold text-gray-900 truncate group-hover:text-wa-red transition-colors">
              {bar.name}
            </h3>
            <p className="text-sm text-gray-500 truncate">{bar.address}</p>
          </div>
          {distance !== null && distance !== undefined && (
            <span className="flex-shrink-0 text-xs font-medium text-wa-red bg-wa-red/10 px-2 py-1 rounded-full">
              {distance < 1 ? `${(distance * 5280).toFixed(0)} ft` : `${distance.toFixed(1)} mi`}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {bar.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
            {bar.state}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {bar.website && (
              <a
                href={`https://${bar.website}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-medium text-gray-600 hover:text-wa-red transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Website
              </a>
            )}
            {bar.whiskyList && (
              <a
                href={bar.whiskyList}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-medium text-gray-600 hover:text-wa-red transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Menu
              </a>
            )}
          </div>

          {/* Add to crawl button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCrawl();
            }}
            className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
              isInCrawl
                ? 'bg-wa-red text-white hover:bg-wa-red-dark'
                : 'bg-gray-100 text-gray-600 hover:bg-wa-red hover:text-white'
            }`}
          >
            {isInCrawl ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                In Crawl
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
