'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Bar } from '@/types';
import { shareContent, getBarShareUrl } from '@/utils/share';
import MiniMapPreview from './MiniMapPreview';

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
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSharing(true);
    
    const shareUrl = getBarShareUrl(bar.id);
    const success = await shareContent({
      title: `${bar.name} - Whisky Advocate`,
      text: `Check out ${bar.name} in ${bar.state} - ${bar.description.substring(0, 100)}...`,
      url: shareUrl,
    });

    if (success) {
      setShareSuccess(true);
      setTimeout(() => {
        setShareSuccess(false);
      }, 2000);
    }
    setIsSharing(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking on a link or button, don't select
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) {
      return;
    }
    // Select the bar (this will trigger map navigation)
    onSelect();
  };

  return (
    <>
    <div
      className={`bar-card premium-card card-lift group relative bg-white rounded-xl transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? 'ring-2 ring-wa-red shadow-premium scale-[1.02]'
          : isHovered
          ? 'shadow-lg scale-[1.01] ring-1 ring-wa-red/30'
          : 'shadow-sm hover:shadow-md'
      }`}
      onClick={handleCardClick}
      onMouseEnter={() => {
        onHover(true);
        setShowMapPreview(true);
      }}
      onMouseLeave={() => {
        onHover(false);
        setShowMapPreview(false);
      }}
    >
      {/* Selected/Hovered accent bar with gradient */}
      <div
        className={`gradient-accent absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
          isSelected ? 'opacity-100' : isHovered ? 'opacity-70' : 'opacity-0'
        }`}
      />

      {/* Crawl indicator */}
      {isInCrawl && (
        <div className="absolute top-3 right-3 z-10 w-7 h-7 bg-wa-red text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
          {crawlIndex}
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 pl-5">
        {/* Header with glass image and number */}
        <div className="flex items-start gap-3 mb-2">
          {/* Glass image with number overlay and glow - transforms to mini-map on hover */}
          <div className={`glass-glow flex-shrink-0 w-16 h-20 relative transition-all duration-300 ${isHovered || isSelected ? 'scale-110' : ''}`}>
            {/* Glass icon - fades out on hover */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${showMapPreview ? 'opacity-0' : 'opacity-100'}`}>
              <Image
                src="/map-logos/Glencairn-Edit.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>

            {/* Mini-map preview - fades in on hover */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${showMapPreview ? 'opacity-100' : 'opacity-0'}`}>
              {showMapPreview && bar.coordinates.lat && bar.coordinates.lng && (
                <MiniMapPreview
                  lat={bar.coordinates.lat}
                  lng={bar.coordinates.lng}
                  name={bar.name}
                  className="w-full h-full"
                />
              )}
            </div>

            {/* Number badge */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-wa-red text-white rounded-full flex items-center justify-center text-base font-bold shadow-lg border-2 border-white z-10">
              {index + 1}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-xl font-semibold text-gray-900 group-hover:text-wa-red transition-colors leading-tight">
                {bar.name}
              </h3>
              {distance !== null && distance !== undefined && (
                <span className="flex-shrink-0 text-sm font-medium text-wa-red bg-wa-red/10 px-2 py-1 rounded-full whitespace-nowrap">
                  {distance < 1 ? `${(distance * 5280).toFixed(0)} ft` : `${distance.toFixed(1)} mi`}
                </span>
              )}
            </div>
            <p className="text-base text-gray-500 mt-0.5">{bar.address}</p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-3 ml-[76px]">
          <p className="text-base text-gray-600 whitespace-pre-line">
            {bar.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3 ml-[76px]">
          <span className="text-sm px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium">
            {bar.state}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 ml-[76px]">
          <div className="flex items-center gap-3">
            {bar.website && (
              <a
                href={`https://${bar.website}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-medium text-gray-600 hover:text-wa-red transition-colors flex items-center gap-1"
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
                className="text-sm font-medium text-gray-600 hover:text-wa-red transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Menu
              </a>
            )}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="text-sm font-medium text-gray-600 hover:text-wa-red transition-colors flex items-center gap-1 disabled:opacity-50"
              title="Share this bar"
            >
              {shareSuccess ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </>
              )}
            </button>
          </div>

          {/* Add to crawl button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCrawl();
            }}
            className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1.5 rounded-lg transition-all ${
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
    </>
  );
}
