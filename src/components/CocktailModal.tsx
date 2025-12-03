'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Cocktail } from '@/types';
import { shareContent, getCocktailShareUrl } from '@/utils/share';

interface CocktailModalProps {
  cocktail: Cocktail;
  imageUrl: string;
  onClose: () => void;
}

export default function CocktailModal({ cocktail, imageUrl, onClose }: CocktailModalProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'og' | 'fresh'>('og');

  // Close on escape key
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
    
    const shareUrl = getCocktailShareUrl(cocktail.id);
    const success = await shareContent({
      title: `${cocktail.name} Recipe - Whisky Advocate`,
      text: `Check out the recipe for ${cocktail.name} - a classic cocktail with a fresh take!`,
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
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-content-premium bg-white w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[95vh] sm:rounded-2xl shadow-2xl border-0 sm:border border-gray-100 flex flex-col sm:flex-row overflow-hidden">
        {/* Image section - full bleed, larger on desktop */}
        <div className="relative w-full sm:w-[55%] h-[300px] sm:h-auto bg-gray-100 flex-shrink-0">
          <Image
            src={imageUrl}
            alt={cocktail.name}
            fill
            className="object-cover sm:object-cover"
          />
          
          {/* Gradient overlay for mobile title */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:hidden" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white hover:text-gray-200 hover:bg-black/30 rounded-full transition-all duration-200 z-10 backdrop-blur-sm"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Title overlay - mobile only */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:hidden">
            <div className="mb-1">
              <span className="text-white/90 text-xs font-bold uppercase tracking-widest">Classic Cocktail</span>
            </div>
            <h2 className="font-serif text-3xl font-medium text-white drop-shadow-lg">
              {cocktail.name}
            </h2>
          </div>
        </div>

        {/* Content section - compact */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header for desktop */}
          <div className="hidden sm:block p-6 sm:p-8 pb-4 border-b border-gray-200">
            <div className="mb-2">
              <span className="text-wa-red text-xs font-bold uppercase tracking-widest">Classic Cocktail</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-gray-900">
              {cocktail.name}
            </h2>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 sm:p-8">
              {/* Tab switcher */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('og')}
                  className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-all relative ${
                    activeTab === 'og'
                      ? 'text-wa-red'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  The O.G.
                  {activeTab === 'og' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-wa-red" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('fresh')}
                  className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-all relative ${
                    activeTab === 'fresh'
                      ? 'text-wa-red'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  The Fresh Take
                  {activeTab === 'fresh' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-wa-red" />
                  )}
                </button>
              </div>

              {/* Content based on active tab - fixed height to prevent size changes */}
              <div className="h-[200px] sm:h-[250px] mb-6">
                <div className="h-full overflow-y-auto">
                  {activeTab === 'og' ? (
                    <div className="bg-gray-50 p-5 sm:p-6 rounded-lg border border-gray-200">
                      <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line leading-relaxed">
                        {cocktail.ogRecipe}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-5 sm:p-6 rounded-lg border border-gray-200">
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                        {cocktail.freshTake}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons - compact */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href={cocktail.shopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-wa-red text-white px-6 py-3 sm:px-8 sm:py-4 text-sm font-semibold uppercase tracking-wider hover:bg-wa-red-dark transition-all duration-300 rounded-lg shadow-lg hover:shadow-xl"
                >
                  <span>Shop Now</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-6 sm:py-4 text-sm font-semibold uppercase tracking-wider transition-all duration-300 rounded-lg border-2 ${
                    shareSuccess
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-wa-red text-wa-red hover:bg-wa-red hover:text-white'
                  } disabled:opacity-50`}
                >
                  {shareSuccess ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Shared!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>Share Recipe</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
