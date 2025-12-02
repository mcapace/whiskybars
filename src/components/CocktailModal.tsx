'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Cocktail } from '@/types';

interface CocktailModalProps {
  cocktail: Cocktail;
  imageUrl: string;
  onClose: () => void;
}

export default function CocktailModal({ cocktail, imageUrl, onClose }: CocktailModalProps) {
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
            {/* Decorative elements */}
            <div className="absolute top-6 left-6 right-6">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                <span className="text-white text-xs font-bold uppercase tracking-widest">Recipe</span>
              </div>
            </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
