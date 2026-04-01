'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Cocktail } from '@/types';
import CocktailModal from './CocktailModal';
import JwPlayerEmbed from './JwPlayerEmbed';

interface CocktailSectionProps {
  cocktails: Cocktail[];
  darkMode?: boolean;
}

// Cocktail images from local directory
const cocktailImages: Record<string, string> = {
  manhattan: '/images/cocktails/TheManhattan.jpg',
  highball: '/images/cocktails/TheHighball.jpg',
  robroy: '/images/cocktails/TheRobRoy.jpg',
  oldfashioned: '/images/cocktails/TheOldFashioned.jpg',
  boulevardier: '/images/cocktails/TheBoulevardier.jpg',
  goldrush: '/images/cocktails/TheGoldRush.jpg',
};

export default function CocktailSection({ cocktails, darkMode = false }: CocktailSectionProps) {
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);

  return (
    <section className={`py-20 sm:py-28 relative overflow-hidden gradient-mesh-warm ${darkMode ? 'border-y border-[var(--apex-line)]' : ''}`}>
      {/* Decorative background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-teal-500/8 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-apex-violet/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <p className="reveal font-mono text-[10px] md:text-xs tracking-[0.28em] uppercase text-apex-cyan/90 mb-5">
            Recipe lab
          </p>
          <h2 className="reveal font-serif text-4xl sm:text-5xl md:font-medium text-[var(--apex-ink)] mb-6">
            Elevating the Classics
          </h2>
          <div className="reveal reveal-delay-1 section-divider w-20 mx-auto mb-6" />
          <p className="reveal reveal-delay-2 text-[var(--apex-muted)] max-w-2xl mx-auto text-lg">
            Six iconic cocktails, each paired with the original recipe and a bartender&apos;s fresh take.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {cocktails.map((cocktail, index) => (
            <CocktailCard
              key={cocktail.id}
              cocktail={cocktail}
              imageUrl={cocktailImages[cocktail.id] || '/images/cocktails/default.jpg'}
              index={index}
              onClick={() => setSelectedCocktail(cocktail)}
            />
          ))}
        </div>

        <JwPlayerEmbed />
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

interface CocktailCardProps {
  cocktail: Cocktail;
  imageUrl: string;
  index: number;
  onClick: () => void;
}

function CocktailCard({ cocktail, imageUrl, index, onClick }: CocktailCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    card.style.setProperty('--rotate-x', `${rotateX}deg`);
    card.style.setProperty('--rotate-y', `${rotateY}deg`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    card.style.setProperty('--rotate-x', '0deg');
    card.style.setProperty('--rotate-y', '0deg');
  };

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="cocktail-card-premium group relative"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glow effect */}
      <div className="cocktail-card-glow"></div>

      {/* Main card */}
      <div className="cocktail-card-inner relative h-full rounded-2xl overflow-hidden shadow-lg border bg-[var(--apex-surface)] border-[var(--apex-line)]">
        {/* Image container with overlay */}
        <div className="aspect-square bg-[var(--apex-line)] relative overflow-hidden">
          <Image
            src={imageUrl}
            alt={cocktail.name}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Shine effect */}
          <div className="cocktail-card-shine"></div>

          {/* Floating badge */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
              <span className="text-xs font-bold text-wa-red uppercase tracking-wider">View Recipe</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 relative">
          {/* Accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-wa-red via-wa-gold to-wa-red transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

          <h3 className="font-serif text-2xl font-medium text-[var(--apex-ink)] group-hover:text-wa-red transition-colors duration-300 mb-2">
            {cocktail.name}
          </h3>

          {/* Hover indicator */}
          <div className="mt-4 flex items-center text-apex-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono text-xs tracking-wide">
            <span className="font-semibold mr-2 uppercase">Explore recipe</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Border glow */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-wa-red/30 transition-colors duration-300 pointer-events-none"></div>
      </div>
    </button>
  );
}
