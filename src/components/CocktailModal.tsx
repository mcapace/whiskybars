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
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-content bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="bg-gray-100 relative aspect-square md:aspect-auto">
            <Image
              src={imageUrl}
              alt={cocktail.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl font-light leading-none"
              aria-label="Close modal"
            >
              &times;
            </button>

            <h2 className="font-serif text-3xl font-medium text-gray-900 mb-8 pr-8">
              {cocktail.name}
            </h2>

            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-whisky-red mb-4">
                  The O.G.
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                  {cocktail.ogRecipe}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-whisky-red mb-4">
                  The Fresh Take
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {cocktail.freshTake}
                </p>
              </div>
            </div>

            <a
              href={cocktail.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-whisky-red text-white px-8 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-whisky-red-dark transition-colors"
            >
              Shop Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
