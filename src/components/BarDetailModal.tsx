'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Bar } from '@/types';
import { shareContent, getBarShareUrl } from '@/utils/share';
import { useState } from 'react';

interface BarDetailModalProps {
  bar: Bar;
  index: number;
  distance?: number | null;
  onClose: () => void;
}

export default function BarDetailModal({ bar, index, distance, onClose }: BarDetailModalProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleShare = async () => {
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

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-content-premium bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-100">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-20">
              <Image
                src="/map-logos/AdobeStock_271951404.png"
                alt=""
                fill
                className="object-contain"
              />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-wa-red text-white rounded-full flex items-center justify-center text-base font-bold shadow-lg border-2 border-white">
                {index + 1}
              </div>
            </div>
            <div>
              <h2 className="font-serif text-2xl font-semibold text-gray-900">{bar.name}</h2>
              <p className="text-base text-gray-500">{bar.address}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Distance */}
          {distance !== null && distance !== undefined && (
            <div className="mb-4 inline-block">
              <span className="text-sm font-medium text-wa-red bg-wa-red/10 px-3 py-1.5 rounded-full">
                {distance < 1 ? `${(distance * 5280).toFixed(0)} ft away` : `${distance.toFixed(1)} mi away`}
              </span>
            </div>
          )}

          {/* Full Description */}
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-wa-red mb-3">About</h3>
            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
              {bar.description}
            </p>
          </div>

          {/* State Tag */}
          <div className="mb-6">
            <span className="text-sm px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full font-medium">
              {bar.state}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-200">
            {bar.website && (
              <a
                href={`https://${bar.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-wa-red text-white rounded-lg font-semibold hover:bg-wa-red-dark transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Visit Website
              </a>
            )}
            {bar.whiskyList && (
              <a
                href={bar.whiskyList}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-wa-red text-wa-red rounded-lg font-semibold hover:bg-wa-red/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Whisky Menu
              </a>
            )}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className={`inline-flex items-center gap-2 px-6 py-3 border-2 rounded-lg font-semibold transition-all ${
                shareSuccess
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:border-wa-red hover:text-wa-red'
              } disabled:opacity-50`}
            >
              {shareSuccess ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Shared!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

