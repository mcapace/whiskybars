'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Cocktail } from '@/types';
import CocktailModal from './CocktailModal';

interface CocktailSectionProps {
  cocktails: Cocktail[];
}

// Placeholder images for cocktails (using Unsplash)
const cocktailImages: Record<string, string> = {
  manhattan: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=400&fit=crop',
  highball: 'https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=400&h=400&fit=crop',
  robroy: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=400&fit=crop',
  oldfashioned: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=400&fit=crop',
  boulevardier: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=400&fit=crop',
  goldrush: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&h=400&fit=crop',
};

export default function CocktailSection({ cocktails }: CocktailSectionProps) {
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);

  return (
    <section className="py-16 sm:py-24 bg-whisky-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-gray-900 mb-4">
            Elevating the Classics
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Six iconic cocktails, each paired with the original recipe and a bartender's fresh take.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {cocktails.map(cocktail => (
            <button
              key={cocktail.id}
              onClick={() => setSelectedCocktail(cocktail)}
              className="cocktail-card bg-white rounded-lg overflow-hidden text-left group"
            >
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <Image
                  src={cocktailImages[cocktail.id] || '/images/cocktails/default.jpg'}
                  alt={cocktail.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 sm:p-6">
                <h3 className="font-serif text-xl font-medium text-gray-900 group-hover:text-whisky-red transition-colors">
                  {cocktail.name}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedCocktail && (
        <CocktailModal
          cocktail={selectedCocktail}
          imageUrl={cocktailImages[selectedCocktail.id]}
          onClose={() => setSelectedCocktail(null)}
        />
      )}
    </section>
  );
}
