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
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-content-premium bg-white max-w-5xl w-full max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border border-gray-100">
        <div className="grid md:grid-cols-2 h-full max-h-[90vh]">
          {/* Image */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-700 relative overflow-hidden">
            <div className="absolute inset-0">
              <Image
                src={imageUrl}
                alt={cocktail.name}
                fill
                className="object-cover opacity-90"
              />
            </div>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-10 relative overflow-y-auto">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 z-10"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-2">
              <span className="text-wa-red text-xs font-bold uppercase tracking-widest">Classic Cocktail</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-medium text-gray-900 mb-8 pr-12">
              {cocktail.name}
            </h2>

            <div className="grid sm:grid-cols-2 gap-8 mb-10">
              <div className="relative">
                <div className="absolute -top-1 -left-1 w-12 h-12 bg-wa-red/10 rounded-lg"></div>
                <div className="relative bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-wa-red mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 bg-wa-red rounded-full"></span>
                    The O.G.
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {cocktail.ogRecipe}
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -top-1 -left-1 w-12 h-12 bg-wa-gold/10 rounded-lg"></div>
                <div className="relative bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-wa-red mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 bg-wa-gold rounded-full"></span>
                    The Fresh Take
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {cocktail.freshTake}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <a
                href={cocktail.shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 bg-wa-red text-white px-8 py-4 text-sm font-semibold uppercase tracking-wider hover:bg-wa-red-dark transition-all duration-300 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span>Shop Now</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              
              <button
                onClick={handleShare}
                disabled={isSharing}
                className={`group inline-flex items-center gap-2 px-6 py-4 text-sm font-semibold uppercase tracking-wider transition-all duration-300 rounded-lg border-2 ${
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
  );
}
